<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
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
                'message' => 'Credenciais invalidas.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Usuario inativo.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
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
        $data = $request->validate(
            [
                'current_password' => ['required', 'string'],
                'password' => $this->passwordRules(required: true, confirmed: true),
            ],
            $this->passwordValidationMessages()
        );

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'A senha atual informada esta incorreta.',
                'errors' => [
                    'current_password' => ['A senha atual informada esta incorreta.'],
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

    private function passwordRules(bool $required, bool $confirmed = false): array
    {
        return array_filter([
            $required ? 'required' : 'nullable',
            'string',
            'min:8',
            'max:255',
            'different:current_password',
            'regex:/[a-z]/',
            'regex:/[A-Z]/',
            'regex:/[0-9]/',
            'regex:/[^A-Za-z0-9]/',
            $confirmed ? 'confirmed' : null,
        ]);
    }

    private function passwordValidationMessages(): array
    {
        return [
            'password.required' => 'Informe a nova senha.',
            'password.confirmed' => 'A confirmacao da nova senha nao confere.',
            'password.min' => 'A nova senha deve ter pelo menos 8 caracteres.',
            'password.max' => 'A nova senha deve ter no maximo 255 caracteres.',
            'password.different' => 'A nova senha deve ser diferente da senha atual.',
            'password.regex' => 'A nova senha deve conter letra maiuscula, letra minuscula, numero e caractere especial.',
            'current_password.required' => 'Informe a senha atual.',
        ];
    }
}
