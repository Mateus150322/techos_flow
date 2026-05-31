<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordLinkNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class RecuperacaoSenhaTest extends TestCase
{
    use RefreshDatabase;

    public function test_pode_solicitar_link_de_recuperacao_por_email(): void
    {
        Notification::fake();

        $user = $this->criarUsuario();

        $response = $this->postJson('/api/v1/esqueci-senha', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Se existir uma conta ativa para este e-mail, enviaremos um link de redefinição em instantes.'
            );

        Notification::assertSentTo(
            $user,
            ResetPasswordLinkNotification::class,
            function (ResetPasswordLinkNotification $notification) use ($user): bool {
                $mail = $notification->toMail($user);

                return $mail->view === 'emails.reset-password'
                    && $mail->subject === 'Redefinição de senha - TechOS Flow'
                    && str_contains((string) ($mail->viewData['logoUrl'] ?? ''), 'techos-icon.png')
                    && str_contains((string) ($mail->viewData['resetUrl'] ?? ''), '/redefinir-senha?');
            }
        );
    }

    public function test_solicitacao_para_email_inexistente_retorna_mensagem_generica(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/esqueci-senha', [
            'email' => 'naoexiste@techosflow.com.br',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Se existir uma conta ativa para este e-mail, enviaremos um link de redefinição em instantes.'
            );

        Notification::assertNothingSent();
    }

    public function test_pode_redefinir_senha_com_token_valido(): void
    {
        $user = $this->criarUsuario();
        $user->tokens()->create([
            'name' => 'token-antigo',
            'token' => hash('sha256', 'valor-antigo'),
            'abilities' => ['*'],
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/v1/redefinir-senha', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NovaForte!567',
            'password_confirmation' => 'NovaForte!567',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Senha redefinida com sucesso. Faça login com a nova senha.');

        $user->refresh();

        $this->assertTrue(Hash::check('NovaForte!567', $user->password));
        $this->assertFalse($user->must_change_password);
        $this->assertCount(0, $user->tokens);
    }

    public function test_nao_pode_redefinir_senha_com_token_invalido(): void
    {
        $user = $this->criarUsuario();

        $response = $this->postJson('/api/v1/redefinir-senha', [
            'email' => $user->email,
            'token' => 'token-invalido',
            'password' => 'NovaForte!567',
            'password_confirmation' => 'NovaForte!567',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'O link de redefinição é inválido ou expirou. Solicite um novo link e tente novamente.'
            )
            ->assertJsonValidationErrors(['token']);
    }

    private function criarUsuario(): User
    {
        return User::query()->create([
            'name' => 'Usuário Recuperação',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('Temp123!'),
            'role' => 'atendente',
            'must_change_password' => true,
        ]);
    }
}
