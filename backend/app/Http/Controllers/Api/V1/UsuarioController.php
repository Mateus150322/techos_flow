<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->orderBy('name');

        if ($role = $request->string('role')->toString()) {
            $query->where('role', $role);
        }

        if ($search = mb_strtolower(trim($request->string('q')->toString()))) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->whereRaw('LOWER(name) like ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email) like ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(role) like ?', ["%{$search}%"]);
            });
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['administrador', 'tecnico', 'atendente'])],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json($user, 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(
            User::query()->findOrFail($id)
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'role' => ['sometimes', 'required', Rule::in(['administrador', 'tecnico', 'atendente'])],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }
}
