<?php

namespace App\Services\Relatorios;

use App\Models\Anexo;
use App\Models\OrdemServico;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

class OrdemServicoDetalhadaPdfService
{
    public function buildPdf(
        OrdemServico $ordemServico,
        string $responsavelEmissao,
        bool $mostrarHorasExtras = false
    ): PdfBuilder {
        $ordemServico->loadMissing([
            'endereco',
            'criadaPor',
            'tecnicoResponsavel',
            'execucoes.tecnico',
            'execucoes.execucaoFuncionarios.funcionario',
            'anexos.submetidoPor',
        ]);

        $payload = $this->buildPayload($ordemServico, $mostrarHorasExtras);

        return Pdf::view('pdf.ordens-servico.detalhado', [
            'payload' => $payload,
            'responsavelEmissao' => $responsavelEmissao,
        ])
            ->driver('dompdf')
            ->format('a4')
            ->margins(10, 10, 14, 10)
            ->meta(
                title: 'Relatório detalhado da OS ' . $ordemServico->numero,
                author: 'TechOS Flow',
                subject: 'Relatório detalhado da ordem de serviço',
                creator: 'TechOS Flow'
            )
            ->name('relatorio-os-' . $ordemServico->numero . '.pdf')
            ->download();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(OrdemServico $ordemServico, bool $mostrarHorasExtras): array
    {
        $execucaoPrincipal = $ordemServico->execucoes->first();
        $execucaoFuncionarios = collect($execucaoPrincipal?->execucaoFuncionarios ?? []);
        $camposDescricao = $this->parseCamposDescricao((string) $ordemServico->descricao);
        $linhasEsquerda = $this->buildLinhasEsquerda($ordemServico, $execucaoPrincipal, $execucaoFuncionarios);
        $linhasDireita = $this->buildLinhasDireita($camposDescricao, $execucaoPrincipal);
        $fotos = $this->buildFotos($ordemServico->anexos);

        return [
            'numero' => $ordemServico->numero,
            'titulo' => 'Relatório Detalhado de Ordem de Serviço',
            'tipo' => (string) $ordemServico->tipo,
            'status' => $this->formatStatus((string) $ordemServico->status),
            'statusTone' => $this->statusTone((string) $ordemServico->status),
            'prioridade' => $this->formatPrioridade((int) $ordemServico->prioridade),
            'prioridadeTone' => $this->prioridadeTone((int) $ordemServico->prioridade),
            'descricaoSolicitacao' => $camposDescricao['descricao_os'] ?: (string) $ordemServico->descricao,
            'execucaoServico' => $camposDescricao['procedimento'] ?: ($execucaoPrincipal?->observacao ?: 'Execução sem observações registradas.'),
            'conclusaoTecnica' => $this->buildConclusaoTecnica($camposDescricao, $execucaoPrincipal),
            'linhas_esquerda' => $linhasEsquerda,
            'linhas_direita' => $linhasDireita,
            'equipe' => $this->buildEquipeRows($execucaoFuncionarios, $execucaoPrincipal),
            'mostrar_horas_extras' => $mostrarHorasExtras,
            'horas_extras' => $mostrarHorasExtras
                ? $this->buildHorasExtrasRows($execucaoFuncionarios)
                : [],
            'fotos' => $fotos,
            'data_emissao' => now()->format('d/m/Y H:i'),
        ];
    }

    /**
     * @param Collection<int, \App\Models\ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array{label:string,value:string}>
     */
    private function buildLinhasEsquerda(
        OrdemServico $ordemServico,
        mixed $execucaoPrincipal,
        Collection $execucaoFuncionarios
    ): array {
        $endereco = $ordemServico->endereco;
        $primeiraGeo = $ordemServico->anexos
            ->first(fn (Anexo $anexo) => $anexo->latitude !== null && $anexo->longitude !== null);
        $equipe = $execucaoFuncionarios
            ->map(fn ($item) => $item->funcionario?->name)
            ->filter()
            ->unique()
            ->implode(', ');

        return array_values(array_filter([
            $this->linha('Data de abertura', $this->formatDateTime($ordemServico->data_abertura)),
            $this->linha('Data de início', $this->formatDateTime($execucaoPrincipal?->data_inicio)),
            $this->linha('Data de finalização', $this->formatDateTime($execucaoPrincipal?->data_fim ?? $ordemServico->data_encerramento)),
            $this->linha('Criada por', $ordemServico->criadaPor?->name),
            $this->linha('Técnico responsável', $ordemServico->tecnicoResponsavel?->name),
            $this->linha('Equipe participante', $equipe),
            $this->linha('Endereço', trim(implode(', ', array_filter([
                $endereco?->rua,
                $endereco?->numero,
            ])))),
            $this->linha('Bairro', $endereco?->bairro),
            $this->linha('Cidade', trim(implode(' - ', array_filter([
                $endereco?->cidade,
                $endereco?->estado,
            ])))),
            $this->linha('CEP', $this->formatCep((string) ($endereco?->cep ?? ''))),
            $this->linha('Latitude', $endereco?->latitude ?? $primeiraGeo?->latitude),
            $this->linha('Longitude', $endereco?->longitude ?? $primeiraGeo?->longitude),
        ], fn (mixed $item) => $item !== null));
    }

    /**
     * @param array<string, string> $camposDescricao
     * @return array<int, array{label:string,value:string}>
     */
    private function buildLinhasDireita(array $camposDescricao, mixed $execucaoPrincipal): array
    {
        return array_values(array_filter([
            $this->linha('Equipamento', $camposDescricao['equipamento'] ?? ''),
            $this->linha('Unidade', $camposDescricao['unidade'] ?? ''),
            $this->linha('Categoria', $camposDescricao['tipo_manutencao'] ?? ''),
            $this->linha('Local', $camposDescricao['local'] ?? ''),
            $this->linha('Setor', $camposDescricao['setor'] ?? ''),
            $this->linha('Encarregado', $camposDescricao['encarregado'] ?? ''),
            $this->linha('Diagnóstico', $camposDescricao['diagnostico'] ?? ''),
            $this->linha('Observação', $execucaoPrincipal?->observacao ?? ''),
        ], fn (mixed $item) => $item !== null));
    }

    /**
     * @param Collection<int, \App\Models\ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array<string, string>>
     */
    private function buildEquipeRows(Collection $execucaoFuncionarios, mixed $execucaoPrincipal): array
    {
        if ($execucaoFuncionarios->isEmpty() && $execucaoPrincipal?->tecnico) {
            return [[
                'nome' => $execucaoPrincipal->tecnico->name ?? 'Técnico responsável',
                'funcao' => 'Responsável',
                'horario' => $this->formatHorarioIntervalo(
                    $execucaoPrincipal->data_inicio,
                    $execucaoPrincipal->data_fim
                ),
                'horas_trabalhadas' => '-',
                'hora_extra' => '-',
            ]];
        }

        return $execucaoFuncionarios
            ->map(function ($item, int $index) {
                return [
                    'nome' => $item->funcionario?->name ?? 'Funcionário',
                    'funcao' => $index === 0 ? 'Responsável' : 'Participante',
                    'horario' => $this->formatHorarioIntervalo($item->data_inicio, $item->data_fim),
                    'horas_trabalhadas' => $this->formatMinutes((int) $item->minutos_trabalhados),
                    'hora_extra' => $this->formatMinutes(
                        (int) $item->minutos_extras_50 + (int) $item->minutos_extras_100
                    ),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, \App\Models\ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array<string, string>>
     */
    private function buildHorasExtrasRows(Collection $execucaoFuncionarios): array
    {
        return $execucaoFuncionarios
            ->map(function ($item) {
                return [
                    'funcionario' => $item->funcionario?->name ?? 'Funcionário',
                    'data' => optional($item->data_inicio)?->format('d/m/Y') ?? '-',
                    'entrada' => optional($item->data_inicio)?->format('H:i') ?? '-',
                    'saida' => optional($item->data_fim)?->format('H:i') ?? '-',
                    'horas_normais' => $this->formatMinutes((int) $item->minutos_normais),
                    'he_50' => $this->formatMinutes((int) $item->minutos_extras_50),
                    'he_100' => $this->formatMinutes((int) $item->minutos_extras_100),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, Anexo> $anexos
     * @return array<int, array{titulo:string,src:string|null}>
     */
    private function buildFotos(Collection $anexos): array
    {
        $titulos = ['Antes', 'Durante', 'Depois'];

        return $anexos
            ->filter(fn (Anexo $anexo) => $anexo->tipo === 'foto')
            ->take(3)
            ->values()
            ->map(function (Anexo $anexo, int $index) use ($titulos) {
                return [
                    'titulo' => $titulos[$index] ?? ('Evidência ' . ($index + 1)),
                    'src' => $this->buildImageDataUri($anexo),
                ];
            })
            ->all();
    }

    private function buildImageDataUri(Anexo $anexo): ?string
    {
        $disk = $this->resolveStorageDisk($anexo->caminho);

        if (! $disk) {
            return null;
        }

        $mime = Storage::disk($disk)->mimeType($anexo->caminho);

        if (! is_string($mime) || ! str_starts_with($mime, 'image/')) {
            return null;
        }

        $content = Storage::disk($disk)->get($anexo->caminho);

        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }

    /**
     * @return array<string, string>
     */
    private function parseCamposDescricao(string $descricao): array
    {
        $campos = [
            'data_abertura' => '',
            'hora_abertura' => '',
            'unidade' => '',
            'local' => '',
            'setor' => '',
            'encarregado' => '',
            'tipo_manutencao' => '',
            'servico' => '',
            'equipamento' => '',
            'diagnostico' => '',
            'procedimento' => '',
            'material' => '',
            'descricao_os' => '',
        ];

        foreach (preg_split('/\r\n|\r|\n/', $descricao) ?: [] as $linha) {
            $linha = trim($linha);

            if ($linha === '' || ! str_contains($linha, ':')) {
                continue;
            }

            [$label, $value] = array_map('trim', explode(':', $linha, 2));
            $label = mb_strtolower($label);

            $map = [
                'data abertura' => 'data_abertura',
                'hora abertura' => 'hora_abertura',
                'unidade' => 'unidade',
                'local' => 'local',
                'setor' => 'setor',
                'setor requisitante' => 'setor',
                'encarregado' => 'encarregado',
                'tipo manutenção' => 'tipo_manutencao',
                'tipo manutencao' => 'tipo_manutencao',
                'serviço' => 'servico',
                'servico' => 'servico',
                'equipamento' => 'equipamento',
                'diagnóstico' => 'diagnostico',
                'diagnostico' => 'diagnostico',
                'procedimento' => 'procedimento',
                'material' => 'material',
                'descrição da solicitação' => 'descricao_os',
                'descricao da solicitacao' => 'descricao_os',
            ];

            if (isset($map[$label])) {
                $campos[$map[$label]] = $value;
            }
        }

        return $campos;
    }

    private function buildConclusaoTecnica(array $camposDescricao, mixed $execucaoPrincipal): string
    {
        if (! empty($camposDescricao['procedimento'])) {
            return $camposDescricao['procedimento'];
        }

        if (! empty($execucaoPrincipal?->observacao)) {
            return (string) $execucaoPrincipal->observacao;
        }

        return 'Serviço executado conforme registros operacionais da ordem de serviço.';
    }

    /**
     * @return array{label:string,value:string}|null
     */
    private function linha(string $label, mixed $value): ?array
    {
        $texto = trim((string) ($value ?? ''));

        if ($texto === '') {
            return null;
        }

        return [
            'label' => $label,
            'value' => $texto,
        ];
    }

    private function formatDateTime(mixed $value): string
    {
        if (! $value) {
            return '-';
        }

        return $value->format('d/m/Y H:i');
    }

    private function formatHorarioIntervalo(mixed $inicio, mixed $fim): string
    {
        if (! $inicio || ! $fim) {
            return '-';
        }

        return $inicio->format('H:i') . ' - ' . $fim->format('H:i');
    }

    private function formatMinutes(int $minutes): string
    {
        $horas = intdiv($minutes, 60);
        $resto = $minutes % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }

    private function formatPrioridade(int $prioridade): string
    {
        return match ($prioridade) {
            1 => 'Alta',
            2 => 'Média',
            3 => 'Baixa',
            default => 'Não informada',
        };
    }

    private function prioridadeTone(int $prioridade): string
    {
        return match ($prioridade) {
            1 => 'red',
            2 => 'amber',
            3 => 'blue',
            default => 'slate',
        };
    }

    private function formatStatus(string $status): string
    {
        return match ($status) {
            'aberta' => 'Aberta',
            'em_execucao' => 'Em execução',
            'finalizada' => 'Finalizada',
            'nao_executada' => 'Não executada',
            'cancelada' => 'Cancelada',
            default => $status,
        };
    }

    private function statusTone(string $status): string
    {
        return match ($status) {
            'aberta' => 'blue',
            'em_execucao' => 'amber',
            'finalizada' => 'green',
            'nao_executada' => 'red',
            'cancelada' => 'slate',
            default => 'slate',
        };
    }

    private function formatCep(string $cep): string
    {
        $digits = preg_replace('/\D/', '', $cep);

        if (! is_string($digits) || strlen($digits) !== 8) {
            return $cep;
        }

        return substr($digits, 0, 5) . '-' . substr($digits, 5);
    }

    private function resolveStorageDisk(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Storage::disk('local')->exists($path)) {
            return 'local';
        }

        if (Storage::disk('public')->exists($path)) {
            return 'public';
        }

        return null;
    }
}
