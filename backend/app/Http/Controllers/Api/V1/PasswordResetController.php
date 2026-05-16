<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Security\PasswordPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function sendResetLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()
            ->where('email', $data['email'])
            ->where('is_active', true)
            ->first();

        if ($user) {
            $status = Password::broker()->sendResetLink([
                'email' => $user->email,
            ]);

            if ($status === Password::RESET_THROTTLED) {
                return response()->json([
                    'message' => 'Já existe uma solicitação recente para este e-mail. Aguarde alguns instantes e tente novamente.',
                ], 429);
            }
        }

        return response()->json([
            'message' => 'Se existir uma conta ativa para este e-mail, enviaremos um link de redefinição em instantes.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'token' => ['required', 'string'],
                'email' => ['required', 'email'],
                'password' => PasswordPolicy::rules(
                    required: true,
                    confirmed: true,
                    name: $this->findUserName($request->string('email')->toString()),
                    email: $request->string('email')->toString(),
                ),
            ],
            PasswordPolicy::messages(label: 'nova senha')
        );

        $status = Password::broker()->reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                    'must_change_password' => false,
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'O link de redefinição é inválido ou expirou. Solicite um novo link e tente novamente.',
                'errors' => [
                    'token' => ['O link de redefinição é inválido ou expirou. Solicite um novo link e tente novamente.'],
                ],
            ], 422);
        }

        return response()->json([
            'message' => 'Senha redefinida com sucesso. Faça login com a nova senha.',
        ]);
    }

    private function findUserName(string $email): ?string
    {
        return User::query()
            ->where('email', $email)
            ->value('name');
    }
}
