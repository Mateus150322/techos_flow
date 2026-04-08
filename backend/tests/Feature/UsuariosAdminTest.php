<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UsuariosAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrador_pode_listar_usuarios(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico', 'Tecnico Campo');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/usuarios?q=campo');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $tecnico->id);
    }

    public function test_administrador_pode_criar_usuario(): void
    {
        $admin = $this->criarUsuario('administrador');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/usuarios', [
            'name' => 'Nova Atendente',
            'email' => 'nova.atendente@teste.com',
            'role' => 'atendente',
            'password' => 'Temp123!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('email', 'nova.atendente@teste.com')
            ->assertJsonPath('must_change_password', true)
            ->assertJsonMissing(['password' => 'Temp123!']);

        $this->assertDatabaseHas('users', [
            'email' => 'nova.atendente@teste.com',
            'role' => 'atendente',
            'must_change_password' => true,
        ]);
    }

    public function test_administrador_pode_atualizar_usuario(): void
    {
        $admin = $this->criarUsuario('administrador');
        $user = $this->criarUsuario('atendente', 'Atendente Base');

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/usuarios/{$user->id}", [
            'name' => 'Tecnico Atualizado',
            'role' => 'tecnico',
            'password' => 'Nova123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Tecnico Atualizado')
            ->assertJsonPath('role', 'tecnico');

        $user->refresh();

        $this->assertTrue(Hash::check('Nova123!', $user->password));
        $this->assertTrue($user->must_change_password);
    }

    public function test_administrador_pode_inativar_usuario(): void
    {
        $admin = $this->criarUsuario('administrador');
        $user = $this->criarUsuario('tecnico', 'Tecnico Inativado');

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/usuarios/{$user->id}", [
            'is_active' => false,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_active' => false,
        ]);
    }

    public function test_administrador_nao_pode_inativar_proprio_usuario(): void
    {
        $admin = $this->criarUsuario('administrador');

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/usuarios/{$admin->id}", [
            'is_active' => false,
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Voce nao pode inativar seu proprio usuario.',
            ]);
    }

    public function test_nao_e_possivel_remover_ultimo_administrador_ativo(): void
    {
        $admin = $this->criarUsuario('administrador');

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/usuarios/{$admin->id}", [
            'role' => 'tecnico',
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Nao e possivel remover o ultimo administrador ativo.',
            ]);
    }

    public function test_usuario_inativo_nao_pode_fazer_login(): void
    {
        $user = $this->criarUsuario('tecnico', 'Tecnico Inativo', false);

        $response = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Usuario inativo.',
            ]);
    }

    public function test_usuario_inativo_nao_pode_acessar_rotas_protegidas(): void
    {
        $user = $this->criarUsuario('tecnico', 'Tecnico Inativo', false);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Usuario inativo.',
            ]);
    }

    public function test_nao_admin_nao_pode_gerenciar_usuarios(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/usuarios');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Acesso negado',
            ]);
    }

    private function criarUsuario(string $role, ?string $name = null, bool $isActive = true): User
    {
        return User::query()->create([
            'name' => $name ?? ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
            'is_active' => $isActive,
        ]);
    }
}
