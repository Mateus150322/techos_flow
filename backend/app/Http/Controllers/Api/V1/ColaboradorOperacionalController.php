<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ColaboradorOperacional;
use App\Support\Concerns\UsesCaseInsensitiveLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ColaboradorOperacionalController extends Controller
{
    use UsesCaseInsensitiveLike;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:ativos,inativos'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = ColaboradorOperacional::query()->orderBy('name');

        if (($data['status'] ?? null) === 'ativos') {
            $query->where('is_active', true);
        }

        if (($data['status'] ?? null) === 'inativos') {
            $query->where('is_active', false);
        }

        if (! empty($data['q'])) {
            $search = trim($data['q']);
            $pattern = $this->containsPattern($search);
            $likeOperator = $this->caseInsensitiveLikeOperator($query);

            $query->where(function ($builder) use ($likeOperator, $pattern) {
                $builder
                    ->where('name', $likeOperator, $pattern)
                    ->orWhere('funcao', $likeOperator, $pattern);
            });
        }

        $stats = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as ativos')
            ->selectRaw('SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inativos')
            ->first();

        $paginator = $query->paginate((int) ($data['per_page'] ?? 15));

        return response()->json(array_merge($paginator->toArray(), [
            'stats' => [
                'total' => (int) ($stats->total ?? 0),
                'ativos' => (int) ($stats->ativos ?? 0),
                'inativos' => (int) ($stats->inativos ?? 0),
            ],
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'funcao' => ['required', 'string', 'max:100'],
            'valor_hora' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ]);

        $colaborador = ColaboradorOperacional::query()->create([
            'name' => $data['name'],
            'funcao' => $data['funcao'],
            'valor_hora' => $data['valor_hora'],
            'is_active' => true,
        ]);

        return response()->json($colaborador, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $colaborador = ColaboradorOperacional::query()->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'funcao' => ['sometimes', 'required', 'string', 'max:100'],
            'valor_hora' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999.99'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $colaborador->update($data);

        return response()->json($colaborador->fresh());
    }
}
