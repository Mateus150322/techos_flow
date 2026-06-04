<?php

namespace Tests\Feature;

use App\Models\ColaboradorOperacional;
use App\Models\Endereco;
use App\Models\Execucao;
use App\Models\ExecucaoFuncionario;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HorasExtrasTest extends TestCase
{
    use RefreshDatabase;

    public function test_finalizacao_registra_funcionarios_e_calcula_minutos_individuais(): void
    {
        $tecnico = $this->criarUsuario('tecnico', 'Técnico Campo', 25);
        $adminParticipante = $this->criarUsuario('administrador', 'Admin Apoio', 40);
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar", [
            'data_inicio' => '2026-04-22 18:00:00',
        ]);

        $iniciar->assertCreated();
        $execucaoId = (string) $iniciar->json('execucao.id');

        $finalizar = $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $execucaoId,
            'data_fim' => '2026-04-22 20:00:00',
            'funcionarios' => [
                [
                    'funcionario_id' => $tecnico->id,
                ],
                [
                    'funcionario_id' => $adminParticipante->id,
                    'data_inicio' => '2026-04-22 18:30:00',
                    'data_fim' => '2026-04-22 20:00:00',
                ],
            ],
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('os.status', 'finalizada')
            ->assertJsonPath('participantes_registrados', 2);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'funcionario_id' => $tecnico->id,
            'minutos_trabalhados' => 120,
            'minutos_normais' => 0,
            'minutos_extras_50' => 120,
            'minutos_extras_100' => 0,
        ]);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'funcionario_id' => $adminParticipante->id,
            'minutos_trabalhados' => 90,
            'minutos_normais' => 0,
            'minutos_extras_50' => 90,
            'minutos_extras_100' => 0,
        ]);
    }

    public function test_tecnico_responsavel_entra_automaticamente_no_calculo_mesmo_sem_ser_informado(): void
    {
        $tecnico = $this->criarUsuario('tecnico', 'Tecnico Principal', 25);
        $adminParticipante = $this->criarUsuario('administrador', 'Admin Apoio', 40);
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar", [
            'data_inicio' => '2026-04-23 18:00:00',
        ]);

        $iniciar->assertCreated();
        $execucaoId = (string) $iniciar->json('execucao.id');

        $finalizar = $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $execucaoId,
            'data_fim' => '2026-04-23 20:00:00',
            'funcionarios' => [
                [
                    'funcionario_id' => $adminParticipante->id,
                    'data_inicio' => '2026-04-23 18:30:00',
                    'data_fim' => '2026-04-23 20:00:00',
                ],
            ],
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('participantes_registrados', 2);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'funcionario_id' => $tecnico->id,
            'minutos_trabalhados' => 120,
            'minutos_extras_50' => 120,
        ]);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'funcionario_id' => $adminParticipante->id,
            'minutos_trabalhados' => 90,
            'minutos_extras_50' => 90,
        ]);
    }

    public function test_finalizacao_aceita_periodo_individual_atravessando_meia_noite_em_dia_util(): void
    {
        $tecnico = $this->criarUsuario('tecnico', 'Tecnico Noturno', 25);
        $adminParticipante = $this->criarUsuario('administrador', 'Admin Apoio', 40);
        $os = $this->criarOs($tecnico->id, ['numero' => '2026-000099']);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar", [
            'data_inicio' => '2026-04-28 22:00:00',
        ]);

        $iniciar->assertCreated();
        $execucaoId = (string) $iniciar->json('execucao.id');

        $finalizar = $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $execucaoId,
            'data_fim' => '2026-04-29 02:00:00',
            'funcionarios' => [
                [
                    'funcionario_id' => $adminParticipante->id,
                    'data_inicio' => '2026-04-28 22:00:00',
                    'data_fim' => '2026-04-29 02:00:00',
                ],
            ],
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('os.status', 'finalizada')
            ->assertJsonPath('participantes_registrados', 2);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'funcionario_id' => $adminParticipante->id,
            'minutos_trabalhados' => 240,
            'minutos_normais' => 0,
            'minutos_extras_50' => 240,
            'minutos_extras_100' => 0,
        ]);

        Sanctum::actingAs($adminParticipante);

        $response = $this->getJson("/api/v1/relatorios/horas-extras?mes=4&ano=2026&funcionario_id={$adminParticipante->id}");

        $response
            ->assertOk()
            ->assertJsonPath('rows.0.funcionario_nome', 'Admin Apoio')
            ->assertJsonPath('rows.0.horas_extras_50_minutos', 240)
            ->assertJsonPath('rows.0.horas_extras_100_minutos', 0)
            ->assertJsonPath('rows.0.valor_estimado_financeiro', 240);
    }

    public function test_endpoint_funcionarios_lista_usuarios_e_colaboradores_operacionais_ativos(): void
    {
        $tecnico = $this->criarUsuario('tecnico', 'Técnico Ativo');
        $admin = $this->criarUsuario('administrador', 'Administrador Ativo');
        $auxiliar = $this->criarColaborador('Auxiliar Operacional');
        $this->criarUsuario('atendente', 'Atendente');
        $this->criarUsuario('tecnico', 'Técnico Inativo', 0, false);
        $this->criarColaborador('Auxiliar Inativo', 18, false);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/funcionarios');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($tecnico->id, $ids);
        $this->assertContains($admin->id, $ids);
        $this->assertContains($auxiliar->id, $ids);
        $this->assertCount(3, $ids);
    }

    public function test_finalizacao_aceita_colaborador_operacional_e_relatorio_consolida_horas_extras(): void
    {
        $admin = $this->criarUsuario('administrador', 'Admin Relatorios');
        $tecnico = $this->criarUsuario('tecnico', 'Técnico Campo', 25);
        $auxiliar = $this->criarColaborador('Auxiliar de Campo', 15);
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar", [
            'data_inicio' => '2026-04-24 18:00:00',
        ]);

        $iniciar->assertCreated();
        $execucaoId = (string) $iniciar->json('execucao.id');

        $finalizar = $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $execucaoId,
            'data_fim' => '2026-04-24 20:00:00',
            'funcionarios' => [
                [
                    'colaborador_operacional_id' => $auxiliar->id,
                    'data_inicio' => '2026-04-24 18:30:00',
                    'data_fim' => '2026-04-24 20:00:00',
                ],
            ],
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('participantes_registrados', 2);

        $this->assertDatabaseHas('execucao_funcionarios', [
            'execucao_id' => $execucaoId,
            'colaborador_operacional_id' => $auxiliar->id,
            'funcionario_id' => null,
            'minutos_trabalhados' => 90,
            'minutos_extras_50' => 90,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/v1/relatorios/horas-extras?funcionario_id={$auxiliar->id}");

        $response
            ->assertOk()
            ->assertJsonPath('rows.0.funcionario_nome', 'Auxiliar de Campo')
            ->assertJsonPath('rows.0.role', 'auxiliar_tecnico')
            ->assertJsonPath('rows.0.tipo_vinculo', 'colaborador_operacional')
            ->assertJsonPath('rows.0.horas_extras_50_minutos', 90)
            ->assertJsonPath('rows.0.valor_estimado_financeiro', 33.75);
    }

    public function test_relatorio_de_horas_extras_aplica_limite_mensal_e_banco_de_folgas(): void
    {
        $admin = $this->criarUsuario('administrador', 'Admin Relatorios');
        $tecnico = $this->criarUsuario('tecnico', 'João Silva', 10);
        $os = $this->criarOs($tecnico->id, ['status' => 'finalizada']);

        foreach (['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10', '2026-04-13'] as $data) {
            $execucao = Execucao::query()->create([
                'os_id' => $os->id,
                'tecnico_id' => $tecnico->id,
                'data_inicio' => "{$data} 00:00:00",
                'data_fim' => "{$data} 06:00:00",
                'observacao' => 'Execução para cálculo mensal',
            ]);

            ExecucaoFuncionario::query()->create([
                'execucao_id' => $execucao->id,
                'funcionario_id' => $tecnico->id,
                'data_inicio' => "{$data} 00:00:00",
                'data_fim' => "{$data} 06:00:00",
                'minutos_trabalhados' => 360,
                'minutos_normais' => 0,
                'minutos_extras_50' => 360,
                'minutos_extras_100' => 0,
            ]);
        }

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/v1/relatorios/horas-extras?mes=4&ano=2026&funcionario_id={$tecnico->id}");

        $response
            ->assertOk()
            ->assertJsonPath('rows.0.funcionario_nome', 'João Silva')
            ->assertJsonPath('rows.0.horas_extras_50_minutos', 3240)
            ->assertJsonPath('rows.0.horas_pagas_minutos', 2880)
            ->assertJsonPath('rows.0.horas_convertidas_folga_minutos', 360)
            ->assertJsonPath('rows.0.dias_folga_gerados', 0)
            ->assertJsonPath('rows.0.saldo_banco_minutos', 360)
            ->assertJsonPath('rows.0.valor_estimado_financeiro', 720);
    }

    public function test_relatorio_de_horas_extras_e_restrito_ao_administrador(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/relatorios/horas-extras');

        $response->assertStatus(403);
    }

    public function test_administrador_pode_exportar_relatorio_de_horas_extras(): void
    {
        $admin = $this->criarUsuario('administrador', 'Admin Relatorios');
        $tecnico = $this->criarUsuario('tecnico', 'João Silva', 20);
        $os = $this->criarOs($tecnico->id, ['status' => 'finalizada']);
        $execucao = Execucao::query()->create([
            'os_id' => $os->id,
            'tecnico_id' => $tecnico->id,
            'data_inicio' => '2026-04-21 18:00:00',
            'data_fim' => '2026-04-21 20:00:00',
            'observacao' => 'Execução noturna',
        ]);

        ExecucaoFuncionario::query()->create([
            'execucao_id' => $execucao->id,
            'funcionario_id' => $tecnico->id,
            'data_inicio' => '2026-04-21 18:00:00',
            'data_fim' => '2026-04-21 20:00:00',
            'minutos_trabalhados' => 120,
            'minutos_normais' => 0,
            'minutos_extras_50' => 120,
            'minutos_extras_100' => 0,
        ]);

        Sanctum::actingAs($admin);

        $csv = $this->get('/api/v1/relatorios/horas-extras/exportar/csv');
        $xlsx = $this->get('/api/v1/relatorios/horas-extras/exportar/xlsx');
        $pdf = $this->get('/api/v1/relatorios/horas-extras/exportar/pdf');

        $csv->assertOk();
        $this->assertStringContainsString('text/csv', (string) $csv->headers->get('content-type'));
        $this->assertStringContainsString('João Silva', $csv->streamedContent());

        $xlsx->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml.sheet',
            (string) $xlsx->headers->get('content-type')
        );
        $this->assertStringStartsWith('PK', (string) $xlsx->getContent());

        $pdf->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $pdf->headers->get('content-type'));
        $this->assertStringStartsWith('%PDF-', (string) $pdf->getContent());
    }

    private function criarUsuario(
        string $role,
        ?string $name = null,
        float $valorHora = 0,
        bool $ativo = true
    ): User {
        return User::query()->create([
            'name' => $name ?? ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
            'is_active' => $ativo,
            'valor_hora' => $valorHora > 0 ? $valorHora : null,
        ]);
    }

    private function criarColaborador(
        string $name,
        float $valorHora = 0,
        bool $ativo = true
    ): ColaboradorOperacional {
        return ColaboradorOperacional::query()->create([
            'name' => $name,
            'funcao' => 'Auxiliar técnico',
            'valor_hora' => $valorHora > 0 ? $valorHora : null,
            'is_active' => $ativo,
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
            'data_abertura' => '2026-04-01 08:00:00',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $criador->id,
            'tecnico_responsavel_id' => $tecnicoResponsavelId,
        ], $override));
    }
}
