<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ColaboradorOperacional;
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

        $usuariosQuery = User::query()
            ->select(['id', 'name', 'role'])
            ->where('is_active', true)
            ->whereIn('role', ['tecnico', 'administrador'])
            ->orderBy('name');

        $colaboradoresQuery = ColaboradorOperacional::query()
            ->select(['id', 'name', 'funcao'])
            ->where('is_active', true)
            ->orderBy('name');

        if (! empty($data['q'])) {
            $search = trim($data['q']);
            $pattern = $this->containsPattern($search);
            $likeOperatorUsuarios = $this->caseInsensitiveLikeOperator($usuariosQuery);
            $likeOperatorColaboradores = $this->caseInsensitiveLikeOperator($colaboradoresQuery);

            $usuariosQuery->where(function (Builder $builder) use ($likeOperatorUsuarios, $pattern) {
                $builder
                    ->where('name', $likeOperatorUsuarios, $pattern)
                    ->orWhere('email', $likeOperatorUsuarios, $pattern);
            });

            $colaboradoresQuery->where(function (Builder $builder) use ($likeOperatorColaboradores, $pattern) {
                $builder
                    ->where('name', $likeOperatorColaboradores, $pattern)
                    ->orWhere('funcao', $likeOperatorColaboradores, $pattern);
            });
        }

        $usuarios = $usuariosQuery
            ->limit(50)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'funcao' => $user->role === 'administrador' ? 'Administrador' : 'Técnico',
                'tipo_vinculo' => 'usuario',
            ]);

        $colaboradores = $colaboradoresQuery
            ->limit(50)
            ->get()
            ->map(fn (ColaboradorOperacional $colaborador) => [
                'id' => $colaborador->id,
                'name' => $colaborador->name,
                'role' => 'auxiliar_tecnico',
                'funcao' => $colaborador->funcao,
                'tipo_vinculo' => 'colaborador_operacional',
            ]);

        return response()->json([
            'data' => $usuarios
                ->concat($colaboradores)
                ->sortBy('name')
                ->take(50)
                ->values(),
        ]);
    }
}
