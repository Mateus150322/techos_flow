<?php

namespace Tests\Feature;

use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrador_pode_consultar_dashboard_admin(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico');

        $this->criarOs($tecnico->id, ['status' => 'aberta']);
        $this->criarOs($tecnico->id, ['status' => 'finalizada', 'numero' => '2026-000002']);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/dashboard/admin');

        $response
            ->assertOk()
            ->assertJsonPath('resumo.total', 2)
            ->assertJsonPath('resumo.abertas', 1)
            ->assertJsonPath('resumo.finalizadas', 1);
    }

    public function test_tecnico_pode_consultar_dashboard_tecnico_com_busca(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        $this->criarOs(null, [
            'numero' => '2026-000010',
            'descricao' => 'Vazamento na ETA Central',
        ]);
        $this->criarOs($tecnico->id, [
            'numero' => '2026-000011',
            'status' => 'em_execucao',
            'descricao' => 'Bomba principal em manutencao',
        ]);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/dashboard/tecnico?q=bomba');

        $response
            ->assertOk()
            ->assertJsonPath('resumo.em_execucao', 1)
            ->assertJsonCount(1, 'secoes.em_execucao');
    }

    public function test_atendente_pode_consultar_dashboard_atendente(): void
    {
        $atendente = $this->criarUsuario('atendente');

        $this->criarOs(null, ['status' => 'aberta']);
        $this->criarOs(null, ['status' => 'cancelada', 'numero' => '2026-000003']);

        Sanctum::actingAs($atendente);

        $response = $this->getJson('/api/v1/dashboard/atendente');

        $response
            ->assertOk()
            ->assertJsonPath('resumo.total', 2)
            ->assertJsonPath('resumo.encerradas', 1);
    }

    public function test_usuario_pode_consultar_resumo_e_opcoes_de_filtro_das_ordens(): void
    {
        $atendente = $this->criarUsuario('atendente');

        $this->criarOs(null, ['tipo' => 'Reparo']);
        $this->criarOs(null, ['tipo' => 'ETA/ETE', 'numero' => '2026-000004']);

        Sanctum::actingAs($atendente);

        $summaryResponse = $this->getJson('/api/v1/ordens-servico/resumo');
        $optionsResponse = $this->getJson('/api/v1/ordens-servico/opcoes-filtro');

        $summaryResponse
            ->assertOk()
            ->assertJsonPath('total', 2);

        $optionsResponse
            ->assertOk()
            ->assertJsonPath('tipos.0', 'ETA/ETE');
    }

    private function criarUsuario(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }

    private function criarOs(?string $tecnicoResponsavelId = null, array $override = []): OrdemServico
    {
        $criador = $this->criarUsuario('atendente');
        $endereco = Endereco::query()->create([
            'rua' => 'Rua Teste',
            'numero' => '100',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900000',
        ]);

        return OrdemServico::query()->create(array_merge([
            'numero' => '2026-000001',
            'tipo' => 'Manutencao',
            'nome_cliente' => 'Cliente Teste',
            'status' => 'aberta',
            'prioridade' => 2,
            'descricao' => 'Descricao de teste',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $criador->id,
            'tecnico_responsavel_id' => $tecnicoResponsavelId,
        ], $override));
    }
}
