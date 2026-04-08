<?php

namespace App\Services\Relatorios;

use Illuminate\Support\Str;
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
                'content' => $this->buildPdfContent($payload, $responsavelEmissao),
                'contentType' => 'application/pdf',
                'fileName' => $this->buildExportFileName($payload['reportDefinition']['title'], 'pdf'),
            ],
            default => abort(404),
        };
    }

    public function ensureExportWithinLimits(string $format, int $rowCount): void
    {
        if ($format === 'xlsx' && $rowCount > self::MAX_XLSX_ROWS) {
            abort(422, 'Exportacao XLSX limitada a 5000 registros. Use CSV para volumes maiores.');
        }

        if ($format === 'pdf' && $rowCount > self::MAX_PDF_ROWS) {
            abort(422, 'Exportacao PDF limitada a 1000 registros. Use CSV ou XLSX para volumes maiores.');
        }
    }

    public function streamCsv(string $reportTitle, array $columns, callable $emitRows): StreamedResponse
    {
        return response()->streamDownload(
            function () use ($columns, $emitRows) {
                $handle = fopen('php://output', 'w');

                if ($handle === false) {
                    abort(500, 'Nao foi possivel preparar o arquivo CSV.');
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

    private function buildPdfContent(array $payload, string $responsavelEmissao): string
    {
        $summaryLines = [
            'Resumo',
            sprintf(
                'Total: %d | Abertas: %d | Em execução: %d',
                $payload['resumo']['total'],
                $payload['resumo']['abertas'],
                $payload['resumo']['emExecucao']
            ),
            sprintf(
                'Finalizadas: %d | Não executadas: %d | Canceladas: %d',
                $payload['resumo']['finalizadas'],
                $payload['resumo']['naoExecutadas'],
                $payload['resumo']['canceladas']
            ),
        ];
        $observacoesFinais = [
            'Relatório gerado automaticamente pelo TechOS Flow para apoio gerencial.',
            'Os dados apresentados refletem os filtros aplicados e o estado atual das ordens de serviço.',
            'Para fins de auditoria interna, recomenda-se anexar este documento ao processo administrativo correspondente.',
        ];

        $tableLines = $this->buildPdfTableLines($payload['reportDefinition']);
        $pages = [];
        $pageNumber = 1;
        [$content, $cursorY] = $this->startPdfPage(
            $payload['reportDefinition']['title'],
            $payload['dataEmissao'],
            $payload['periodoDescricao'],
            $payload['filtrosDescricao'],
            $summaryLines,
            true,
            $pageNumber
        );

        foreach ($tableLines as $line) {
            if ($cursorY < 52) {
                $pages[] = $content;
                $pageNumber++;
                [$content, $cursorY] = $this->startPdfPage(
                    $payload['reportDefinition']['title'],
                    $payload['dataEmissao'],
                    $payload['periodoDescricao'],
                    $payload['filtrosDescricao'],
                    $summaryLines,
                    false,
                    $pageNumber
                );
            }

            $this->appendPdfLine($content, $cursorY, $line, 'F2', 8, 40, 11);
        }

        if ($cursorY < 170) {
            $pages[] = $content;
            $pageNumber++;
            [$content, $cursorY] = $this->startPdfPage(
                $payload['reportDefinition']['title'],
                $payload['dataEmissao'],
                $payload['periodoDescricao'],
                $payload['filtrosDescricao'],
                $summaryLines,
                false,
                $pageNumber
            );
        }

        $this->appendPdfDivider($content, $cursorY + 4);
        $this->appendPdfLine($content, $cursorY, 'Observações finais', 'F1', 12, 40, 18);

        foreach ($observacoesFinais as $observacao) {
            $this->appendPdfLine($content, $cursorY, $observacao, 'F1', 10, 40, 14);
        }

        $this->appendPdfLine(
            $content,
            $cursorY,
            'Total de registros: ' . count($payload['reportDefinition']['rows']),
            'F1',
            10,
            40,
            16
        );
        $this->appendPdfLine(
            $content,
            $cursorY,
            'Responsável pela emissão: ' . $responsavelEmissao,
            'F1',
            10,
            40,
            16
        );
        $this->appendPdfLine(
            $content,
            $cursorY,
            'Assinatura/validação: ________________________________________________',
            'F1',
            10,
            40,
            18
        );
        $this->appendPdfLine(
            $content,
            $cursorY,
            'Documento destinado ao acompanhamento institucional das ordens de serviço.',
            'F1',
            9,
            40,
            12
        );

        $pages[] = $content;

        return $this->assemblePdfDocument($pages);
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

    private function buildPdfTableLines(array $reportDefinition): array
    {
        if ($reportDefinition['columns'] === []) {
            return ['Nenhum dado encontrado para os filtros aplicados.'];
        }

        $availableChars = 148;
        $separatorSize = (count($reportDefinition['columns']) - 1) * 3;
        $columnBudget = max($availableChars - $separatorSize, count($reportDefinition['columns']) * 6);
        $preferredWidths = [];

        foreach ($reportDefinition['columns'] as $column) {
            $maxLength = strlen($column['label']);

            foreach ($reportDefinition['rows'] as $row) {
                $maxLength = max(
                    $maxLength,
                    strlen($this->sanitizeTextValue($row[$column['key']] ?? ''))
                );
            }

            $preferredWidths[] = min(max($maxLength, 8), $this->columnWidthCap($column['key']));
        }

        $scaledWidths = $this->scaleColumnWidths($preferredWidths, $columnBudget);
        $header = [];

        foreach ($reportDefinition['columns'] as $index => $column) {
            $header[] = $this->padPdfCell($column['label'], $scaledWidths[$index]);
        }

        $lines = [implode(' | ', $header), str_repeat('-', $availableChars)];

        if ($reportDefinition['rows'] === []) {
            $lines[] = 'Nenhum dado encontrado para os filtros aplicados.';

            return $lines;
        }

        foreach ($reportDefinition['rows'] as $row) {
            $wrappedCells = [];
            $maxLines = 1;

            foreach ($reportDefinition['columns'] as $index => $column) {
                $wrappedCells[$index] = $this->wrapPdfCell(
                    $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $scaledWidths[$index]
                );
                $maxLines = max($maxLines, count($wrappedCells[$index]));
            }

            for ($lineIndex = 0; $lineIndex < $maxLines; $lineIndex++) {
                $lineCells = [];

                foreach ($reportDefinition['columns'] as $index => $column) {
                    $lineCells[] = $this->padPdfCell(
                        $wrappedCells[$index][$lineIndex] ?? '',
                        $scaledWidths[$index]
                    );
                }

                $lines[] = implode(' | ', $lineCells);
            }
        }

        return $lines;
    }

    private function columnWidthCap(string $columnKey): int
    {
        return match ($columnKey) {
            'observacoes' => 30,
            'clienteLocal', 'responsavel' => 18,
            'tipo' => 16,
            'status', 'prioridade' => 14,
            default => 12,
        };
    }

    private function scaleColumnWidths(array $preferredWidths, int $budget): array
    {
        $count = count($preferredWidths);

        if ($count === 0) {
            return [];
        }

        $minimumWidths = array_fill(0, $count, 6);
        $sumPreferred = array_sum($preferredWidths);

        if ($sumPreferred <= $budget) {
            return $preferredWidths;
        }

        $remainingBudget = $budget - array_sum($minimumWidths);
        $extraPreferred = array_map(
            fn (int $width, int $index) => max($width - $minimumWidths[$index], 0),
            $preferredWidths,
            array_keys($preferredWidths)
        );
        $extraTotal = max(array_sum($extraPreferred), 1);
        $scaled = $minimumWidths;
        $fractions = [];
        $allocated = array_sum($minimumWidths);

        foreach ($preferredWidths as $index => $width) {
            $portion = ($extraPreferred[$index] / $extraTotal) * $remainingBudget;
            $whole = (int) floor($portion);
            $scaled[$index] += $whole;
            $fractions[$index] = $portion - $whole;
            $allocated += $whole;
        }

        $leftover = $budget - $allocated;

        arsort($fractions);

        foreach (array_keys($fractions) as $index) {
            if ($leftover <= 0) {
                break;
            }

            $scaled[$index]++;
            $leftover--;
        }

        return $scaled;
    }

    private function wrapPdfCell(string $text, int $width): array
    {
        $clean = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);

        if ($clean === '') {
            return [''];
        }

        $words = preg_split('/\s+/u', $clean) ?: [];
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            if (strlen($word) > $width) {
                if ($current !== '') {
                    $lines[] = $current;
                    $current = '';
                }

                foreach (str_split($word, $width) as $part) {
                    $lines[] = $part;
                }

                continue;
            }

            $candidate = $current === '' ? $word : "{$current} {$word}";

            if (strlen($candidate) <= $width) {
                $current = $candidate;
                continue;
            }

            $lines[] = $current;
            $current = $word;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines === [] ? [''] : $lines;
    }

    private function padPdfCell(string $text, int $width): string
    {
        $trimmed = substr($text, 0, $width);

        return str_pad($trimmed, $width);
    }

    private function startPdfPage(
        string $title,
        string $dataEmissao,
        string $periodoDescricao,
        string $filtrosDescricao,
        array $summaryLines,
        bool $firstPage,
        int $pageNumber
    ): array {
        $content = '';
        $cursorY = 560.0;

        $this->appendPdfLine($content, $cursorY, 'TechOS Flow', 'F1', 18, 40, 24);
        $this->appendPdfLine($content, $cursorY, 'Relatório administrativo institucional', 'F1', 10, 40, 14);
        $this->appendPdfLine($content, $cursorY, $title, 'F1', 14, 40, 18);
        $this->appendPdfLine($content, $cursorY, "Data de emissão: {$dataEmissao}", 'F1', 10, 40, 14);
        $this->appendPdfLine($content, $cursorY, "Período: {$periodoDescricao}", 'F1', 10, 40, 14);
        $this->appendPdfLine($content, $cursorY, "Filtros aplicados: {$filtrosDescricao}", 'F1', 10, 40, 14);
        $this->appendPdfDivider($content, $cursorY + 2);
        $this->appendPdfFooter($content, $pageNumber);
        $this->appendPdfLine($content, $cursorY, '', 'F1', 10, 40, 10);

        if ($firstPage) {
            foreach ($summaryLines as $lineIndex => $line) {
                $this->appendPdfLine(
                    $content,
                    $cursorY,
                    $line,
                    'F1',
                    $lineIndex === 0 ? 12 : 10,
                    40,
                    $lineIndex === 0 ? 16 : 14
                );
            }

            $this->appendPdfLine($content, $cursorY, '', 'F1', 10, 40, 10);
            $this->appendPdfLine($content, $cursorY, 'Detalhamento', 'F1', 12, 40, 16);
        } else {
            $this->appendPdfLine($content, $cursorY, 'Detalhamento (continuação)', 'F1', 12, 40, 16);
        }

        $this->appendPdfDivider($content, $cursorY + 2);
        $this->appendPdfLine($content, $cursorY, '', 'F1', 10, 40, 10);

        return [$content, $cursorY];
    }

    private function appendPdfLine(
        string &$content,
        float &$cursorY,
        string $text,
        string $font,
        int $fontSize,
        float $x,
        float $lineHeight
    ): void {
        $content .= sprintf(
            "BT /%s %d Tf 1 0 0 1 %.2F %.2F Tm (%s) Tj ET\n",
            $font,
            $fontSize,
            $x,
            $cursorY,
            $this->escapePdfText($text)
        );
        $cursorY -= $lineHeight;
    }

    private function appendPdfDivider(string &$content, float $y): void
    {
        $content .= sprintf("%.2F w 40 %.2F m 802 %.2F l S\n", 0.7, $y, $y);
    }

    private function appendPdfFooter(string &$content, int $pageNumber): void
    {
        $this->appendPdfDivider($content, 34);
        $content .= sprintf(
            "BT /F1 9 Tf 1 0 0 1 40 20 Tm (%s) Tj ET\n",
            $this->escapePdfText('TechOS Flow | Documento administrativo interno')
        );
        $content .= sprintf(
            "BT /F1 9 Tf 1 0 0 1 690 20 Tm (%s) Tj ET\n",
            $this->escapePdfText("Página {$pageNumber}")
        );
    }

    private function escapePdfText(string $text): string
    {
        $encoded = iconv('UTF-8', 'windows-1252//TRANSLIT//IGNORE', $this->sanitizeTextValue($text));

        if ($encoded === false) {
            $encoded = $this->sanitizeTextValue($text);
        }

        return str_replace(
            ['\\', '(', ')', "\r", "\n"],
            ['\\\\', '\(', '\)', '', ' '],
            $encoded
        );
    }

    private function assemblePdfDocument(array $pageContents): string
    {
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            4 => '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
        ];

        $pageRefs = [];
        $nextObject = 5;

        foreach ($pageContents as $pageContent) {
            $contentObject = $nextObject++;
            $pageObject = $nextObject++;
            $pageRefs[] = "{$pageObject} 0 R";

            $objects[$contentObject] = "<< /Length " . strlen($pageContent) . " >>\nstream\n{$pageContent}endstream";
            $objects[$pageObject] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] '
                . '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> '
                . "/Contents {$contentObject} 0 R >>";
        }

        $objects[2] = '<< /Type /Pages /Count ' . count($pageRefs) . ' /Kids [ ' . implode(' ', $pageRefs) . ' ] >>';

        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[$index] = strlen($pdf);
            $pdf .= "{$index} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $objectCount = max(array_keys($objects));

        $pdf .= "xref\n0 " . ($objectCount + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= $objectCount; $i++) {
            $offset = $offsets[$i] ?? 0;
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer << /Size " . ($objectCount + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
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
