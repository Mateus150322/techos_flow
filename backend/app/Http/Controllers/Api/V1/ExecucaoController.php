<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\ColaboradorOperacional;
use App\Models\Execucao;
use App\Models\OrdemServico;
use App\Models\User;
use App\Services\HorasExtras\HoraExtraService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExecucaoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'data_inicio' => 'nullable|date',
            'observacao' => 'nullable|string',
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

        $execucao = Execucao::create([
            'os_id' => $os->id,
            'tecnico_id' => $user->id,
            'data_inicio' => $data['data_inicio'] ?? now(),
            'observacao' => $data['observacao'] ?? null,
        ]);

        if ($os->status === 'aberta') {
            $os->status = 'em_execucao';
            $os->save();
        }

        return response()->json([
            'execucao' => $execucao,
            'os' => $os,
        ], 201);
    }

    public function finalizar(Request $request, string $id, HoraExtraService $horaExtraService)
    {
        $data = $request->validate([
            'execucao_id' => 'required|uuid|exists:execucoes,id',
            'data_fim' => 'nullable|date',
            'observacao' => 'nullable|string',
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

        $dataFimExecucao = CarbonImmutable::parse($data['data_fim'] ?? now());

        if ($dataFimExecucao->lessThan(CarbonImmutable::parse($execucao->data_inicio))) {
            throw ValidationException::withMessages([
                'data_fim' => 'A data final da execução deve ser maior ou igual à data de início.',
            ]);
        }

        $participantesPayload = $this->resolveFuncionariosPayload($data, $execucao);

        $participantes = DB::transaction(function () use (
            $data,
            $dataFimExecucao,
            $execucao,
            $horaExtraService,
            $os,
            $participantesPayload
        ) {
            $execucao->data_fim = $dataFimExecucao;

            if (! empty($data['observacao'])) {
                $execucao->observacao = $data['observacao'];
            }

            $execucao->save();

            $participantesRegistrados = $horaExtraService->registrarFuncionariosExecucao(
                $execucao->loadMissing('ordemServico.endereco'),
                $participantesPayload
            );

            $os->status = 'finalizada';
            $os->data_encerramento = now();
            $os->save();

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
     * @param array<string, mixed> $data
     * @return array<int, array<string, string|null>>
     */
    private function resolveFuncionariosPayload(array $data, Execucao $execucao): array
    {
        $funcionarios = collect($data['funcionarios'] ?? [])
            ->map(fn (mixed $item) => is_array($item) ? $item : [])
            ->values();

        if ($funcionarios->isEmpty()) {
            return [];
        }

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

        return $funcionarios
            ->map(function (array $funcionario) use ($execucao) {
                $inicio = ! empty($funcionario['data_inicio'])
                    ? CarbonImmutable::parse((string) $funcionario['data_inicio'])
                    : CarbonImmutable::parse($execucao->data_inicio);
                $fim = ! empty($funcionario['data_fim'])
                    ? CarbonImmutable::parse((string) $funcionario['data_fim'])
                    : CarbonImmutable::parse($execucao->data_fim);

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
                    'data_inicio' => ! empty($funcionario['data_inicio']) ? $inicio->toISOString() : null,
                    'data_fim' => ! empty($funcionario['data_fim']) ? $fim->toISOString() : null,
                ];
            })
            ->all();
    }
}
