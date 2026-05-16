<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Concerns\UsesCaseInsensitiveLike;
use App\Support\Security\PasswordPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    use UsesCaseInsensitiveLike;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in(['administrador', 'tecnico', 'atendente'])],
            'status' => ['nullable', Rule::in(['ativos', 'inativos'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = User::query()->orderBy('name');

        if (! empty($data['role'])) {
            $query->where('role', $data['role']);
        }

        if (($data['status'] ?? null) === 'ativos') {
            $query->where('is_active', true);
        }

        if (($data['status'] ?? null) === 'inativos') {
            $query->where('is_active', false);
        }

        if (! empty($data['q'])) {
            $search = trim($data['q']);
            $likeOperator = $this->caseInsensitiveLikeOperator($query);
            $pattern = $this->containsPattern($search);

            $query->where(function ($builder) use ($likeOperator, $pattern) {
                $builder
                    ->where('name', $likeOperator, $pattern)
                    ->orWhere('email', $likeOperator, $pattern)
                    ->orWhere('role', $likeOperator, $pattern);
            });
        }

        $stats = (clone $query)
            ->reorder()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as ativos')
            ->selectRaw('SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inativos')
            ->selectRaw("SUM(CASE WHEN role = 'administrador' THEN 1 ELSE 0 END) as administradores")
            ->selectRaw("SUM(CASE WHEN role = 'tecnico' THEN 1 ELSE 0 END) as tecnicos")
            ->selectRaw("SUM(CASE WHEN role = 'atendente' THEN 1 ELSE 0 END) as atendentes")
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as ultimos_7_dias', [now()->subDays(7)])
            ->first();
        $paginator = $query->paginate((int) ($data['per_page'] ?? 15));

        return response()->json(
            array_merge($paginator->toArray(), [
                'stats' => [
                    'total' => (int) ($stats->total ?? 0),
                    'ativos' => (int) ($stats->ativos ?? 0),
                    'inativos' => (int) ($stats->inativos ?? 0),
                    'administradores' => (int) ($stats->administradores ?? 0),
                    'tecnicos' => (int) ($stats->tecnicos ?? 0),
                    'atendentes' => (int) ($stats->atendentes ?? 0),
                    'ultimos_7_dias' => (int) ($stats->ultimos_7_dias ?? 0),
                ],
            ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'role' => ['required', Rule::in(['administrador', 'tecnico', 'atendente'])],
                'valor_hora' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
                'password' => PasswordPolicy::rules(
                    required: true,
                    confirmed: true,
                    name: (string) $request->input('name'),
                    email: (string) $request->input('email'),
                ),
            ],
            PasswordPolicy::messages()
        );

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'valor_hora' => $data['valor_hora'] ?? null,
            'password' => Hash::make($data['password']),
            'is_active' => true,
            'must_change_password' => true,
        ]);

        return response()->json($user, 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(User::query()->findOrFail($id));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        $data = $request->validate(
            [
                'name' => ['sometimes', 'required', 'string', 'max:255'],
                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($user->id),
                ],
                'role' => ['sometimes', 'required', Rule::in(['administrador', 'tecnico', 'atendente'])],
                'valor_hora' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999.99'],
                'password' => PasswordPolicy::rules(
                    required: false,
                    confirmed: true,
                    name: (string) $request->input('name', $user->name),
                    email: (string) $request->input('email', $user->email),
                ),
                'is_active' => ['sometimes', 'boolean'],
            ],
            PasswordPolicy::messages()
        );

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        if (($data['is_active'] ?? null) === false && $request->user()?->is($user)) {
            return response()->json([
                'message' => 'Você não pode inativar seu próprio usuário.',
            ], 422);
        }

        $removendoAdminAtivo =
            ($user->role === 'administrador' && $user->is_active) &&
            (
                (($data['is_active'] ?? true) === false) ||
                (isset($data['role']) && $data['role'] !== 'administrador')
            );

        if ($removendoAdminAtivo) {
            $adminsAtivos = User::query()
                ->where('role', 'administrador')
                ->where('is_active', true)
                ->count();

            if ($adminsAtivos <= 1) {
                return response()->json([
                    'message' => 'Não é possível remover o último administrador ativo.',
                ], 422);
            }
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
            $data['must_change_password'] = ! $request->user()?->is($user);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }
}
