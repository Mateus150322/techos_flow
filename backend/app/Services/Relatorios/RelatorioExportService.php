<?php

namespace App\Services\Relatorios;

use Illuminate\Support\Str;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RelatorioExportService
{
    private const MAX_XLSX_ROWS = 5000;
    private const MAX_PDF_ROWS = 1000;

    public function export(string $format, array $payload, string $responsavelEmissao): array
    {
        return match ($format) {
            'csv' => [
                'content' => $this->buildCsvContent($payload['reportDefinition']),
                'contentType' => 'text/csv; charset=UTF-8',
                'fileName' => $this->buildExportFileName($payload['reportDefinition']['title'], 'csv'),
            ],
            'xlsx' => [
                'content' => $this->buildXlsxContent($payload),
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
                fputcsv($handle, array_map(fn (array $column) => $column['label'], $columns));

                $emitRows(function (array $row) use ($handle, $columns) {
                    fputcsv(
                        $handle,
                        array_map(
                            fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                            $columns
                        )
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

        return Pdf::view('pdf.relatorios.ordens-servico', [
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

    private function buildCsvContent(array $reportDefinition): string
    {
        $handle = fopen('php://temp', 'r+');

        if ($handle === false) {
            abort(500, 'Não foi possível preparar o arquivo CSV.');
        }

        fwrite($handle, chr(239) . chr(187) . chr(191));
        fputcsv($handle, array_map(fn (array $column) => $column['label'], $reportDefinition['columns']));

        foreach ($reportDefinition['rows'] as $row) {
            fputcsv(
                $handle,
                array_map(
                    fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $reportDefinition['columns']
                )
            );
        }

        rewind($handle);
        $content = stream_get_contents($handle) ?: '';
        fclose($handle);

        return $content;
    }

    private function buildXlsxContent(array $payload): string
    {
        $resumoRows = [
            ['TechOS Flow', $payload['reportDefinition']['title']],
            ['Data de emissão', $payload['dataEmissao']],
            ['Período', $payload['periodoDescricao']],
            ['Filtros aplicados', $payload['filtrosDescricao']],
            ['', ''],
            ['Resumo geral', ''],
            ['Indicador', 'Quantidade'],
            ['Total de OS', (string) $payload['resumo']['total']],
            ['Abertas', (string) $payload['resumo']['abertas']],
            ['Em execução', (string) $payload['resumo']['emExecucao']],
            ['Finalizadas', (string) $payload['resumo']['finalizadas']],
            ['Não executadas', (string) $payload['resumo']['naoExecutadas']],
            ['Canceladas', (string) $payload['resumo']['canceladas']],
        ];

        $dadosRows = [
            [$payload['reportDefinition']['title']],
            ['Data de emissão', $payload['dataEmissao']],
            ['Período', $payload['periodoDescricao']],
            ['Filtros aplicados', $payload['filtrosDescricao']],
            [],
            array_map(fn (array $column) => $column['label'], $payload['reportDefinition']['columns']),
            ...array_map(
                fn (array $row) => array_map(
                    fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $payload['reportDefinition']['columns']
                ),
                $payload['reportDefinition']['rows']
            ),
        ];

        $produtividadeRows = [
            ['Produtividade dos técnicos'],
            ['Técnico', 'OS aceitas', 'OS em execução', 'OS finalizadas', 'OS não executadas'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['tecnico'] ?? ''),
                    (string) ($item['aceitas'] ?? 0),
                    (string) ($item['iniciadas'] ?? 0),
                    (string) ($item['finalizadas'] ?? 0),
                    (string) ($item['naoExecutadas'] ?? 0),
                ],
                $payload['produtividadeTecnicos']
            ),
        ];

        $analisesRows = [
            ['Análises consolidadas'],
            ['Resumo por status'],
            ['Status', 'Quantidade', 'Percentual'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['status'] ?? ''),
                    (string) ($item['quantidade'] ?? 0),
                    (string) ($item['percentual'] ?? 0) . '%',
                ],
                $payload['statusResumo']
            ),
            [],
            ['Tipos de serviço'],
            ['Tipo', 'Quantidade', 'Percentual'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['tipo'] ?? ''),
                    (string) ($item['quantidade'] ?? 0),
                    (string) ($item['percentual'] ?? 0) . '%',
                ],
                $payload['tiposMaisFrequentes']
            ),
        ];

        return $this->buildZipArchive([
            '[Content_Types].xml' => $this->buildXlsxContentTypesXml(),
            '_rels/.rels' => $this->buildXlsxRootRelationshipsXml(),
            'xl/workbook.xml' => $this->buildXlsxWorkbookXml(),
            'xl/_rels/workbook.xml.rels' => $this->buildXlsxWorkbookRelationshipsXml(),
            'xl/styles.xml' => $this->buildXlsxStylesXml(),
            'xl/worksheets/sheet1.xml' => $this->buildWorksheetXml(
                $resumoRows,
                [0 => 1, 5 => 1, 6 => 2],
                [28, 42]
            ),
            'xl/worksheets/sheet2.xml' => $this->buildWorksheetXml(
                $dadosRows,
                [0 => 1, 5 => 2],
                [18, 22, 28, 16, 12, 16, 18, 22, 36]
            ),
            'xl/worksheets/sheet3.xml' => $this->buildWorksheetXml(
                $produtividadeRows,
                [0 => 1, 1 => 2],
                [26, 14, 16, 16, 18]
            ),
            'xl/worksheets/sheet4.xml' => $this->buildWorksheetXml(
                $analisesRows,
                [0 => 1, 1 => 1, 2 => 2, 8 => 1, 9 => 2],
                [26, 14, 14]
            ),
        ]);
    }

    private function buildXlsxContentTypesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
XML;
    }

    private function buildXlsxRootRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;
    }

    private function buildXlsxWorkbookXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Resumo" sheetId="1" r:id="rId1"/>
    <sheet name="Dados" sheetId="2" r:id="rId2"/>
    <sheet name="Produtividade" sheetId="3" r:id="rId3"/>
    <sheet name="Analises" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>
XML;
    }

    private function buildXlsxWorkbookRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
