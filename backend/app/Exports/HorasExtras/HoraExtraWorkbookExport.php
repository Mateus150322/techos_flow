<?php

namespace App\Exports\HorasExtras;

use App\Exports\Sheets\StyledArraySheetExport;

class HoraExtraWorkbookExport
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
        return [
            new StyledArraySheetExport(
                'Resumo',
                $this->buildResumoRows(),
                titleRows: [1],
                metadataRows: [2, 3],
                sectionRows: [5],
                headerRows: [6],
                columnWidths: [30, 38],
                titleFillColor: '0F4C81',
                headerFillColor: '145A96',
                sectionFillColor: 'DCEAF7',
                metadataFillColor: 'F8FAFC',
                tabColor: '0F4C81',
            ),
            new StyledArraySheetExport(
                'Dados',
                $this->buildDadosRows(),
                titleRows: [1],
                metadataRows: [2, 3],
                headerRows: [5],
                freezePane: 'A6',
                autoFilterRow: 5,
                columnWidths: [30, 20, 18, 14, 14, 14, 16, 16, 18],
                highlightColumns: $this->buildDataSheetHighlightColumns(),
                titleFillColor: '5B21B6',
                headerFillColor: '7C3AED',
                sectionFillColor: 'EDE9FE',
                metadataFillColor: 'F5F3FF',
                tabColor: '7C3AED',
            ),
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildResumoRows(): array
    {
        return [
            ['TechOS Flow', (string) $this->payload['title']],
            ['Data de emissão', (string) $this->payload['data_emissao']],
            ['Período', (string) $this->payload['periodo_descricao']],
            ['', ''],
            ['Resumo geral', ''],
            ['Indicador', 'Valor'],
            ['Total de funcionários', (string) $this->payload['resumo']['total_funcionarios']],
            ['Horas extras 50%', $this->formatarMinutos((int) $this->payload['resumo']['total_horas_extras_50_minutos'])],
            ['Horas extras 100%', $this->formatarMinutos((int) $this->payload['resumo']['total_horas_extras_100_minutos'])],
            ['Total extras', $this->formatarMinutos((int) $this->payload['resumo']['total_extras_minutos'])],
            ['Horas pagas', $this->formatarMinutos((int) $this->payload['resumo']['total_horas_pagas_minutos'])],
            ['Horas convertidas em folga', $this->formatarMinutos((int) $this->payload['resumo']['total_horas_convertidas_folga_minutos'])],
            ['Dias de folga gerados', (string) $this->payload['resumo']['total_dias_folga_gerados']],
            ['Saldo total do banco', $this->formatarMinutos((int) $this->payload['resumo']['saldo_total_banco_minutos'])],
            ['Estimativa financeira', 'R$ ' . number_format((float) $this->payload['resumo']['total_estimado_financeiro'], 2, ',', '.')],
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildDadosRows(): array
    {
        return [
            [(string) $this->payload['title']],
            ['Data de emissão', (string) $this->payload['data_emissao']],
            ['Período', (string) $this->payload['periodo_descricao']],
            [],
            array_map(fn (array $column) => (string) $column['label'], $this->payload['columns']),
            ...array_map(
                fn (array $row) => array_map(
                    fn (array $column) => $this->sanitizeTextValue($row[$column['key']] ?? ''),
                    $this->payload['columns']
                ),
                $this->payload['rows']
            ),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function buildDataSheetHighlightColumns(): array
    {
        $highlightColumns = [];

        foreach ($this->payload['columns'] as $index => $column) {
            $normalized = mb_strtolower((string) ($column['key'] ?? ''));

            $semantic = match ($normalized) {
                'destino_banco', 'destino' => 'banco',
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

    private function formatarMinutos(int $minutos): string
    {
        $horas = intdiv($minutos, 60);
        $resto = $minutos % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }
}
