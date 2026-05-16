<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Security\PasswordPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Usuário inativo.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        $expirationMinutes = (int) config('sanctum.expiration', 0);
        $tokenExpiresAt = $expirationMinutes > 0
            ? now()->addMinutes($expirationMinutes)->toIso8601String()
            : null;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_expires_at' => $tokenExpiresAt,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate(
            [
                'current_password' => ['required', 'string'],
                'password' => PasswordPolicy::rules(
                    required: true,
                    confirmed: true,
                    differentFromField: 'current_password',
                    name: $user?->name,
                    email: $user?->email,
                ),
            ],
            array_merge(
                PasswordPolicy::messages(label: 'nova senha'),
                [
                    'current_password.required' => 'Informe a senha atual.',
                ],
            )
        );

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'A senha atual informada está incorreta.',
                'errors' => [
                    'current_password' => ['A senha atual informada está incorreta.'],
                ],
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'must_change_password' => false,
        ])->save();

        return response()->json([
            'message' => 'Senha atualizada com sucesso.',
            'user' => $user->fresh(),
        ]);
    }
}
