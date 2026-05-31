<?php

namespace App\Exports\Sheets;

use Illuminate\Support\Str;

class StyledArraySheetExport
{
    /**
     * @param array<int, array<int, mixed>> $rows
     * @param array<int, int> $titleRows
     * @param array<int, int> $metadataRows
     * @param array<int, int> $sectionRows
     * @param array<int, int> $headerRows
     * @param array<int, float|int> $columnWidths
     * @param array<int, string> $highlightColumns
     */
    public function __construct(
        private readonly string $sheetTitle,
        private readonly array $rows,
        private readonly array $titleRows = [],
        private readonly array $metadataRows = [],
        private readonly array $sectionRows = [],
        private readonly array $headerRows = [],
        private readonly ?string $freezePane = null,
        private readonly ?int $autoFilterRow = null,
        private readonly array $columnWidths = [],
        private readonly array $highlightColumns = [],
        private readonly string $titleFillColor = '0F4C81',
        private readonly string $headerFillColor = '145A96',
        private readonly string $sectionFillColor = 'DCEAF7',
        private readonly string $metadataFillColor = 'F8FAFC',
        private readonly ?string $tabColor = null,
    ) {
    }

    public function title(): string
    {
        return Str::of($this->sheetTitle)->substr(0, 31)->toString();
    }

    public function rows(): array
    {
        return $this->rows;
    }

    public function titleRows(): array
    {
        return $this->titleRows;
    }

    public function metadataRows(): array
    {
        return $this->metadataRows;
    }

    public function sectionRows(): array
    {
        return $this->sectionRows;
    }

    public function headerRows(): array
    {
        return $this->headerRows;
    }

    public function freezePane(): ?string
    {
        return $this->freezePane;
    }

    public function autoFilterRow(): ?int
    {
        return $this->autoFilterRow;
    }

    public function columnWidths(): array
    {
        return $this->columnWidths;
    }

    public function highlightColumns(): array
    {
        return $this->highlightColumns;
    }

    public function titleFillColor(): string
    {
        return $this->titleFillColor;
    }

    public function headerFillColor(): string
    {
        return $this->headerFillColor;
    }

    public function sectionFillColor(): string
    {
        return $this->sectionFillColor;
    }

    public function metadataFillColor(): string
    {
        return $this->metadataFillColor;
    }

    public function tabColor(): ?string
    {
        return $this->tabColor;
    }
}
