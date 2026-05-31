<?php

namespace App\Services\Relatorios;

use App\Models\Anexo;
use App\Models\ExecucaoFuncionario;
use App\Models\OrdemServico;
use App\Services\Storage\AnexoStorageService;
use Illuminate\Support\Collection;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

class OrdemServicoDetalhadaPdfService
{
    private const FOTO_TITULOS = [
        'Evidencia 1',
        'Evidencia 2',
        'Evidencia 3',
        'Evidencia 4',
        'Evidencia 5',
        'Evidencia 6',
        'Evidencia 7',
        'Evidencia 8',
        'Evidencia 9',
        'Evidencia 10',
        'Evidencia 11',
        'Evidencia 12',
    ];

    public function __construct(
        private readonly AnexoStorageService $anexoStorage
    ) {
    }

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
            'execucoes.execucaoFuncionarios.colaboradorOperacional',
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

        return [
            'numero' => $ordemServico->numero,
            'titulo' => 'Relatório Detalhado de Ordem de Serviço',
            'tipo' => (string) $ordemServico->tipo,
            'status' => $this->formatStatus((string) $ordemServico->status),
            'statusTone' => $this->statusTone((string) $ordemServico->status),
            'prioridade' => $this->formatPrioridade((int) $ordemServico->prioridade),
            'prioridadeTone' => $this->prioridadeTone((int) $ordemServico->prioridade),
            'descricaoSolicitacao' => $camposDescricao['descricao_os'] ?: (string) $ordemServico->descricao,
            'execucaoServico' => $camposDescricao['procedimento']
                ?: ($execucaoPrincipal?->observacao ?: 'Execução sem observações registradas.'),
            'conclusaoTecnica' => $this->buildConclusaoTecnica($camposDescricao, $execucaoPrincipal),
            'linhas_esquerda' => $this->buildLinhasEsquerda(
                $ordemServico,
                $execucaoPrincipal,
                $execucaoFuncionarios
            ),
            'linhas_direita' => $this->buildLinhasDireita($camposDescricao, $execucaoPrincipal),
            'equipe' => $this->buildEquipeRows($execucaoFuncionarios, $execucaoPrincipal),
            'mostrar_horas_extras' => $mostrarHorasExtras,
            'horas_extras' => $mostrarHorasExtras
                ? $this->buildHorasExtrasRows($execucaoFuncionarios)
                : [],
            'fotos' => $this->buildFotos($ordemServico->anexos),
            'data_emissao' => now()->format('d/m/Y H:i'),
        ];
    }

    /**
     * @param Collection<int, ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array{label:string,value:string}>
     */
    private function buildLinhasEsquerda(
        OrdemServico $ordemServico,
        mixed $execucaoPrincipal,
        Collection $execucaoFuncionarios
    ): array {
        $endereco = $ordemServico->endereco;
        $equipe = $execucaoFuncionarios
            ->map(fn (ExecucaoFuncionario $item) => $item->participanteNome())
            ->filter()
            ->unique()
            ->implode(', ');

        return array_values(array_filter([
            $this->linha('Data de abertura', $this->formatDateTime($ordemServico->data_abertura)),
            $this->linha('Data de início', $this->formatDateTime($execucaoPrincipal?->data_inicio)),
            $this->linha(
                'Data de finalização',
                $this->formatDateTime($execucaoPrincipal?->data_fim ?? $ordemServico->data_encerramento)
            ),
            $this->linha('Criada por', $ordemServico->criadaPor?->name),
            $this->linha('Técnico responsável', $ordemServico->tecnicoResponsavel?->name),
            $this->linha('Equipe participante', $equipe),
            $this->linha(
                'Endereço cadastral da OS',
                trim(implode(', ', array_filter([
                    $endereco?->rua,
                    $endereco?->numero,
                ])))
            ),
            $this->linha('Bairro', $endereco?->bairro),
            $this->linha(
                'Cidade',
                trim(implode(' - ', array_filter([
                    $endereco?->cidade,
                    $endereco?->estado,
                ])))
            ),
            $this->linha('CEP', $this->formatCep((string) ($endereco?->cep ?? ''))),
            $this->linha('Latitude da OS', $this->formatCoordinate($endereco?->latitude)),
            $this->linha('Longitude da OS', $this->formatCoordinate($endereco?->longitude)),
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
            $this->linha('Local operacional', $camposDescricao['local'] ?? ''),
            $this->linha('Setor', $camposDescricao['setor'] ?? ''),
            $this->linha('Encarregado', $camposDescricao['encarregado'] ?? ''),
            $this->linha('Diagnóstico', $camposDescricao['diagnostico'] ?? ''),
            $this->linha('Observação da execução', $execucaoPrincipal?->observacao ?? ''),
        ], fn (mixed $item) => $item !== null));
    }

    /**
     * @param Collection<int, ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array<string, string>>
     */
    private function buildEquipeRows(Collection $execucaoFuncionarios, mixed $execucaoPrincipal): array
    {
        if ($execucaoFuncionarios->isEmpty() && $execucaoPrincipal?->tecnico) {
            return [[
                'nome' => $execucaoPrincipal->tecnico->name ?? 'Técnico responsável',
                'funcao' => 'Responsável técnico',
                'horario' => $this->formatHorarioIntervalo(
                    $execucaoPrincipal->data_inicio,
                    $execucaoPrincipal->data_fim
                ),
                'horas_trabalhadas' => '-',
                'hora_extra' => '-',
            ]];
        }

        return $execucaoFuncionarios
            ->map(function (ExecucaoFuncionario $item) use ($execucaoPrincipal) {
                return [
                    'nome' => $item->participanteNome(),
                    'funcao' => $this->isResponsavelTecnico($item, $execucaoPrincipal)
                        ? 'Responsável técnico'
                        : $item->participanteFuncao(),
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
     * @param Collection<int, ExecucaoFuncionario> $execucaoFuncionarios
     * @return array<int, array<string, string>>
     */
    private function buildHorasExtrasRows(Collection $execucaoFuncionarios): array
    {
        return $execucaoFuncionarios
            ->map(function (ExecucaoFuncionario $item) {
                return [
                    'funcionario' => $item->participanteNome(),
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
     * @return array<int, array<string, string|null>>
     */
    private function buildFotos(Collection $anexos): array
    {
        return $anexos
            ->filter(fn (Anexo $anexo) => $anexo->tipo === 'foto')
            ->sortByDesc(fn (Anexo $anexo) => $anexo->latitude !== null && $anexo->longitude !== null)
            ->values()
            ->map(function (Anexo $anexo, int $index) {
                return [
                    'titulo' => self::FOTO_TITULOS[$index] ?? ('Evidência ' . ($index + 1)),
                    'src' => $this->buildImageDataUri($anexo),
                    'registrada_por' => $anexo->submetidoPor?->name,
                    'capturada_em' => $this->formatDateTime($anexo->geolocalizacao_capturada_em),
                    'coordenadas' => $this->buildCoordenadas($anexo),
                    'precisao' => $this->formatPrecisao($anexo->precisao_metros),
                    'rua' => $anexo->rua_capturada,
                    'bairro' => $anexo->bairro_capturado,
                    'cidade_estado' => $this->buildCidadeEstado($anexo),
                    'endereco_capturado' => $this->buildEnderecoCapturado($anexo),
                ];
            })
            ->all();
    }

    private function buildImageDataUri(Anexo $anexo): ?string
    {
        $disk = $this->anexoStorage->resolveDisk($anexo->caminho);

        if (! $disk) {
            return null;
        }

        $mime = $this->anexoStorage->mimeType((string) $anexo->caminho, $disk);

        if (! is_string($mime) || ! str_starts_with($mime, 'image/')) {
            return null;
        }

        $content = $this->anexoStorage->get((string) $anexo->caminho, $disk);

        if (! is_string($content)) {
            return null;
        }

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

    private function formatCoordinate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return number_format((float) $value, 6, ',', '.');
    }

    private function buildCoordenadas(Anexo $anexo): ?string
    {
        $latitude = $this->formatCoordinate($anexo->latitude);
        $longitude = $this->formatCoordinate($anexo->longitude);

        if (! $latitude || ! $longitude) {
            return null;
        }

        return $latitude . ' / ' . $longitude;
    }

    private function formatPrecisao(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return number_format((float) $value, 1, ',', '.') . ' m';
    }

    private function buildCidadeEstado(Anexo $anexo): ?string
    {
        $cidadeEstado = trim(implode(' - ', array_filter([
            $anexo->cidade_capturada,
            $anexo->estado_capturado,
        ])));

        return $cidadeEstado !== '' ? $cidadeEstado : null;
    }

    private function buildEnderecoCapturado(Anexo $anexo): ?string
    {
        if (! empty($anexo->endereco_capturado)) {
            return $anexo->endereco_capturado;
        }

        $partes = array_filter([
            $anexo->rua_capturada,
            $anexo->bairro_capturado,
            $anexo->cidade_capturada,
            $anexo->estado_capturado,
        ]);

        if ($partes === []) {
            return null;
        }

        return implode(', ', $partes);
    }

    private function isResponsavelTecnico(
        ExecucaoFuncionario $item,
        mixed $execucaoPrincipal
    ): bool {
        return $item->participanteTipoVinculo() === 'usuario'
            && $item->funcionario_id !== null
            && $execucaoPrincipal?->tecnico_id === $item->funcionario_id;
    }
}
