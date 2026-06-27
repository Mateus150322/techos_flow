<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Feriado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarioCorporativoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ano' => ['nullable', 'integer', 'between:2000,2100'],
            'tipo' => ['nullable', 'string', Rule::in(['feriado', 'ponto_facultativo'])],
            'status' => ['nullable', 'string', Rule::in(['ativos', 'inativos', 'todos'])],
        ]);

        $query = Feriado::query()->orderBy('data')->orderBy('nome');

        if (! empty($data['ano'])) {
            $query->where(function ($builder) use ($data) {
                $builder
                    ->whereYear('data', (int) $data['ano'])
                    ->orWhere('recorrente', true);
            });
        }

        if (! empty($data['tipo'])) {
            $query->where('tipo', $data['tipo']);
        }

        if (($data['status'] ?? 'ativos') !== 'todos') {
            $query->where('ativo', ($data['status'] ?? 'ativos') === 'ativos');
        }

        $itens = $query->get();

        return response()->json([
            'data' => $itens->map(fn (Feriado $feriado) => $this->resource($feriado))->values(),
            'stats' => [
                'total' => $itens->count(),
                'feriados' => $itens->where('tipo', 'feriado')->count(),
                'pontos_facultativos' => $itens->where('tipo', 'ponto_facultativo')->count(),
                'ativos' => $itens->where('ativo', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $feriado = Feriado::query()->create($this->validatedPayload($request));

        return response()->json($this->resource($feriado), 201);
    }

    public function update(Request $request, Feriado $calendarioCorporativo): JsonResponse
    {
        $calendarioCorporativo->update($this->validatedPayload($request, partial: true));

        return response()->json($this->resource($calendarioCorporativo->fresh()));
    }

    public function destroy(Feriado $calendarioCorporativo): JsonResponse
    {
        $calendarioCorporativo->delete();

        return response()->json([
            'message' => 'Data removida do calendario corporativo.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'nome' => [$required, 'string', 'max:150'],
            'data' => [$required, 'date'],
            'tipo' => [$required, 'string', Rule::in(['feriado', 'ponto_facultativo'])],
            'escopo' => [$required, 'string', Rule::in(['nacional', 'estadual', 'municipal', 'interno'])],
            'estado' => ['nullable', 'string', 'size:2'],
            'municipio' => ['nullable', 'string', 'max:120'],
            'percentual_hora_extra' => [$required, 'integer', 'min:0', 'max:200'],
            'recorrente' => ['sometimes', 'boolean'],
            'observacao' => ['nullable', 'string', 'max:1000'],
            'ativo' => ['sometimes', 'boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(?Feriado $feriado): array
    {
        return [
            'id' => $feriado?->id,
            'nome' => $feriado?->nome,
            'data' => $feriado?->data?->toDateString(),
            'tipo' => $feriado?->tipo,
            'escopo' => $feriado?->escopo,
            'estado' => $feriado?->estado,
            'municipio' => $feriado?->municipio,
            'percentual_hora_extra' => $feriado?->percentual_hora_extra,
            'recorrente' => (bool) $feriado?->recorrente,
            'observacao' => $feriado?->observacao,
            'ativo' => (bool) $feriado?->ativo,
        ];
    }
}
