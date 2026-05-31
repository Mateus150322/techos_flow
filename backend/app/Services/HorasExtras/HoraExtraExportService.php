<?php

namespace App\Services\HorasExtras;

use App\Exports\HorasExtras\HoraExtraWorkbookExport;
use App\Services\Spreadsheet\SpreadsheetWorkbookBuilder;
use Illuminate\Support\Str;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HoraExtraExportService
{
    private const MAX_XLSX_ROWS = 5000;
    private const MAX_PDF_ROWS = 1000;
    private const CSV_DELIMITER = ';';

    public function __construct(
        private readonly SpreadsheetWorkbookBuilder $spreadsheetWorkbookBuilder
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, string>
     */
    public function export(string $format, array $payload, string $responsavelEmissao): array
    {
        return match ($format) {
            'xlsx' => [
                'content' => $this->spreadsheetWorkbookBuilder->build(
                    (new HoraExtraWorkbookExport($payload))->sheets()
                ),
                'contentType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'fileName' => $this->buildExportFileName((string) $payload['title'], 'xlsx'),
            ],
            'pdf' => [
                'content' => $this->buildPdf($payload, $responsavelEmissao)->generatePdfContent(),
                'contentType' => 'application/pdf',
                'fileName' => $this->buildExportFileName((string) $payload['title'], 'pdf'),
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

    /**
     * @param array<string, mixed> $payload
     */
    public function streamCsv(array $payload): StreamedResponse
    {
        return response()->streamDownload(
            function () use ($payload) {
                $handle = fopen('php://output', 'w');

                if ($handle === false) {
                    abort(500, 'Não foi possível preparar o arquivo CSV.');
                }

                fwrite($handle, chr(239) . chr(187) . chr(191));
                fputcsv(
                    $handle,
                    array_map(fn (array $column) => $column['label'], $payload['columns']),
                    self::CSV_DELIMITER
                );

                foreach ($payload['rows'] as $row) {
                    fputcsv(
                        $handle,
                        array_map(
                            fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                            $payload['columns']
                        ),
                        self::CSV_DELIMITER
                    );
                }

                fclose($handle);
            },
            $this->buildExportFileName((string) $payload['title'], 'csv'),
            ['Content-Type' => 'text/csv; charset=UTF-8']
        );
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function buildPdf(array $payload, string $responsavelEmissao): PdfBuilder
    {
        $title = (string) $payload['title'];

        return Pdf::view('pdf.horas-extras.relatorio', [
            'payload' => $payload,
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

    private function sanitizeTextValue(mixed $value): string
    {
        $text = (string) $value;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
