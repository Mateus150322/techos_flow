<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ColaboradorOperacional;
use App\Models\EscalaPlantao;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EscalaPlantaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->normalizarMes($request);

        $data = $request->validate([
            'ano' => ['nullable', 'integer', 'between:2000,2100'],
            'mes' => ['nullable', 'integer', 'between:1,12'],
            'status' => ['nullable', 'string', 'in:ativos,inativos,todos'],
        ]);

        $query = EscalaPlantao::query()
            ->with(['funcionario:id,name,role', 'colaboradorOperacional:id,name,funcao'])
            ->orderBy('data_inicio');

        if (! empty($data['ano'])) {
            $inicio = CarbonImmutable::create((int) $data['ano'], (int) ($data['mes'] ?? 1), 1)->startOfDay();
            $fim = ! empty($data['mes']) ? $inicio->endOfMonth()->endOfDay() : $inicio->endOfYear()->endOfDay();

            $query
                ->where('data_inicio', '<=', $fim)
                ->where('data_fim', '>=', $inicio);
        }

        if (($data['status'] ?? 'ativos') !== 'todos') {
            $query->where('ativo', ($data['status'] ?? 'ativos') === 'ativos');
        }

        $escalas = $query->get();

        return response()->json([
            'data' => $escalas->map(fn (EscalaPlantao $escala) => $this->resource($escala))->values(),
            'stats' => [
                'total' => $escalas->count(),
                'ativas' => $escalas->where('ativo', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatedPayload($request);
        $escala = EscalaPlantao::query()->create($payload);

        return response()->json($this->resource($escala->load(['funcionario', 'colaboradorOperacional'])), 201);
    }

    public function update(Request $request, EscalaPlantao $escalaPlantao): JsonResponse
    {
        $payload = $this->validatedPayload($request, partial: true);
        $escalaPlantao->update($payload);

        return response()->json($this->resource($escalaPlantao->fresh(['funcionario', 'colaboradorOperacional'])));
    }

    public function destroy(EscalaPlantao $escalaPlantao): JsonResponse
    {
        $escalaPlantao->delete();

        return response()->json([
            'message' => 'Escala de plantao removida.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        $data = $request->validate([
            'participante_id' => [$required, 'uuid'],
            'tipo_vinculo' => [$required, 'string', 'in:usuario,colaborador_operacional'],
            'descricao' => [$required, 'string', 'max:150'],
            'funcao_escala' => ['sometimes', 'string', 'in:mecanico,auxiliar_mecanica,outro'],
            'data_inicio' => [$required, 'date'],
            'data_fim' => [$required, 'date', 'after:data_inicio'],
            'ativo' => ['sometimes', 'boolean'],
            'observacao' => ['nullable', 'string', 'max:1000'],
        ]);

        if (isset($data['participante_id'], $data['tipo_vinculo'])) {
            if ($data['tipo_vinculo'] === 'usuario') {
                $exists = User::query()
                    ->where('id', $data['participante_id'])
                    ->whereIn('role', ['tecnico', 'administrador'])
                    ->where('is_active', true)
                    ->exists();

                if (! $exists) {
                    throw ValidationException::withMessages([
                        'participante_id' => 'Selecione um usuario tecnico ou administrador ativo.',
                    ]);
                }

                $data['funcionario_id'] = $data['participante_id'];
                $data['colaborador_operacional_id'] = null;
            } else {
                $exists = ColaboradorOperacional::query()
                    ->where('id', $data['participante_id'])
                    ->where('is_active', true)
                    ->exists();

                if (! $exists) {
                    throw ValidationException::withMessages([
                        'participante_id' => 'Selecione um colaborador operacional ativo.',
                    ]);
                }

                $data['funcionario_id'] = null;
                $data['colaborador_operacional_id'] = $data['participante_id'];
            }
        }

        unset($data['participante_id'], $data['tipo_vinculo']);

        return $data;
    }

    private function normalizarMes(Request $request): void
    {
        $mes = $request->input('mes');

        if (is_string($mes) && preg_match('/^\d{1,2}$/', $mes)) {
            $request->merge(['mes' => (int) $mes]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(EscalaPlantao $escala): array
    {
        return [
            'id' => $escala->id,
            'participante_id' => $escala->participanteId(),
            'tipo_vinculo' => $escala->participanteTipoVinculo(),
            'participante_nome' => $escala->participanteNome(),
            'descricao' => $escala->descricao,
            'funcao_escala' => $escala->funcao_escala,
            'data_inicio' => $escala->data_inicio?->toISOString(),
            'data_fim' => $escala->data_fim?->toISOString(),
            'ativo' => (bool) $escala->ativo,
            'observacao' => $escala->observacao,
        ];
    }
}
