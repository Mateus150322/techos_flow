<?php

namespace Tests\Feature;

use App\Models\ColaboradorOperacional;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ColaboradoresOperacionaisAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrador_pode_listar_colaboradores_operacionais(): void
    {
        $admin = $this->criarUsuario('administrador');
        $auxiliar = $this->criarColaborador('Auxiliar ETA');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/colaboradores-operacionais?q=eta');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $auxiliar->id)
            ->assertJsonPath('data.0.funcao', 'Auxiliar técnico');
    }

    public function test_administrador_pode_criar_colaborador_operacional(): void
    {
        $admin = $this->criarUsuario('administrador');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/colaboradores-operacionais', [
            'name' => 'João Apoio',
            'funcao' => 'Auxiliar técnico',
            'valor_hora' => 18.5,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'João Apoio')
            ->assertJsonPath('funcao', 'Auxiliar técnico')
            ->assertJsonPath('is_active', true);

        $this->assertDatabaseHas('colaboradores_operacionais', [
            'name' => 'João Apoio',
            'funcao' => 'Auxiliar técnico',
            'is_active' => true,
        ]);
    }

    public function test_administrador_pode_atualizar_colaborador_operacional(): void
    {
        $admin = $this->criarUsuario('administrador');
        $auxiliar = $this->criarColaborador('Apoio Base', 12);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/colaboradores-operacionais/{$auxiliar->id}", [
            'name' => 'Apoio Atualizado',
            'funcao' => 'Auxiliar ETA/ETE',
            'valor_hora' => 16,
            'is_active' => false,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Apoio Atualizado')
            ->assertJsonPath('funcao', 'Auxiliar ETA/ETE')
            ->assertJsonPath('is_active', false);

        $this->assertDatabaseHas('colaboradores_operacionais', [
            'id' => $auxiliar->id,
            'name' => 'Apoio Atualizado',
            'funcao' => 'Auxiliar ETA/ETE',
            'is_active' => false,
        ]);
    }

    public function test_nao_admin_nao_pode_gerenciar_colaboradores_operacionais(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/colaboradores-operacionais');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Acesso negado',
            ]);
    }

    private function criarUsuario(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function criarColaborador(string $name, float $valorHora = 0): ColaboradorOperacional
    {
        return ColaboradorOperacional::query()->create([
            'name' => $name,
            'funcao' => 'Auxiliar técnico',
            'valor_hora' => $valorHora > 0 ? $valorHora : null,
            'is_active' => true,
        ]);
    }
}
