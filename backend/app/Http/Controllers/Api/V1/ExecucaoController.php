<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\ColaboradorOperacional;
use App\Models\Execucao;
use App\Models\OrdemServico;
use App\Models\User;
use App\Services\Auditoria\OrdemServicoAuditService;
use App\Services\HorasExtras\FechamentoHoraExtraService;
use App\Services\HorasExtras\HoraExtraService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExecucaoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    public function __construct(
        private readonly OrdemServicoAuditService $auditService
    ) {}

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'data_inicio' => 'nullable|date',
            'observacao' => 'nullable|string',
            'client_operation_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if (in_array($os->status, ['finalizada', 'cancelada', 'nao_executada'], true)) {
            return response()->json([
                'message' => 'Não é possível iniciar execução para OS já encerrada.',
            ], 422);
        }

        if (! empty($data['client_operation_id'])) {
            $execucaoExistente = Execucao::query()
                ->where('client_operation_id', $data['client_operation_id'])
                ->where('os_id', $os->id)
                ->where('tecnico_id', $user->id)
                ->first();

            if ($execucaoExistente) {
                return response()->json([
                    'execucao' => $execucaoExistente,
                    'os' => $os,
                ]);
            }
        }

        $execucaoAberta = Execucao::query()
            ->where('os_id', $os->id)
            ->whereNull('data_fim')
            ->first();

        if ($execucaoAberta) {
            return response()->json([
                'message' => 'Já existe uma execução em andamento para esta OS.',
                'execucao' => $execucaoAberta,
            ], 422);
        }

        $execucao = DB::transaction(function () use ($data, $os, $user) {
            $statusAnterior = $os->status;
            $execucao = Execucao::create([
                'os_id' => $os->id,
                'tecnico_id' => $user->id,
                'data_inicio' => $data['data_inicio'] ?? now(),
                'observacao' => $data['observacao'] ?? null,
                'client_operation_id' => $data['client_operation_id'] ?? null,
            ]);

            if ($os->status === 'aberta') {
                $os->status = 'em_execucao';
                $os->save();
            }

            $this->auditService->registrar(
                $os,
                $user,
                'execucao_iniciada',
                'Execução técnica iniciada.',
                ['status' => $statusAnterior],
                [
                    'status' => $os->status,
                    'execucao_id' => $execucao->id,
                    'data_inicio' => $execucao->data_inicio?->toISOString(),
                ],
                $data['client_operation_id'] ?? null
            );

            return $execucao;
        });

        return response()->json([
            'execucao' => $execucao,
            'os' => $os,
        ], 201);
    }

    public function finalizar(
        Request $request,
        string $id,
        HoraExtraService $horaExtraService,
        FechamentoHoraExtraService $fechamentoHoraExtraService
    )
    {
        $data = $request->validate([
            'execucao_id' => 'required|uuid|exists:execucoes,id',
            'data_fim' => 'nullable|date',
            'observacao' => 'nullable|string',
            'diagnostico' => 'required|string',
            'procedimento' => 'required|string',
            'material_utilizado' => 'nullable|string',
            'client_operation_id' => 'nullable|uuid',
            'funcionarios' => 'nullable|array',
            'funcionarios.*.funcionario_id' => 'nullable|uuid',
            'funcionarios.*.colaborador_operacional_id' => 'nullable|uuid',
            'funcionarios.*.data_inicio' => 'nullable|date',
            'funcionarios.*.data_fim' => 'nullable|date',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if (! empty($data['client_operation_id'])) {
            $execucaoSincronizada = Execucao::query()
                ->where('finalizacao_client_operation_id', $data['client_operation_id'])
                ->where('os_id', $os->id)
                ->where('tecnico_id', $user->id)
                ->whereNotNull('data_fim')
                ->first();

            if ($execucaoSincronizada) {
                return response()->json([
                    'message' => 'Execucao ja sincronizada anteriormente.',
                    'execucao' => $execucaoSincronizada,
                    'participantes_registrados' => $execucaoSincronizada->execucaoFuncionarios()->count(),
                    'os' => $os,
                ]);
            }
        }

        if ($os->status !== 'em_execucao') {
            return response()->json([
                'message' => 'A OS precisa estar em execução para ser finalizada.',
            ], 422);
        }

        $execucao = Execucao::query()
            ->where('id', $data['execucao_id'])
            ->where('os_id', $os->id)
            ->where('tecnico_id', $user->id)
            ->firstOrFail();

        $podeRecuperarFinalizacao = $execucao->data_fim !== null
            && $os->status === 'em_execucao'
            && $execucao->execucaoFuncionarios()->doesntExist();

        if ($execucao->data_fim && ! $podeRecuperarFinalizacao) {
            return response()->json([
                'message' => 'Esta execução já foi finalizada.',
            ], 422);
        }

        $dataInicioExecucao = CarbonImmutable::parse($execucao->data_inicio);
        $dataInicioParticipantePadrao = $dataInicioExecucao;
        $dataFimExecucao = CarbonImmutable::parse($data['data_fim'] ?? now());
        $dataFimParticipantePadrao = $dataFimExecucao;

        if ($dataFimExecucao->lessThan($dataInicioExecucao)) {
            throw ValidationException::withMessages([
                'data_fim' => 'A data final da execução deve ser maior ou igual à data de início.',
            ]);
        }

        $execucao->data_fim = $dataFimExecucao;
        $participantesPayload = $this->resolveFuncionariosPayload(
            $data,
            $execucao,
            $dataInicioParticipantePadrao,
            $dataFimParticipantePadrao
        );
        $fechamentoHoraExtraService->assertPeriodoAberto($dataInicioExecucao, $dataFimExecucao);

        foreach ($participantesPayload as $participante) {
            $fechamentoHoraExtraService->assertPeriodoAberto(
                CarbonImmutable::parse($participante['data_inicio']),
                CarbonImmutable::parse($participante['data_fim'])
            );
        }

        $participantes = DB::transaction(function () use (
            $data,
            $dataFimExecucao,
            $execucao,
            $horaExtraService,
            $os,
            $participantesPayload,
            $user
        ) {
            $execucao->data_fim = $dataFimExecucao;

            if (! empty($data['observacao'])) {
                $execucao->observacao = $data['observacao'];
            }

            $execucao->diagnostico = $data['diagnostico'];
            $execucao->procedimento = $data['procedimento'];
            $execucao->material_utilizado = $data['material_utilizado'] ?? null;
            $execucao->finalizacao_client_operation_id =
                $data['client_operation_id'] ?? null;
            $execucao->save();

            $participantesRegistrados = $horaExtraService->registrarFuncionariosExecucao(
                $execucao->loadMissing('ordemServico.endereco'),
                $participantesPayload
            );

            $os->status = 'finalizada';
            $os->data_encerramento = $dataFimExecucao;
            $os->save();

            $this->auditService->registrar(
                $os,
                $user,
                'execucao_finalizada',
                'Execução concluída com diagnóstico e procedimento registrados.',
                ['status' => 'em_execucao'],
                [
                    'status' => $os->status,
                    'execucao_id' => $execucao->id,
                    'data_fim' => $dataFimExecucao->toISOString(),
                    'participantes_registrados' => $participantesRegistrados->count(),
                ],
                $data['client_operation_id'] ?? null
            );

            return $participantesRegistrados;
        });

        return response()->json([
            'message' => 'Execução finalizada e OS encerrada.',
            'execucao' => $execucao->fresh(),
            'participantes_registrados' => $participantes->count(),
            'os' => $os->fresh(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array<string, string|null>>
     */
    private function resolveFuncionariosPayload(
        array $data,
        Execucao $execucao,
        CarbonImmutable $dataInicioPadrao,
        CarbonImmutable $dataFimPadrao
    ): array {
        $funcionarios = collect($data['funcionarios'] ?? [])
            ->map(fn (mixed $item) => is_array($item) ? $item : [])
            ->values();

        foreach ($funcionarios as $funcionario) {
            $temUsuario = ! empty($funcionario['funcionario_id']);
            $temColaborador = ! empty($funcionario['colaborador_operacional_id']);

            if ($temUsuario === $temColaborador) {
                throw ValidationException::withMessages([
                    'funcionarios' => 'Informe um técnico/administrador ou um colaborador operacional em cada linha da equipe.',
                ]);
            }
        }

        $funcionarioIds = $funcionarios
            ->pluck('funcionario_id')
            ->filter(fn (mixed $id) => is_string($id) && $id !== '')
            ->values();

        $colaboradorIds = $funcionarios
            ->pluck('colaborador_operacional_id')
            ->filter(fn (mixed $id) => is_string($id) && $id !== '')
            ->values();

        $usuariosValidos = User::query()
            ->whereIn('id', $funcionarioIds)
            ->whereIn('role', ['tecnico', 'administrador'])
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        if (count($usuariosValidos) !== $funcionarioIds->unique()->count()) {
            throw ValidationException::withMessages([
                'funcionarios' => 'Selecione apenas usuários ativos com perfil técnico ou administrador.',
            ]);
        }

        $colaboradoresValidos = ColaboradorOperacional::query()
            ->whereIn('id', $colaboradorIds)
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        if (count($colaboradoresValidos) !== $colaboradorIds->unique()->count()) {
            throw ValidationException::withMessages([
                'funcionarios' => 'Selecione apenas colaboradores operacionais ativos.',
            ]);
        }

        $participantes = $funcionarios
            ->map(function (array $funcionario) use ($dataFimPadrao, $dataInicioPadrao) {
                $inicio = ! empty($funcionario['data_inicio'])
                    ? CarbonImmutable::parse((string) $funcionario['data_inicio'])
                    : $dataInicioPadrao;
                $fim = ! empty($funcionario['data_fim'])
                    ? CarbonImmutable::parse((string) $funcionario['data_fim'])
                    : $dataFimPadrao;

                if ($fim->lessThan($inicio)) {
                    throw ValidationException::withMessages([
                        'funcionarios' => 'O período informado para cada participante deve ter fim maior ou igual ao início.',
                    ]);
                }

                return [
                    'funcionario_id' => ! empty($funcionario['funcionario_id'])
                        ? (string) $funcionario['funcionario_id']
                        : null,
                    'colaborador_operacional_id' => ! empty($funcionario['colaborador_operacional_id'])
                        ? (string) $funcionario['colaborador_operacional_id']
                        : null,
                    'data_inicio' => $inicio->toISOString(),
                    'data_fim' => $fim->toISOString(),
                ];
            })
            ->values();

        if (! $participantes->contains(fn (array $participante) => $participante['funcionario_id'] === $execucao->tecnico_id)) {
            $participantes->prepend([
                'funcionario_id' => $execucao->tecnico_id,
                'colaborador_operacional_id' => null,
                'data_inicio' => $dataInicioPadrao->toISOString(),
                'data_fim' => $dataFimPadrao->toISOString(),
            ]);
        }

        return $participantes
            ->unique(fn (array $participante) => ! empty($participante['funcionario_id'])
                ? 'usuario:'.$participante['funcionario_id']
                : 'colaborador:'.($participante['colaborador_operacional_id'] ?? '')
            )
            ->values()
            ->all();
    }
}
