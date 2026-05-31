<?php

namespace App\Services\Spreadsheet;

use App\Exports\Sheets\StyledArraySheetExport;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class SpreadsheetWorkbookBuilder
{
    /**
     * @param array<int, StyledArraySheetExport> $sheetDefinitions
     */
    public function build(array $sheetDefinitions): string
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);
        $spreadsheet->getProperties()
            ->setCreator('TechOS Flow')
            ->setLastModifiedBy('TechOS Flow')
            ->setCompany('TechOS Flow')
            ->setTitle('Exportação de planilha')
            ->setDescription('Planilha gerada pelo TechOS Flow');

        foreach ($sheetDefinitions as $index => $definition) {
            $sheet = new Worksheet($spreadsheet, $definition->title());
            $spreadsheet->addSheet($sheet, $index);
            $this->fillSheet($sheet, $definition);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $writer = new Xlsx($spreadsheet);
        $writer->setPreCalculateFormulas(false);

        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        $spreadsheet->disconnectWorksheets();

        return is_string($content) ? $content : '';
    }

    private function fillSheet(Worksheet $sheet, StyledArraySheetExport $definition): void
    {
        $rows = $definition->rows();
        $maxColumns = $this->maxColumnCount($rows);
        $highestColumn = Coordinate::stringFromColumnIndex($maxColumns);
        $highestRow = max(count($rows), 1);

        if ($definition->tabColor()) {
            $sheet->getTabColor()->setRGB($definition->tabColor());
        }

        $this->addBrandLogo($sheet);

        foreach ($rows as $rowIndex => $row) {
            $excelRow = $rowIndex + 1;

            foreach ($row as $columnIndex => $value) {
                $coordinate = Coordinate::stringFromColumnIndex($columnIndex + 1) . $excelRow;
                $sheet->setCellValueExplicit(
                    $coordinate,
                    $this->sanitizeValue($value),
                    DataType::TYPE_STRING
                );
            }
        }

        $fullRange = "A1:{$highestColumn}{$highestRow}";
        $sheet->getStyle($fullRange)->getAlignment()
            ->setVertical(Alignment::VERTICAL_TOP)
            ->setWrapText(true);
        $sheet->getDefaultRowDimension()->setRowHeight(22);
        $sheet->setShowGridLines(false);

        foreach ($definition->columnWidths() as $index => $width) {
            $column = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->getColumnDimension($column)->setWidth(max((float) $width, 8.0));
        }

        for ($columnIndex = 1; $columnIndex <= $maxColumns; $columnIndex++) {
            $column = Coordinate::stringFromColumnIndex($columnIndex);

            if (!array_key_exists($columnIndex - 1, $definition->columnWidths())) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        foreach ($definition->titleRows() as $rowNumber) {
            $this->prepareTitleRow($sheet, $rowNumber, $maxColumns, $highestColumn);
            $this->applyTitleRowStyle($sheet, $definition, $rowNumber, $highestColumn);
        }

        foreach ($definition->sectionRows() as $rowNumber) {
            $this->applySectionRowStyle($sheet, $definition, $rowNumber, $highestColumn);
        }

        foreach ($definition->headerRows() as $rowNumber) {
            $this->applyHeaderRowStyle($sheet, $definition, $rowNumber, $highestColumn);
        }

        foreach ($definition->metadataRows() as $rowNumber) {
            $this->applyMetadataRowStyle($sheet, $definition, $rowNumber, $highestColumn, $maxColumns);
        }

        $this->applyDataBanding($sheet, $definition, $rows, $highestColumn, $maxColumns);
        $this->applyHighlightColumns($sheet, $definition, $rows);
        $this->applyBorders($sheet, $fullRange);

        if ($definition->freezePane()) {
            $sheet->freezePane($definition->freezePane());
        }

        if ($definition->autoFilterRow()) {
            $row = $definition->autoFilterRow();
            $sheet->setAutoFilter("A{$row}:{$highestColumn}{$row}");
        }
    }

    /**
     * @param array<int, array<int, mixed>> $rows
     */
    private function maxColumnCount(array $rows): int
    {
        $lengths = array_map(
            static fn (array $row): int => count($row),
            $rows
        );

        return max([1, ...$lengths]);
    }

    private function prepareTitleRow(
        Worksheet $sheet,
        int $rowNumber,
        int $maxColumns,
        string $highestColumn
    ): void {
        if ($maxColumns <= 1) {
            return;
        }

        $values = [];

        for ($columnIndex = 1; $columnIndex <= $maxColumns; $columnIndex++) {
            $coordinate = Coordinate::stringFromColumnIndex($columnIndex) . $rowNumber;
            $value = trim((string) $sheet->getCell($coordinate)->getValue());

            if ($value !== '') {
                $values[] = $value;
            }

            if ($columnIndex > 1) {
                $sheet->setCellValueExplicit($coordinate, '', DataType::TYPE_STRING);
            }
        }

        if ($values === []) {
            return;
        }

        $sheet->setCellValueExplicit(
            "A{$rowNumber}",
            implode('  |  ', $values),
            DataType::TYPE_STRING
        );
        $sheet->mergeCells("A{$rowNumber}:{$highestColumn}{$rowNumber}");
    }

    private function applyTitleRowStyle(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        int $rowNumber,
        string $highestColumn
    ): void
    {
        $range = "A{$rowNumber}:{$highestColumn}{$rowNumber}";
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 15,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $definition->titleFillColor()],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'indent' => 3,
            ],
        ]);
        $sheet->getRowDimension($rowNumber)->setRowHeight(32);
    }

    private function applySectionRowStyle(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        int $rowNumber,
        string $highestColumn
    ): void
    {
        $range = "A{$rowNumber}:{$highestColumn}{$rowNumber}";
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 12,
                'color' => ['rgb' => '0F172A'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $definition->sectionFillColor()],
            ],
        ]);
    }

    private function applyHeaderRowStyle(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        int $rowNumber,
        string $highestColumn
    ): void
    {
        $range = "A{$rowNumber}:{$highestColumn}{$rowNumber}";
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $definition->headerFillColor()],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension($rowNumber)->setRowHeight(24);
    }

    private function applyMetadataRowStyle(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        int $rowNumber,
        string $highestColumn,
        int $maxColumns
    ): void {
        $range = "A{$rowNumber}:{$highestColumn}{$rowNumber}";
        $sheet->getStyle($range)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $definition->metadataFillColor()],
            ],
        ]);

        $labelCell = "A{$rowNumber}";
        $sheet->getStyle($labelCell)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '334155'],
            ],
        ]);

        if ($maxColumns > 1) {
            $valueRange = "B{$rowNumber}:{$highestColumn}{$rowNumber}";
            $sheet->getStyle($valueRange)->applyFromArray([
                'font' => [
                    'color' => ['rgb' => '0F172A'],
                ],
            ]);
        }
    }

    /**
     * Aplica zebra striping nos blocos de dados logo abaixo de cada cabeçalho.
     *
     * @param array<int, array<int, mixed>> $rows
     */
    private function applyDataBanding(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        array $rows,
        string $highestColumn,
        int $maxColumns
    ): void {
        $specialRows = array_flip([
            ...$definition->titleRows(),
            ...$definition->sectionRows(),
            ...$definition->headerRows(),
            ...$definition->metadataRows(),
        ]);

        foreach ($definition->headerRows() as $headerRow) {
            $bandIndex = 0;

            for ($rowNumber = $headerRow + 1; $rowNumber <= count($rows); $rowNumber++) {
                if (isset($specialRows[$rowNumber])) {
                    break;
                }

                $rowValues = $rows[$rowNumber - 1] ?? [];

                if ($this->isRowBlank($rowValues)) {
                    break;
                }

                $range = "A{$rowNumber}:{$highestColumn}{$rowNumber}";
                $fill = $bandIndex % 2 === 0 ? 'FFFFFF' : 'F7FAFC';

                $sheet->getStyle($range)->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $fill],
                    ],
                ]);

                if ($maxColumns > 1) {
                    $sheet->getStyle("A{$rowNumber}")->getFont()->setBold(true);
                }

                $bandIndex++;
            }
        }
    }

    /**
     * Destaca valores operacionais importantes como status, prioridade e banco.
     *
     * @param array<int, array<int, mixed>> $rows
     */
    private function applyHighlightColumns(
        Worksheet $sheet,
        StyledArraySheetExport $definition,
        array $rows
    ): void {
        $highlightColumns = $definition->highlightColumns();

        if ($highlightColumns === []) {
            return;
        }

        $specialRows = array_flip([
            ...$definition->titleRows(),
            ...$definition->sectionRows(),
            ...$definition->headerRows(),
            ...$definition->metadataRows(),
        ]);

        foreach ($definition->headerRows() as $headerRow) {
            for ($rowNumber = $headerRow + 1; $rowNumber <= count($rows); $rowNumber++) {
                if (isset($specialRows[$rowNumber])) {
                    break;
                }

                $rowValues = $rows[$rowNumber - 1] ?? [];

                if ($this->isRowBlank($rowValues)) {
                    break;
                }

                foreach ($highlightColumns as $columnIndex => $type) {
                    $coordinate = Coordinate::stringFromColumnIndex($columnIndex) . $rowNumber;
                    $value = (string) $sheet->getCell($coordinate)->getValue();
                    $styles = $this->resolveHighlightStyle($type, $value);

                    if ($styles === null) {
                        continue;
                    }

                    $sheet->getStyle($coordinate)->applyFromArray($styles);
                }
            }
        }
    }

    private function applyBorders(Worksheet $sheet, string $fullRange): void
    {
        $sheet->getStyle($fullRange)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'D7E1EA'],
                ],
            ],
        ]);
    }

    private function addBrandLogo(Worksheet $sheet): void
    {
        $logoPath = dirname(base_path()) . DIRECTORY_SEPARATOR . 'frontend'
            . DIRECTORY_SEPARATOR . 'public'
            . DIRECTORY_SEPARATOR . 'techos-icon.png';

        if (!is_file($logoPath)) {
            return;
        }

        $drawing = new Drawing();
        $drawing->setName('TechOS Flow');
        $drawing->setDescription('Logo do TechOS Flow');
        $drawing->setPath($logoPath, false);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(6);
        $drawing->setOffsetY(4);
        $drawing->setHeight(22);
        $drawing->setWorksheet($sheet);
    }

    /**
     * @param array<int, mixed> $row
     */
    private function isRowBlank(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveHighlightStyle(string $type, string $value): ?array
    {
        $normalized = mb_strtolower(trim($value));

        return match ($type) {
            'status' => $this->matchPalette($normalized, [
                'aberta' => ['E0F2FE', '075985'],
                'em execução' => ['FEF3C7', '92400E'],
                'em execucao' => ['FEF3C7', '92400E'],
                'finalizada' => ['DCFCE7', '166534'],
                'não executada' => ['FEE2E2', 'B91C1C'],
                'nao executada' => ['FEE2E2', 'B91C1C'],
                'cancelada' => ['E5E7EB', '374151'],
            ]),
            'prioridade' => $this->matchPalette($normalized, [
                'alta' => ['FEE2E2', 'B91C1C'],
                'média' => ['FEF3C7', '92400E'],
                'media' => ['FEF3C7', '92400E'],
                'baixa' => ['DBEAFE', '1D4ED8'],
            ]),
            'banco' => $this->matchPalette($normalized, [
                'folga' => ['DCFCE7', '166534'],
                'pagamento' => ['DBEAFE', '1D4ED8'],
            ]),
            default => null,
        };
    }

    /**
     * @param array<string, array{0: string, 1: string}> $palette
     * @return array<string, mixed>|null
     */
    private function matchPalette(string $normalized, array $palette): ?array
    {
        foreach ($palette as $needle => [$fill, $font]) {
            if (str_contains($normalized, $needle)) {
                return [
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $fill],
                    ],
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => $font],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ];
            }
        }

        return null;
    }

    private function sanitizeValue(mixed $value): string
    {
        $text = (string) $value;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
