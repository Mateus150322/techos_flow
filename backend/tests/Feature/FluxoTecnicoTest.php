<?php

namespace Tests\Feature;

use App\Models\Anexo;
use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
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
        ]);

        $finalizar
            ->assertOk()
            ->assertJsonPath('os.status', 'finalizada');

        $this->assertDatabaseHas('ordem_servicos', [
            'id' => $os->id,
            'status' => 'finalizada',
        ]);
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
            'endereco_capturado' => 'Avenida Ceara, Centro, Rio Branco/AC',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('anexo.tipo', 'pdf')
            ->assertJsonPath('anexo.latitude', -9.97499)
            ->assertJsonPath('anexo.longitude', -67.8243)
            ->assertJsonPath('anexo.endereco_capturado', 'Avenida Ceara, Centro, Rio Branco/AC');

        $caminho = (string) $response->json('anexo.caminho');

        $this->assertDatabaseHas('anexos', [
            'os_id' => $os->id,
            'submetido_por_id' => $tecnico->id,
            'tipo' => 'pdf',
            'latitude' => -9.97499,
            'longitude' => -67.8243,
            'endereco_capturado' => 'Avenida Ceara, Centro, Rio Branco/AC',
        ]);
        Storage::disk('local')->assertExists($caminho);
        Storage::disk('public')->assertMissing($caminho);
    }

    public function test_usuario_autenticado_pode_visualizar_anexo_por_rota_privada(): void
    {
        Storage::fake('local');

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
