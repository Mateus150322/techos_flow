<?php

namespace App\Services\Relatorios;

use App\Models\Anexo;
use App\Models\OrdemServico;
use App\Services\Storage\AnexoStorageService;
use App\Exports\Relatorios\RelatorioOrdensWorkbookExport;
use App\Services\Spreadsheet\SpreadsheetWorkbookBuilder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RelatorioExportService
{
    private const MAX_XLSX_ROWS = 5000;
    private const MAX_PDF_ROWS = 1000;
    private const CSV_DELIMITER = ';';
    private const FOTO_TITULOS = [
        'Evidência 1',
        'Evidência 2',
        'Evidência 3',
        'Evidência 4',
        'Evidência 5',
        'Evidência 6',
        'Evidência 7',
        'Evidência 8',
        'Evidência 9',
        'Evidência 10',
        'Evidência 11',
        'Evidência 12',
    ];

    public function __construct(
        private readonly SpreadsheetWorkbookBuilder $spreadsheetWorkbookBuilder,
        private readonly AnexoStorageService $anexoStorage
    ) {
    }

    public function export(string $format, array $payload, string $responsavelEmissao): array
    {
        return match ($format) {
            'csv' => [
                'content' => $this->buildCsvContent($payload['reportDefinition']),
                'contentType' => 'text/csv; charset=UTF-8',
                'fileName' => $this->buildExportFileName($payload['reportDefinition']['title'], 'csv'),
            ],
            'xlsx' => [
                'content' => $this->spreadsheetWorkbookBuilder->build(
                    (new RelatorioOrdensWorkbookExport($payload))->sheets()
                ),
                'contentType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'fileName' => $this->buildExportFileName($payload['reportDefinition']['title'], 'xlsx'),
            ],
            'pdf' => [
                'content' => $this->buildPdf($payload, $responsavelEmissao)->generatePdfContent(),
                'contentType' => 'application/pdf',
                'fileName' => $this->buildExportFileName($payload['reportDefinition']['title'], 'pdf'),
            ],
            default => abort(404),
        };
    }

    public function ensureExportWithinLimits(string $format, int $rowCount): void
    {
        if ($format === 'xlsx' && $rowCount > self::MAX_XLSX_ROWS) {
            abort(422, 'Exportação XLSX limitada a 5000 registros. Use CSV para volumes maiores.');
        }

        if ($format === 'pdf' && $rowCount > self::MAX_PDF_ROWS) {
            abort(422, 'Exportação PDF limitada a 1000 registros. Use CSV ou XLSX para volumes maiores.');
        }
    }

    public function streamCsv(string $reportTitle, array $columns, callable $emitRows): StreamedResponse
    {
        return response()->streamDownload(
            function () use ($columns, $emitRows) {
                $handle = fopen('php://output', 'w');

                if ($handle === false) {
                    abort(500, 'Não foi possível preparar o arquivo CSV.');
                }

                fwrite($handle, chr(239) . chr(187) . chr(191));
                fputcsv(
                    $handle,
                    array_map(fn (array $column) => $column['label'], $columns),
                    self::CSV_DELIMITER
                );

                $emitRows(function (array $row) use ($handle, $columns) {
                    fputcsv(
                        $handle,
                        array_map(
                            fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                            $columns
                        ),
                        self::CSV_DELIMITER
                    );
                });

                fclose($handle);
            },
            $this->buildExportFileName($reportTitle, 'csv'),
            ['Content-Type' => 'text/csv; charset=UTF-8']
        );
    }

    public function buildPdf(array $payload, string $responsavelEmissao): PdfBuilder
    {
        $title = (string) $payload['reportDefinition']['title'];
        $pdfPayload = $this->buildPdfPayload($payload);

        return Pdf::view('pdf.relatorios.ordens-servico', [
            'payload' => $pdfPayload,
            'responsavelEmissao' => $responsavelEmissao,
        ])
            ->driver('dompdf')
            ->landscape()
            ->format('a4')
            ->margins(10, 10, 14, 10)
            ->meta(
                title: $title,
                author: 'TechOS Flow',
                subject: $title,
                creator: 'TechOS Flow'
            )
            ->name($this->buildExportFileName($title, 'pdf'))
            ->download();
    }

    private function buildExportFileName(string $reportTitle, string $format): string
    {
        $slug = Str::slug($reportTitle);

        return "{$slug}-" . now()->format('Ymd-His') . ".{$format}";
    }

    private function buildCsvContent(array $reportDefinition): string
    {
        $handle = fopen('php://temp', 'r+');

        if ($handle === false) {
            abort(500, 'Não foi possível preparar o arquivo CSV.');
        }

        fwrite($handle, chr(239) . chr(187) . chr(191));
        fputcsv(
            $handle,
            array_map(fn (array $column) => $column['label'], $reportDefinition['columns']),
            self::CSV_DELIMITER
        );

        foreach ($reportDefinition['rows'] as $row) {
            fputcsv(
                $handle,
                array_map(
                    fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $reportDefinition['columns']
                ),
                self::CSV_DELIMITER
            );
        }

        rewind($handle);
        $content = stream_get_contents($handle) ?: '';
        fclose($handle);

        return $content;
    }

    private function sanitizeTextValue(mixed $value): string
    {
        $text = (string) $value;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    private function buildPdfPayload(array $payload): array
    {
        $payload['ordensRelatorio'] = $this->buildOrdensRelatorio($payload['ordensExportacao'] ?? []);

        return $payload;
    }

    private function buildOrdensRelatorio(array $ordensExportacao): array
    {
        $ordensBase = collect($ordensExportacao)
            ->filter(fn (array $ordem) => ! empty($ordem['id']))
            ->values();

        if ($ordensBase->isEmpty()) {
            return [];
        }

        $ordens = OrdemServico::query()
            ->with([
                'anexos.submetidoPor:id,name',
                'tecnicoResponsavel:id,name',
            ])
            ->whereIn('id', $ordensBase->pluck('id')->all())
            ->get()
            ->keyBy('id');

        return $ordensBase
            ->map(function (array $ordemBase) use ($ordens) {
                /** @var OrdemServico|null $ordem */
                $ordem = $ordens->get($ordemBase['id']);

                if (! $ordem) {
                    return null;
                }

                $fotos = $this->buildFotos($ordem->anexos);

                return [
                    'id' => $ordem->id,
                    'numero' => $ordemBase['numero'] ?? $ordem->numero,
                    'tipo' => $ordemBase['tipo'] ?? $ordem->tipo,
                    'status' => $ordemBase['status'] ?? '-',
                    'prioridade' => $ordemBase['prioridade'] ?? '-',
                    'clienteLocal' => $ordemBase['clienteLocal'] ?? ($ordem->nome_cliente ?? '-'),
                    'responsavel' => $ordemBase['responsavel']
                        ?? ($ordem->tecnicoResponsavel?->name ?? 'Sem responsável'),
                    'abertura' => $ordemBase['abertura'] ?? '-',
                    'encerramento' => $ordemBase['encerramento'] ?? '-',
                    'contexto' => $ordemBase['contexto'] ?? '-',
                    'fotos' => $fotos,
                ];
            })
            ->filter()
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

    private function formatDateTime(mixed $value): string
    {
        if (! $value) {
            return '-';
        }

        return $value->format('d/m/Y H:i');
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

        return $partes !== [] ? implode(', ', $partes) : null;
    }
}
