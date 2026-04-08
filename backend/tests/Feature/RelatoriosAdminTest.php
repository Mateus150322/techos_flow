<?php

namespace Tests\Feature;

use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelatoriosAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrador_pode_consultar_relatorio_de_ordens(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico', 'Tecnico Campo');

        $this->criarOs($tecnico->id, [
            'numero' => '2026-000111',
            'tipo' => 'Manutenção ETA/ETE',
            'status' => 'finalizada',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/relatorios/ordens-servico?tipo_relatorio=status');

        $response
            ->assertOk()
            ->assertJsonPath('resumo.total', 1)
            ->assertJsonPath('reportDefinition.title', 'Relatório por Status');
    }

    public function test_nao_admin_nao_pode_consultar_relatorio_de_ordens(): void
    {
        $tecnico = $this->criarUsuario('tecnico');

        Sanctum::actingAs($tecnico);

        $response = $this->getJson('/api/v1/relatorios/ordens-servico');

        $response->assertStatus(403);
    }

    public function test_administrador_pode_exportar_relatorios_em_csv_xlsx_e_pdf(): void
    {
        $admin = $this->criarUsuario('administrador');
        $tecnico = $this->criarUsuario('tecnico', 'Tecnico Campo');

        $this->criarOs($tecnico->id, [
            'numero' => '2026-000222',
            'tipo' => 'Manutenção ETA/ETE',
            'status' => 'finalizada',
            'descricao' => 'Troca de bomba principal',
        ]);

        Sanctum::actingAs($admin);

        $csvResponse = $this->get('/api/v1/relatorios/ordens-servico/exportar/csv');
        $xlsxResponse = $this->get('/api/v1/relatorios/ordens-servico/exportar/xlsx');
        $pdfResponse = $this->get('/api/v1/relatorios/ordens-servico/exportar/pdf');

        $csvResponse->assertOk();
        $this->assertStringContainsString(
            'text/csv',
            (string) $csvResponse->headers->get('content-type')
        );
        $this->assertStringContainsString(
            'attachment;',
            (string) $csvResponse->headers->get('content-disposition')
        );
        $this->assertStringContainsString('Número da OS', $csvResponse->getContent());

        $xlsxResponse->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml.sheet',
            (string) $xlsxResponse->headers->get('content-type')
        );
        $this->assertStringStartsWith('PK', (string) $xlsxResponse->getContent());

        $pdfResponse->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $pdfResponse->headers->get('content-type')
        );
        $pdfContent = (string) $pdfResponse->getContent();
        $this->assertStringStartsWith('%PDF-', $pdfContent);
        $this->assertStringContainsString('Assinatura/', $pdfContent);
        $this->assertStringContainsString('Documento administrativo interno', $pdfContent);
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
            'tipo' => 'Manutenção',
            'nome_cliente' => 'Cliente Teste',
            'status' => 'aberta',
            'prioridade' => 2,
            'descricao' => 'Descrição de teste',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $criador->id,
            'tecnico_responsavel_id' => $tecnicoResponsavelId,
        ], $override));
    }
}
