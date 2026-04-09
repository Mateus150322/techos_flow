<?php

namespace Tests\Feature;

use App\Models\Anexo;
use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RevisaoRetencaoAnexosCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_comando_lista_apenas_anexos_antigos_para_revisao(): void
    {
        $usuario = $this->criarUsuario('tecnico');
        $ordem = $this->criarOs($usuario->id, '2026-RET-001');

        $anexoAntigo = Anexo::query()->create([
            'os_id' => $ordem->id,
            'caminho' => 'anexos/antigo.pdf',
            'tipo' => 'pdf',
            'latitude' => -9.97,
            'longitude' => -67.82,
            'submetido_por_id' => $usuario->id,
            'criado_em' => now()->subDays(500),
        ]);

        Anexo::query()->whereKey($anexoAntigo->id)->update([
            'created_at' => now()->subDays(500),
            'updated_at' => now()->subDays(500),
        ]);

        $anexoRecente = Anexo::query()->create([
            'os_id' => $ordem->id,
            'caminho' => 'anexos/recente.pdf',
            'tipo' => 'pdf',
            'submetido_por_id' => $usuario->id,
            'criado_em' => now()->subDays(20),
        ]);

        $this->artisan('anexos:revisar-retencao --days=365 --limit=10')
            ->expectsOutputToContain('Revisão de retenção de anexos')
            ->expectsOutputToContain('Anexos elegíveis para revisão: 1')
            ->expectsOutputToContain('2026-RET-001')
            ->doesntExpectOutputToContain($anexoRecente->id)
            ->expectsOutputToContain('Recomendação: revisar necessidade operacional')
            ->assertSuccessful();
    }

    private function criarUsuario(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role) . ' Revisao',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }

    private function criarOs(?string $tecnicoResponsavelId, string $numero): OrdemServico
    {
        $criador = $this->criarUsuario('atendente');
        $endereco = Endereco::query()->create([
            'rua' => 'Rua Revisao',
            'numero' => '10',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900000',
        ]);

        return OrdemServico::query()->create([
            'numero' => $numero,
            'tipo' => 'Manutencao',
            'nome_cliente' => 'Cliente Revisao',
            'status' => 'finalizada',
            'prioridade' => 2,
            'descricao' => 'OS para revisao de retencao',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $criador->id,
            'tecnico_responsavel_id' => $tecnicoResponsavelId,
        ]);
    }
}
