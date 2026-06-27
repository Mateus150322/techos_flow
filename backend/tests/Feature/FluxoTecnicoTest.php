<?php

namespace Tests\Feature;

use App\Models\Anexo;
use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FluxoTecnicoTest extends TestCase
{
    use RefreshDatabase;

    public function test_tecnico_nao_pode_iniciar_execucao_de_os_aceita_por_outro_tecnico(): void
    {
        $tecnicoResponsavel = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnicoResponsavel->id);

        Sanctum::actingAs($outroTecnico);

        $response = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar");

        $response->assertStatus(403);
    }

    public function test_tecnico_responsavel_pode_iniciar_e_finalizar_execucao(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar");

        $iniciar
            ->assertCreated()
            ->assertJsonPath('os.status', 'em_execucao');

        $execucaoId = $iniciar->json('execucao.id');

        $finalizar = $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $execucaoId,
            'diagnostico' => 'Rolamento da bomba danificado.',
            'procedimento' => 'Substituicao do rolamento e teste operacional.',
            'material_utilizado' => 'Rolamento 6204 e graxa.',
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('os.status', 'finalizada')
            ->assertJsonPath('execucao.diagnostico', 'Rolamento da bomba danificado.')
            ->assertJsonPath(
                'execucao.procedimento',
                'Substituicao do rolamento e teste operacional.'
            )
            ->assertJsonPath('execucao.material_utilizado', 'Rolamento 6204 e graxa.');

        $this->assertDatabaseHas('ordem_servicos', [
            'id' => $os->id,
            'status' => 'finalizada',
        ]);
        $this->assertDatabaseHas('execucoes', [
            'id' => $execucaoId,
            'diagnostico' => 'Rolamento da bomba danificado.',
            'procedimento' => 'Substituicao do rolamento e teste operacional.',
            'material_utilizado' => 'Rolamento 6204 e graxa.',
        ]);
    }

    public function test_finalizacao_exige_diagnostico_e_procedimento(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $iniciar = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar");

        $this->postJson("/api/v1/ordens-servico/{$os->id}/execucoes/finalizar", [
            'execucao_id' => $iniciar->json('execucao.id'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['diagnostico', 'procedimento']);
    }

    public function test_operacoes_offline_repetidas_nao_duplicam_execucao_ou_finalizacao(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);
        $inicioOperationId = '11111111-1111-4111-8111-111111111111';
        $fimOperationId = '22222222-2222-4222-8222-222222222222';

        Sanctum::actingAs($tecnico);

        $primeiroInicio = $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/iniciar",
            ['client_operation_id' => $inicioOperationId]
        );
        $segundoInicio = $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/iniciar",
            ['client_operation_id' => $inicioOperationId]
        );
        $execucaoId = $primeiroInicio->json('execucao.id');

        $segundoInicio
            ->assertOk()
            ->assertJsonPath('execucao.id', $execucaoId);

        $payloadFinalizacao = [
            'execucao_id' => $execucaoId,
            'diagnostico' => 'Diagnostico offline.',
            'procedimento' => 'Procedimento offline.',
            'client_operation_id' => $fimOperationId,
        ];

        $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/execucoes/finalizar",
            $payloadFinalizacao
        )->assertOk();
        $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/execucoes/finalizar",
            $payloadFinalizacao
        )
            ->assertOk()
            ->assertJsonPath('execucao.id', $execucaoId);

        $this->assertDatabaseCount('execucoes', 1);
        $this->assertDatabaseHas('execucoes', [
            'id' => $execucaoId,
            'client_operation_id' => $inicioOperationId,
            'finalizacao_client_operation_id' => $fimOperationId,
        ]);
    }

    public function test_upload_offline_repetido_nao_duplica_anexo(): void
    {
        Storage::fake('local');

        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);
        $operationId = '33333333-3333-4333-8333-333333333333';

        Sanctum::actingAs($tecnico);

        $payload = [
            'arquivo' => UploadedFile::fake()->create(
                'evidencia.pdf',
                200,
                'application/pdf'
            ),
            'client_operation_id' => $operationId,
        ];

        $primeiro = $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/anexos",
            $payload
        );
        $segundo = $this->postJson(
            "/api/v1/ordens-servico/{$os->id}/anexos",
            [
                'arquivo' => UploadedFile::fake()->create(
                    'evidencia.pdf',
                    200,
                    'application/pdf'
                ),
                'client_operation_id' => $operationId,
            ]
        );

        $primeiro->assertCreated();
        $segundo
            ->assertOk()
            ->assertJsonPath('anexo.id', $primeiro->json('anexo.id'));

        $this->assertDatabaseCount('anexos', 1);
    }

    public function test_tecnico_nao_pode_marcar_como_nao_executada_os_de_outro_tecnico(): void
    {
        $tecnicoResponsavel = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnicoResponsavel->id);

        Sanctum::actingAs($outroTecnico);

        $response = $this->postJson("/api/v1/ordens-servico/{$os->id}/nao-executada", [
            'motivo_nao_execucao' => 'Equipamento indisponivel.',
        ]);

        $response->assertStatus(403);
    }

    public function test_tecnico_responsavel_pode_enviar_anexo_em_armazenamento_privado(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $response = $this->postJson("/api/v1/ordens-servico/{$os->id}/anexos", [
            'arquivo' => UploadedFile::fake()->create('evidencia.pdf', 200, 'application/pdf'),
            'latitude' => -9.97499,
            'longitude' => -67.8243,
            'precisao_metros' => 8.5,
            'geolocalizacao_capturada_em' => now()->toISOString(),
            'rua_capturada' => 'Avenida Ceara',
            'bairro_capturado' => 'Centro',
            'cidade_capturada' => 'Rio Branco',
            'estado_capturado' => 'Acre',
            'endereco_capturado' => 'Avenida Ceara, Centro, Rio Branco/AC',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('anexo.tipo', 'pdf')
            ->assertJsonPath('anexo.latitude', -9.97499)
            ->assertJsonPath('anexo.longitude', -67.8243)
            ->assertJsonMissingPath('anexo.caminho')
            ->assertJsonPath('anexo.rua_capturada', 'Avenida Ceara')
            ->assertJsonPath('anexo.bairro_capturado', 'Centro')
            ->assertJsonPath('anexo.cidade_capturada', 'Rio Branco')
            ->assertJsonPath('anexo.estado_capturado', 'Acre')
            ->assertJsonPath('endereco_os.rua', 'Avenida Ceara')
            ->assertJsonPath('endereco_os.estado', 'AC')
            ->assertJsonPath('anexo.endereco_capturado', 'Avenida Ceara, Centro, Rio Branco/AC');

        $this->assertDatabaseHas('anexos', [
            'os_id' => $os->id,
            'submetido_por_id' => $tecnico->id,
            'tipo' => 'pdf',
            'latitude' => -9.97499,
            'longitude' => -67.8243,
            'rua_capturada' => 'Avenida Ceara',
            'bairro_capturado' => 'Centro',
            'cidade_capturada' => 'Rio Branco',
            'estado_capturado' => 'Acre',
            'endereco_capturado' => 'Avenida Ceara, Centro, Rio Branco/AC',
        ]);

        $this->assertDatabaseHas('enderecos', [
            'id' => $os->endereco_id,
            'rua' => 'Avenida Ceara',
            'numero' => '100',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900000',
            'latitude' => -9.97499,
            'longitude' => -67.8243,
        ]);

        $caminho = (string) Anexo::query()
            ->where('os_id', $os->id)
            ->value('caminho');

        Storage::disk('local')->assertExists($caminho);
        Storage::disk('public')->assertMissing($caminho);
    }

    public function test_usuario_autenticado_pode_visualizar_anexo_por_rota_privada(): void
    {
        Storage::fake('local');
        Log::spy();

        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $upload = $this->postJson("/api/v1/ordens-servico/{$os->id}/anexos", [
            'arquivo' => UploadedFile::fake()->create('evidencia.pdf', 200, 'application/pdf'),
        ]);

        $anexoId = (string) $upload->json('anexo.id');

        $response = $this->get("/api/v1/anexos/{$anexoId}/arquivo");

        $response->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $response->headers->get('content-type')
        );
        $this->assertStringContainsString(
            'inline;',
            (string) $response->headers->get('content-disposition')
        );

        Log::shouldHaveReceived('info')
            ->withArgs(function (string $message, array $context) use ($tecnico, $anexoId, $os) {
                return $message === 'anexo_access_granted'
                    && $context['user_id'] === $tecnico->id
                    && $context['anexo_id'] === $anexoId
                    && $context['os_id'] === $os->id;
            })
            ->once();
    }

    public function test_tecnico_nao_pode_visualizar_anexo_de_os_de_outro_tecnico(): void
    {
        Storage::fake('local');
        Log::spy();

        $tecnicoResponsavel = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnicoResponsavel->id);

        Sanctum::actingAs($tecnicoResponsavel);

        $upload = $this->postJson("/api/v1/ordens-servico/{$os->id}/anexos", [
            'arquivo' => UploadedFile::fake()->create('evidencia.pdf', 200, 'application/pdf'),
        ]);

        $anexoId = (string) $upload->json('anexo.id');

        Sanctum::actingAs($outroTecnico);

        $response = $this->get("/api/v1/anexos/{$anexoId}/arquivo");

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Acesso negado ao anexo solicitado.');

        Log::shouldHaveReceived('info')
            ->withArgs(function (string $message, array $context) use ($outroTecnico, $anexoId, $os) {
                return $message === 'anexo_access_denied'
                    && $context['user_id'] === $outroTecnico->id
                    && $context['anexo_id'] === $anexoId
                    && $context['os_id'] === $os->id
                    && $context['motivo'] === 'tecnico_sem_permissao_na_os';
            })
            ->once();
    }

    public function test_administrador_pode_exportar_pdf_detalhado_da_os(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($admin);

        $response = $this->get("/api/v1/ordens-servico/{$os->id}/relatorio/pdf");

        $response->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $response->headers->get('content-type')
        );
        $this->assertStringContainsString(
            'attachment;',
            (string) $response->headers->get('content-disposition')
        );
        $this->assertStringStartsWith('%PDF-', (string) $response->getContent());
    }

    public function test_tecnico_responsavel_nao_pode_exportar_pdf_detalhado_da_propria_os(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson("/api/v1/ordens-servico/{$os->id}/relatorio/pdf");

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Acesso negado ao relatório solicitado.');
    }

    public function test_tecnico_nao_pode_exportar_pdf_detalhado_de_os_de_outro_tecnico(): void
    {
        $tecnicoResponsavel = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnicoResponsavel->id);

        Sanctum::actingAs($outroTecnico);

        $response = $this->getJson("/api/v1/ordens-servico/{$os->id}/relatorio/pdf");

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Acesso negado ao relatório solicitado.');
    }

    public function test_rota_privada_consegue_ler_anexo_legado_do_disco_publico(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Storage::disk('public')->put('anexos/legado.pdf', 'conteudo legado');

        $anexo = Anexo::query()->create([
            'os_id' => $os->id,
            'caminho' => 'anexos/legado.pdf',
            'tipo' => 'pdf',
            'submetido_por_id' => $tecnico->id,
            'criado_em' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->get("/api/v1/anexos/{$anexo->id}/arquivo");

        $response->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $response->headers->get('content-type')
        );
    }

    public function test_busca_de_ordens_funciona_com_sqlite_usando_q(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id, [
            'numero' => '2026-000321',
            'tipo' => 'Manutencao ETA/ETE',
            'descricao' => 'Falha na bomba principal',
            'nome_cliente' => 'ETA Central',
        ]);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/ordens-servico?q=bomba');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $os->id);
    }

    public function test_tecnico_lista_apenas_os_sem_responsavel_ou_da_propria_responsabilidade(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');

        $osSemResponsavel = $this->criarOs(null, [
            'numero' => '2026-000101',
            'status' => 'aberta',
        ]);
        $osDoTecnico = $this->criarOs($tecnico->id, [
            'numero' => '2026-000102',
            'status' => 'em_execucao',
        ]);
        $this->criarOs($outroTecnico->id, [
            'numero' => '2026-000103',
            'status' => 'aberta',
        ]);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/ordens-servico');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $osSemResponsavel->id])
            ->assertJsonFragment(['id' => $osDoTecnico->id])
            ->assertJsonMissing(['numero' => '2026-000103']);
    }

    public function test_tecnico_nao_pode_visualizar_detalhe_de_os_atribuida_a_outro_tecnico(): void
    {
        $tecnicoResponsavel = $this->criarUsuario('tecnico');
        $outroTecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnicoResponsavel->id);

        Sanctum::actingAs($outroTecnico);

        $response = $this->getJson("/api/v1/ordens-servico/{$os->id}");

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Acesso negado a esta ordem de serviço.');
    }

    public function test_tecnico_pode_visualizar_detalhe_de_os_aberta_sem_responsavel(): void
    {
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs(null, [
            'status' => 'aberta',
        ]);

        Sanctum::actingAs($tecnico);

        $response = $this->getJson("/api/v1/ordens-servico/{$os->id}");

        $response
            ->assertOk()
            ->assertJsonPath('id', $os->id);
    }

    public function test_tecnico_nao_pode_criar_os_geral(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        Sanctum::actingAs($tecnico);

        $response = $this->postJson('/api/v1/ordens-servico', [
            'tipo_servico' => 'Manutencao',
            'nome_cliente' => 'Cliente Teste',
            'prioridade' => 2,
            'descricao' => 'Teste de criacao de OS geral por tecnico',
            'endereco' => [
                'logradouro' => 'Rua Teste',
                'numero' => '100',
                'bairro' => 'Centro',
                'cidade' => 'Rio Branco',
                'estado' => 'AC',
                'cep' => '69900000',
            ],
        ]);

        $response->assertStatus(403);
    }

    public function test_administrador_nao_pode_operar_fluxo_tecnico_da_os(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico');
        $os = $this->criarOs($tecnico->id);

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/ordens-servico/{$os->id}/iniciar");

        $response->assertStatus(403);
    }

    public function test_administrador_nao_pode_criar_ordem_de_servico(): void
    {
        $admin = $this->criarUsuario('administrador');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/ordens-servico', [
            'tipo_servico' => 'Manutencao',
            'nome_cliente' => 'Cliente Teste',
            'prioridade' => 2,
            'descricao' => 'Teste de criacao de OS por administrador',
            'endereco' => [
                'logradouro' => 'Rua Teste',
                'numero' => '100',
                'bairro' => 'Centro',
                'cidade' => 'Rio Branco',
                'estado' => 'AC',
                'cep' => '69900000',
            ],
        ]);

        $response->assertStatus(403);
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