XML;
    }

    private function buildXlsxStylesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><name val="Calibri"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>
XML;
    }

    private function buildWorksheetXml(
        array $rows,
        array $rowStyles = [],
        array $columnWidths = []
    ): string {
        $maxColumns = max([1, ...array_map(fn (array $row) => count($row), $rows)]);
        $dimension = 'A1:' . $this->excelColumnName($maxColumns) . max(count($rows), 1);
        $colsXml = $this->buildWorksheetColsXml($columnWidths);

        $xmlRows = collect($rows)
            ->map(function (array $row, int $rowIndex) use ($rowStyles) {
                $cells = collect($row)
                    ->map(function (mixed $value, int $columnIndex) use ($rowIndex, $rowStyles) {
                        $coordinate = $this->excelColumnName($columnIndex + 1) . ($rowIndex + 1);
                        $style = $rowStyles[$rowIndex] ?? 0;
                        $styleIndex = $style > 0 ? " s=\"{$style}\"" : '';
                        $cellValue = htmlspecialchars(
                            $this->sanitizeSpreadsheetValue($value),
                            ENT_XML1 | ENT_COMPAT,
                            'UTF-8'
                        );

                        return "<c r=\"{$coordinate}\" t=\"inlineStr\"{$styleIndex}><is><t>{$cellValue}</t></is></c>";
                    })
                    ->implode('');

                return '<row r="' . ($rowIndex + 1) . '">' . $cells . '</row>';
            })
            ->implode('');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="{$dimension}"/>
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  {$colsXml}
  <sheetData>
    {$xmlRows}
  </sheetData>
</worksheet>
XML;
    }

    private function excelColumnName(int $index): string
    {
        $name = '';

        while ($index > 0) {
            $index--;
            $name = chr(65 + ($index % 26)) . $name;
            $index = intdiv($index, 26);
        }

        return $name;
    }

    private function buildWorksheetColsXml(array $columnWidths): string
    {
        if ($columnWidths === []) {
            return '';
        }

        $cols = collect($columnWidths)
            ->map(function (mixed $width, int $index) {
                $safeWidth = max((float) $width, 8.0);
                $column = $index + 1;

                return "<col min=\"{$column}\" max=\"{$column}\" width=\"{$safeWidth}\" customWidth=\"1\"/>";
            })
            ->implode('');

        return "<cols>{$cols}</cols>";
    }

    private function buildZipArchive(array $entries): string
    {
        $archive = '';
        $centralDirectory = '';
        $offset = 0;
        [$dosTime, $dosDate] = $this->buildZipTimestamp();

        foreach ($entries as $fileName => $contents) {
            $fileName = str_replace('\\', '/', $fileName);
            $data = (string) $contents;
            $crc = (int) sprintf('%u', crc32($data));
            $size = strlen($data);
            $nameLength = strlen($fileName);

            $localHeader = pack(
                'VvvvvvVVVvv',
                0x04034b50,
                20,
                0,
                0,
                $dosTime,
                $dosDate,
                $crc,
                $size,
                $size,
                $nameLength,
                0
            ) . $fileName;

            $archive .= $localHeader . $data;

            $centralDirectory .= pack(
                'VvvvvvvVVVvvvvv',
                0x02014b50,
                20,
                20,
                0,
                0,
                $dosTime,
                $dosDate,
                $crc,
                $size,
                $size,
                $nameLength,
                0,
                0,
                0,
                0
            ) . pack('VV', 0, $offset) . $fileName;

            $offset += strlen($localHeader) + $size;
        }

        $endOfCentralDirectory = pack(
            'VvvvvVVv',
            0x06054b50,
            0,
            0,
            count($entries),
            count($entries),
            strlen($centralDirectory),
            strlen($archive),
            0
        );

        return $archive . $centralDirectory . $endOfCentralDirectory;
    }

    private function buildZipTimestamp(): array
    {
        $now = getdate();
        $year = max($now['year'], 1980);
        $dosTime = ($now['hours'] << 11) | ($now['minutes'] << 5) | intdiv($now['seconds'], 2);
        $dosDate = (($year - 1980) << 9) | ($now['mon'] << 5) | $now['mday'];

        return [$dosTime, $dosDate];
    }

    private function sanitizeTextValue(mixed $value): string
    {
        $text = (string) $value;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    private function sanitizeSpreadsheetValue(mixed $value): string
    {
        $text = $this->sanitizeTextValue($value);

        return preg_replace('/[^\P{C}\t\n\r]/u', '', $text) ?? $text;
    }
}
