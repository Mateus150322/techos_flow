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
            'password' => '123456',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('email', 'nova.atendente@teste.com')
            ->assertJsonMissing(['password' => '123456']);

        $this->assertDatabaseHas('users', [
            'email' => 'nova.atendente@teste.com',
            'role' => 'atendente',
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
            'password' => '654321',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Tecnico Atualizado')
            ->assertJsonPath('role', 'tecnico');

        $user->refresh();

        $this->assertTrue(Hash::check('654321', $user->password));
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

    private function criarUsuario(string $role, ?string $name = null): User
    {
        return User::query()->create([
            'name' => $name ?? ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }
}
