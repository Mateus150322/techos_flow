<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Concerns\UsesCaseInsensitiveLike;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FuncionarioController extends Controller
{
    use UsesCaseInsensitiveLike;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
        ]);

        $query = User::query()
            ->select(['id', 'name', 'role'])
            ->where('is_active', true)
            ->whereIn('role', ['tecnico', 'administrador'])
            ->orderBy('name');

        if (! empty($data['q'])) {
            $pattern = $this->containsPattern(trim($data['q']));
            $likeOperator = $this->caseInsensitiveLikeOperator($query);

            $query->where(function (Builder $builder) use ($likeOperator, $pattern) {
                $builder
                    ->where('name', $likeOperator, $pattern)
                    ->orWhere('email', $likeOperator, $pattern);
            });
        }

        return response()->json([
            'data' => $query
                ->limit(50)
                ->get()
                ->values(),
        ]);
    }
}
