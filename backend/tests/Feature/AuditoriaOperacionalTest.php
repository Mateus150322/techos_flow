<?php

namespace Tests\Feature;

use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\OrdemServicoEvento;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditoriaOperacionalTest extends TestCase
{
    use RefreshDatabase;

    public function test_aceite_atomico_permite_apenas_um_tecnico_e_registra_evento(): void
    {
        $primeiroTecnico = $this->criarUsuario('tecnico');
        $segundoTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs();

        Sanctum::actingAs($primeiroTecnico);
        $this->postJson("/api/v1/ordens-servico/{$os->id}/aceitar")
            ->assertOk()
            ->assertJsonPath('data.tecnico_responsavel_id', $primeiroTecnico->id);

        Sanctum::actingAs($segundoTecnico);
        $this->postJson("/api/v1/ordens-servico/{$os->id}/aceitar")
            ->assertConflict();

        $this->assertDatabaseHas('ordem_servicos', [
            'id' => $os->id,
            'tecnico_responsavel_id' => $primeiroTecnico->id,
        ]);
        $this->assertDatabaseHas('ordem_servico_eventos', [
            'os_id' => $os->id,
            'usuario_id' => $primeiroTecnico->id,
            'evento' => 'os_aceita',
        ]);
        $this->assertDatabaseCount('ordem_servico_eventos', 1);
    }

    public function test_detalhe_da_os_expoe_historico_operacional(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);
        $inicio = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar")
            ->assertCreated();

        $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $inicio->json('execucao.id'),
            'diagnostico' => 'Falha identificada.',
            'procedimento' => 'Correção executada.',
        ])->assertOk();

        $eventoFinalizacao = OrdemServicoEvento::query()
            ->with('usuario')
            ->where('os_id', $os->id)
            ->where('evento', 'execucao_finalizada')
            ->firstOrFail();

        $this->assertSame($tecnico->id, $eventoFinalizacao->usuario_id);
        $this->assertSame($tecnico->id, $eventoFinalizacao->usuario?->id);

        $this->getJson("/api/v1/ordens-servico/{$os->id}?include=eventos")
            ->assertOk()
            ->assertJsonPath('eventos.0.evento', 'execucao_finalizada')
            ->assertJsonPath('eventos.0.usuario.id', $tecnico->id)
            ->assertJsonPath('eventos.1.evento', 'execucao_iniciada');
    }

    private function criarOs(?string $tecnicoId = null): OrdemServico
    {
        $atendente = $this->criarUsuario('atendente');
        $endereco = Endereco::query()->create([
            'rua' => 'Rua Teste',
            'numero' => '100',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900000',
        ]);

        return OrdemServico::query()->create([
            'numero' => fake()->unique()->numerify('2026-######'),
            'tipo' => 'Manutencao',
            'nome_cliente' => 'Cliente Teste',
            'status' => 'aberta',
            'prioridade' => 2,
            'descricao' => 'Teste de auditoria',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $atendente->id,
            'tecnico_responsavel_id' => $tecnicoId,
        ]);
    }

    private function criarUsuario(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role).' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }
}
