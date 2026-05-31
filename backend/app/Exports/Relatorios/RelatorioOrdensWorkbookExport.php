<?php

namespace App\Exports\Relatorios;

use App\Exports\Sheets\StyledArraySheetExport;

class RelatorioOrdensWorkbookExport
{
    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(
        private readonly array $payload
    ) {
    }

    public function sheets(): array
    {
        $isOperationalReport = $this->isOperationalReport();
        $resumoRows = $this->buildResumoRows($isOperationalReport);
        $dadosRows = $this->buildDadosRows();
        $produtividadeRows = $this->buildProdutividadeRows();
        $analisesRows = $this->buildAnalisesRows($isOperationalReport);
        [$analisesSectionRows, $analisesHeaderRows] = $this->buildAnalisesRowStyles($isOperationalReport);

        $resumoSectionRows = [6];
        $resumoHeaderRows = [7];

        if ($isOperationalReport) {
            $resumoSectionRows[] = 15;
            $resumoHeaderRows[] = 16;
        }

        return [
            new StyledArraySheetExport(
                'Resumo',
                $resumoRows,
                titleRows: [1],
                metadataRows: [2, 3, 4],
                sectionRows: $resumoSectionRows,
                headerRows: $resumoHeaderRows,
                columnWidths: [30, 44],
                titleFillColor: '0F4C81',
                headerFillColor: '145A96',
                sectionFillColor: 'DCEAF7',
                metadataFillColor: 'F8FAFC',
                tabColor: '0F4C81',
            ),
            new StyledArraySheetExport(
                'Dados',
                $dadosRows,
                titleRows: [1],
                metadataRows: [2, 3, 4],
                headerRows: [6],
                freezePane: 'A7',
                autoFilterRow: 6,
                columnWidths: $this->buildDataSheetWidths(),
                highlightColumns: $this->buildDataSheetHighlightColumns(),
                titleFillColor: '1E3A8A',
                headerFillColor: '2563EB',
                sectionFillColor: 'DBEAFE',
                metadataFillColor: 'EFF6FF',
                tabColor: '2563EB',
            ),
            new StyledArraySheetExport(
                'Produtividade',
                $produtividadeRows,
                titleRows: [1],
                headerRows: [2],
                freezePane: 'A3',
                autoFilterRow: 2,
                columnWidths: [28, 14, 16, 16, 18],
                titleFillColor: '166534',
                headerFillColor: '15803D',
                sectionFillColor: 'DCFCE7',
                metadataFillColor: 'F0FDF4',
                tabColor: '15803D',
            ),
            new StyledArraySheetExport(
                'Análises',
                $analisesRows,
                titleRows: [1],
                sectionRows: $analisesSectionRows,
                headerRows: $analisesHeaderRows,
                columnWidths: [28, 18, 18, 20, 20, 34],
                titleFillColor: '9A3412',
                headerFillColor: 'C2410C',
                sectionFillColor: 'FFEDD5',
                metadataFillColor: 'FFF7ED',
                tabColor: 'C2410C',
            ),
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildResumoRows(bool $isOperationalReport): array
    {
        $resumoOperacional = $this->payload['resumoOperacional'] ?? [
            'filaAtiva' => 0,
            'semResponsavel' => 0,
            'criticasAtivas' => 0,
            'abertas48h' => 0,
            'execucao24h' => 0,
            'fotosAnexadas' => 0,
            'horasExtrasFormatadas' => '0h00',
        ];

        $rows = [
            ['TechOS Flow', (string) $this->payload['reportDefinition']['title']],
            ['Data de emissão', (string) $this->payload['dataEmissao']],
            ['Período', (string) $this->payload['periodoDescricao']],
            ['Filtros aplicados', (string) $this->payload['filtrosDescricao']],
            ['', ''],
            ['Resumo geral', ''],
            ['Indicador', 'Quantidade'],
            ['Total de OS', (string) $this->payload['resumo']['total']],
            ['Abertas', (string) $this->payload['resumo']['abertas']],
            ['Em execução', (string) $this->payload['resumo']['emExecucao']],
            ['Finalizadas', (string) $this->payload['resumo']['finalizadas']],
            ['Não executadas', (string) $this->payload['resumo']['naoExecutadas']],
            ['Canceladas', (string) $this->payload['resumo']['canceladas']],
        ];

        if (!$isOperationalReport) {
            return $rows;
        }

        return [
            ...$rows,
            ['', ''],
            ['Resumo operacional', ''],
            ['Indicador', 'Quantidade'],
            ['Fila ativa', (string) $resumoOperacional['filaAtiva']],
            ['Sem responsável', (string) $resumoOperacional['semResponsavel']],
            ['Críticas ativas', (string) $resumoOperacional['criticasAtivas']],
            ['Abertas há mais de 48h', (string) $resumoOperacional['abertas48h']],
            ['Em execução há mais de 24h', (string) $resumoOperacional['execucao24h']],
            ['Fotos anexadas', (string) $resumoOperacional['fotosAnexadas']],
            ['Horas extras', (string) $resumoOperacional['horasExtrasFormatadas']],
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildDadosRows(): array
    {
        $columns = $this->payload['reportDefinition']['columns'];
        $rows = $this->payload['reportDefinition']['rows'];

        return [
            [(string) $this->payload['reportDefinition']['title']],
            ['Data de emissão', (string) $this->payload['dataEmissao']],
            ['Período', (string) $this->payload['periodoDescricao']],
            ['Filtros aplicados', (string) $this->payload['filtrosDescricao']],
            [],
            array_map(fn (array $column) => (string) $column['label'], $columns),
            ...array_map(
                fn (array $row) => array_map(
                    fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $columns
                ),
                $rows
            ),
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildProdutividadeRows(): array
    {
        return [
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
                $this->payload['produtividadeTecnicos']
            ),
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildAnalisesRows(bool $isOperationalReport): array
    {
        $rows = [
            ['Análises consolidadas'],
            ['Resumo por status'],
            ['Status', 'Quantidade', 'Percentual'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['status'] ?? ''),
                    (string) ($item['quantidade'] ?? 0),
                    (string) ($item['percentual'] ?? 0) . '%',
                ],
                $this->payload['statusResumo']
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
                $this->payload['tiposMaisFrequentes']
            ),
        ];

        if (!$isOperationalReport) {
            return $rows;
        }

        return [
            ...$rows,
            [],
            ['Fila operacional priorizada'],
            ['Número', 'Status', 'Prioridade', 'Responsável', 'Tempo', 'Resumo'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['numero'] ?? ''),
                    $this->sanitizeTextValue($item['status'] ?? ''),
                    $this->sanitizeTextValue($item['prioridade'] ?? ''),
                    $this->sanitizeTextValue($item['responsavel'] ?? ''),
                    $this->sanitizeTextValue($item['idadeDescricao'] ?? ''),
                    $this->sanitizeTextValue($item['contexto'] ?? ''),
                ],
                $this->payload['filaOperacional'] ?? []
            ),
            [],
            ['Carga ativa por técnico'],
            ['Técnico', 'Abertas', 'Em execução', 'Críticas', 'Total ativas'],
            ...array_map(
                fn (array $item) => [
                    $this->sanitizeTextValue($item['tecnico'] ?? ''),
                    (string) ($item['abertas'] ?? 0),
                    (string) ($item['emExecucao'] ?? 0),
                    (string) ($item['criticas'] ?? 0),
                    (string) ($item['totalAtivas'] ?? 0),
                ],
                $this->payload['cargaTecnicos'] ?? []
            ),
        ];
    }

    /**
     * @return array{0: array<int, int>, 1: array<int, int>}
     */
    private function buildAnalisesRowStyles(bool $isOperationalReport): array
    {
        $statusCount = count($this->payload['statusResumo']);
        $tiposCount = count($this->payload['tiposMaisFrequentes']);

        $sectionRows = [2, $statusCount + 6];
        $headerRows = [3, $statusCount + 7];

        if (!$isOperationalReport) {
            return [$sectionRows, $headerRows];
        }

        $filaStart = $statusCount + $tiposCount + 9;
        $cargaStart = $filaStart + count($this->payload['filaOperacional'] ?? []) + 3;

        $sectionRows[] = $filaStart;
        $headerRows[] = $filaStart + 1;
        $sectionRows[] = $cargaStart;
        $headerRows[] = $cargaStart + 1;

        return [$sectionRows, $headerRows];
    }

    private function isOperationalReport(): bool
    {
        return ($this->payload['reportDefinition']['columns'][2]['key'] ?? null) === 'local';
    }

    /**
     * @return array<int, int|float>
     */
    private function buildDataSheetWidths(): array
    {
        $widthMap = [
            'numero' => 18,
            'tipo' => 24,
            'clienteLocal' => 30,
            'local' => 26,
            'origem' => 24,
            'status' => 16,
            'prioridade' => 14,
            'abertura' => 18,
            'encerramento' => 18,
            'servico' => 30,
            'equipamento' => 24,
            'responsavel' => 22,
            'idade' => 16,
            'contexto' => 40,
            'observacoes' => 40,
        ];

        return array_map(
            fn (array $column) => $widthMap[$column['key']] ?? 18,
            $this->payload['reportDefinition']['columns']
        );
    }

    /**
     * @return array<int, string>
     */
    private function buildDataSheetHighlightColumns(): array
    {
        $highlightColumns = [];

        foreach ($this->payload['reportDefinition']['columns'] as $index => $column) {
            $semantic = match ($column['key']) {
                'status' => 'status',
                'prioridade' => 'prioridade',
                default => null,
            };

            if ($semantic !== null) {
                $highlightColumns[$index + 1] = $semantic;
            }
        }

        return $highlightColumns;
    }

    private function sanitizeTextValue(mixed $value): string
    {
        $text = (string) $value;
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
