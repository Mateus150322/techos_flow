<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrimeiroAcessoTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_com_troca_obrigatoria_consegue_consultar_me(): void
    {
        $user = $this->criarUsuarioPrimeiroAcesso();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me');

        $response
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('must_change_password', true);
    }

    public function test_usuario_com_troca_obrigatoria_nao_pode_acessar_rotas_do_sistema_antes_de_alterar_a_senha(): void
    {
        $user = $this->criarUsuarioPrimeiroAcesso();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/ordens-servico');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'E necessario alterar a senha antes de continuar.',
            ]);
    }

    public function test_usuario_pode_alterar_senha_forte_no_primeiro_acesso(): void
    {
        $user = $this->criarUsuarioPrimeiroAcesso();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/me/alterar-senha', [
            'current_password' => 'Temp123!',
            'password' => 'NovaSenha123!',
            'password_confirmation' => 'NovaSenha123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Senha atualizada com sucesso.')
            ->assertJsonPath('user.must_change_password', false);

        $user->refresh();

        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('NovaSenha123!', $user->password));

        $acessoSistema = $this->getJson('/api/v1/ordens-servico');
        $acessoSistema->assertOk();
    }

    public function test_usuario_nao_pode_definir_senha_fraca_no_primeiro_acesso(): void
    {
        $user = $this->criarUsuarioPrimeiroAcesso();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/me/alterar-senha', [
            'current_password' => 'Temp123!',
            'password' => 'fraca',
            'password_confirmation' => 'fraca',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    private function criarUsuarioPrimeiroAcesso(): User
    {
        return User::query()->create([
            'name' => 'Usuario Primeiro Acesso',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('Temp123!'),
            'role' => 'atendente',
            'must_change_password' => true,
        ]);
    }
}
