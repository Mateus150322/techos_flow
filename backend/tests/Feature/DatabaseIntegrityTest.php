<?php

namespace Tests\Feature;

use App\Models\Endereco;
use App\Models\Execucao;
use App\Models\ExecucaoFuncionario;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_banco_impede_duas_execucoes_abertas_para_a_mesma_os(): void
    {
        [$tecnico, $os] = $this->criarCenario();

        Execucao::query()->create([
            'os_id' => $os->id,
            'tecnico_id' => $tecnico->id,
            'data_inicio' => '2026-06-19 08:00:00',
        ]);

        $this->expectException(QueryException::class);

        Execucao::query()->create([
            'os_id' => $os->id,
            'tecnico_id' => $tecnico->id,
            'data_inicio' => '2026-06-19 09:00:00',
        ]);
    }

    public function test_banco_rejeita_prioridade_fora_do_intervalo(): void
    {
        [, $os] = $this->criarCenario();

        $this->expectException(QueryException::class);

        $os->update(['prioridade' => 4]);
    }

    public function test_banco_rejeita_periodo_invertido_na_execucao(): void
    {
        [$tecnico, $os] = $this->criarCenario();

        $this->expectException(QueryException::class);

        Execucao::query()->create([
            'os_id' => $os->id,
            'tecnico_id' => $tecnico->id,
            'data_inicio' => '2026-06-19 10:00:00',
            'data_fim' => '2026-06-19 09:00:00',
        ]);
    }

    public function test_banco_exige_exatamente_um_vinculo_por_participante(): void
    {
        [$tecnico, $os] = $this->criarCenario();
        $execucao = Execucao::query()->create([
            'os_id' => $os->id,
            'tecnico_id' => $tecnico->id,
            'data_inicio' => '2026-06-19 08:00:00',
            'data_fim' => '2026-06-19 10:00:00',
        ]);

        $this->expectException(QueryException::class);

        ExecucaoFuncionario::query()->create([
            'execucao_id' => $execucao->id,
            'funcionario_id' => null,
            'colaborador_operacional_id' => null,
            'data_inicio' => '2026-06-19 08:00:00',
            'data_fim' => '2026-06-19 10:00:00',
        ]);
    }

    /**
     * @return array{User, OrdemServico}
     */
    private function criarCenario(): array
    {
        $atendente = $this->criarUsuario('atendente');
        $tecnico = $this->criarUsuario('tecnico');
        $endereco = Endereco::query()->create([
            'rua' => 'Rua Teste',
            'numero' => '100',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900000',
        ]);
        $os = OrdemServico::query()->create([
            'numero' => fake()->unique()->numerify('2026-######'),
            'tipo' => 'Manutencao',
            'nome_cliente' => 'Cliente Teste',
            'status' => 'aberta',
            'prioridade' => 2,
            'descricao' => 'Teste de integridade',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $atendente->id,
            'tecnico_responsavel_id' => $tecnico->id,
        ]);

        return [$tecnico, $os];
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
