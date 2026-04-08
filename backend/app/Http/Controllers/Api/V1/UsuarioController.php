<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Concerns\UsesCaseInsensitiveLike;
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

        $statsRows = (clone $query)->get(['role', 'created_at', 'is_active']);
        $paginator = $query->paginate((int) ($data['per_page'] ?? 15));

        return response()->json(
            array_merge($paginator->toArray(), [
                'stats' => [
                    'total' => $statsRows->count(),
                    'ativos' => $statsRows->where('is_active', true)->count(),
                    'inativos' => $statsRows->where('is_active', false)->count(),
                    'administradores' => $statsRows->where('role', 'administrador')->count(),
                    'tecnicos' => $statsRows->where('role', 'tecnico')->count(),
                    'atendentes' => $statsRows->where('role', 'atendente')->count(),
                    'ultimos_7_dias' => $statsRows
                        ->filter(
                            fn (User $user) => $user->created_at
                                && $user->created_at->greaterThanOrEqualTo(now()->subDays(7))
                        )
                        ->count(),
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
                'password' => $this->passwordRules(required: true),
            ],
            $this->passwordValidationMessages()
        );

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
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
                'password' => $this->passwordRules(required: false),
                'is_active' => ['sometimes', 'boolean'],
            ],
            $this->passwordValidationMessages()
        );

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        if (($data['is_active'] ?? null) === false && $request->user()?->is($user)) {
            return response()->json([
                'message' => 'Voce nao pode inativar seu proprio usuario.',
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
                    'message' => 'Nao e possivel remover o ultimo administrador ativo.',
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

    private function passwordRules(bool $required): array
    {
        return array_filter([
            $required ? 'required' : 'nullable',
            'string',
            'min:8',
            'max:255',
            'regex:/[a-z]/',
            'regex:/[A-Z]/',
            'regex:/[0-9]/',
            'regex:/[^A-Za-z0-9]/',
        ]);
    }

    private function passwordValidationMessages(): array
    {
        return [
            'password.required' => 'Informe a senha.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'password.max' => 'A senha deve ter no maximo 255 caracteres.',
            'password.regex' => 'A senha deve conter letra maiuscula, letra minuscula, numero e caractere especial.',
        ];
    }
}
