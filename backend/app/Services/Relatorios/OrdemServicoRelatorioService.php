<?php

namespace App\Services\Relatorios;

use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Support\Collection;

class OrdemServicoRelatorioService
{
    public function buildPayload(array $filters): array
    {
        $tipoRelatorio = $filters['tipo_relatorio'] ?? 'geral';
        $status = $filters['status'] ?? 'todos';
        $tipo = $filters['tipo'] ?? 'todos';
        $prioridade = $filters['prioridade'] ?? 'todas';
        $tecnicoId = $filters['tecnico_id'] ?? 'todos';
        $dataInicio = $filters['data_inicio'] ?? '';
        $dataFim = $filters['data_fim'] ?? '';

        $ordensFiltradas = OrdemServico::query()
            ->with(['tecnicoResponsavel:id,name'])
            ->when($status !== 'todos', fn ($query) => $query->where('status', $status))
            ->when($tipo !== 'todos', fn ($query) => $query->where('tipo', $tipo))
            ->when($prioridade !== 'todas', fn ($query) => $query->where('prioridade', (int) $prioridade))
            ->when($tecnicoId !== 'todos', fn ($query) => $query->where('tecnico_responsavel_id', $tecnicoId))
            ->when($dataInicio !== '', fn ($query) => $query->whereDate('data_abertura', '>=', $dataInicio))
            ->when($dataFim !== '', fn ($query) => $query->whereDate('data_abertura', '<=', $dataFim))
            ->orderByDesc('data_abertura')
            ->get();

        $tipos = OrdemServico::query()
            ->whereNotNull('tipo')
            ->orderBy('tipo')
            ->pluck('tipo')
            ->filter()
            ->unique()
            ->values();

        $tecnicos = User::query()
            ->where('role', 'tecnico')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])
            ->values();

        $resumo = $this->buildResumo($ordensFiltradas);
        $statusResumo = $this->buildStatusResumo($resumo);
        $produtividadeTecnicos = $this->buildProdutividadeTecnicos($ordensFiltradas);
        $tiposMaisFrequentes = $this->buildTiposMaisFrequentes($ordensFiltradas, $resumo['total']);

        return [
            'tipos' => $tipos,
            'tecnicos' => $tecnicos,
            'resumo' => $resumo,
            'statusResumo' => $statusResumo,
            'produtividadeTecnicos' => $produtividadeTecnicos,
            'tiposMaisFrequentes' => $tiposMaisFrequentes,
            'reportDefinition' => $this->buildReportDefinition(
                $tipoRelatorio,
                $ordensFiltradas,
                $statusResumo,
                $produtividadeTecnicos,
                $tiposMaisFrequentes
            ),
            'atividadeRecente' => $ordensFiltradas
                ->take(5)
                ->map(fn (OrdemServico $ordem) => [
                    'id' => $ordem->id,
                    'numero' => $ordem->numero,
                    'nome_cliente' => $ordem->nome_cliente,
                    'tipo' => $ordem->tipo,
                    'status' => $ordem->status,
                    'data_abertura' => $ordem->data_abertura,
                ])
                ->values(),
            'periodoDescricao' => $this->buildPeriodoDescricao($dataInicio, $dataFim),
            'filtrosDescricao' => $this->buildFiltrosDescricao(
                $status,
                $tipo,
                $prioridade,
                $tecnicoId,
                $tecnicos
            ),
            'dataEmissao' => now()->format('d/m/Y'),
        ];
    }

    private function buildResumo(Collection $ordens): array
    {
        return [
            'total' => $ordens->count(),
            'abertas' => $ordens->where('status', 'aberta')->count(),
            'emExecucao' => $ordens->where('status', 'em_execucao')->count(),
            'finalizadas' => $ordens->where('status', 'finalizada')->count(),
            'naoExecutadas' => $ordens->where('status', 'nao_executada')->count(),
            'canceladas' => $ordens->where('status', 'cancelada')->count(),
        ];
    }

    private function buildStatusResumo(array $resumo): array
    {
        return collect([
            ['status' => 'Abertas', 'quantidade' => $resumo['abertas']],
            ['status' => 'Em execução', 'quantidade' => $resumo['emExecucao']],
            ['status' => 'Finalizadas', 'quantidade' => $resumo['finalizadas']],
            ['status' => 'Não executadas', 'quantidade' => $resumo['naoExecutadas']],
            ['status' => 'Canceladas', 'quantidade' => $resumo['canceladas']],
        ])->map(fn (array $item) => [
            ...$item,
            'percentual' => $resumo['total'] > 0
                ? (int) round(($item['quantidade'] / $resumo['total']) * 100)
                : 0,
        ])->values()->all();
    }

    private function buildProdutividadeTecnicos(Collection $ordens): array
    {
        return $ordens
            ->filter(fn (OrdemServico $ordem) => filled($ordem->tecnico_responsavel_id))
            ->groupBy('tecnico_responsavel_id')
            ->map(function (Collection $items) {
                /** @var OrdemServico $primeira */
                $primeira = $items->first();

                return [
                    'tecnico' => $primeira->tecnicoResponsavel?->name ?? 'Sem responsável',
                    'aceitas' => $items->count(),
                    'iniciadas' => $items->where('status', 'em_execucao')->count(),
                    'finalizadas' => $items->where('status', 'finalizada')->count(),
                    'naoExecutadas' => $items->where('status', 'nao_executada')->count(),
                ];
            })
            ->sortByDesc('finalizadas')
            ->values()
            ->all();
    }

    private function buildTiposMaisFrequentes(Collection $ordens, int $totalOrdens): array
    {
        return $ordens
            ->groupBy('tipo')
            ->map(fn (Collection $items, string $tipo) => [
                'tipo' => $tipo,
                'quantidade' => $items->count(),
                'percentual' => $totalOrdens > 0
                    ? (int) round(($items->count() / $totalOrdens) * 100)
                    : 0,
            ])
            ->sortByDesc('quantidade')
            ->values()
            ->all();
    }

    private function buildReportDefinition(
        string $tipoRelatorio,
        Collection $ordens,
        array $statusResumo,
        array $produtividadeTecnicos,
        array $tiposMaisFrequentes
    ): array {
        if ($tipoRelatorio === 'status') {
            return [
                'title' => 'Relatório por Status',
                'columns' => [
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
                'rows' => collect($statusResumo)->map(fn (array $item) => [
                    'status' => $item['status'],
                    'quantidade' => (string) $item['quantidade'],
                    'percentual' => "{$item['percentual']}%",
                ])->values()->all(),
            ];
        }

        if ($tipoRelatorio === 'produtividade') {
            return [
                'title' => 'Relatório de Produtividade dos Técnicos',
                'columns' => [
                    ['key' => 'tecnico', 'label' => 'Técnico'],
                    ['key' => 'aceitas', 'label' => 'OS aceitas'],
                    ['key' => 'iniciadas', 'label' => 'OS em execução'],
                    ['key' => 'finalizadas', 'label' => 'OS finalizadas'],
                    ['key' => 'naoExecutadas', 'label' => 'OS não executadas'],
                ],
                'rows' => collect($produtividadeTecnicos)->map(fn (array $item) => [
                    'tecnico' => $item['tecnico'],
                    'aceitas' => (string) $item['aceitas'],
                    'iniciadas' => (string) $item['iniciadas'],
                    'finalizadas' => (string) $item['finalizadas'],
                    'naoExecutadas' => (string) $item['naoExecutadas'],
                ])->values()->all(),
            ];
        }

        if ($tipoRelatorio === 'tipo') {
            return [
                'title' => 'Relatório por Tipo de Serviço',
                'columns' => [
                    ['key' => 'tipo', 'label' => 'Tipo de serviço'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
                'rows' => collect($tiposMaisFrequentes)->map(fn (array $item) => [
                    'tipo' => $item['tipo'],
                    'quantidade' => (string) $item['quantidade'],
                    'percentual' => "{$item['percentual']}%",
                ])->values()->all(),
            ];
        }

        return [
            'title' => $tipoRelatorio === 'periodo'
                ? 'Relatório por Período'
                : 'Relatório Geral de Ordens de Serviço',
            'columns' => [
                ['key' => 'numero', 'label' => 'Número da OS'],
                ['key' => 'tipo', 'label' => 'Tipo de serviço'],
                ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'prioridade', 'label' => 'Prioridade'],
                ['key' => 'abertura', 'label' => 'Data de abertura'],
                ['key' => 'encerramento', 'label' => 'Data de encerramento'],
                ['key' => 'responsavel', 'label' => 'Responsável técnico'],
                ['key' => 'observacoes', 'label' => 'Observações'],
            ],
            'rows' => $ordens->map(fn (OrdemServico $ordem) => [
                'numero' => $ordem->numero,
                'tipo' => $ordem->tipo,
                'clienteLocal' => $ordem->nome_cliente ?? '-',
                'status' => $this->formatStatus($ordem->status),
                'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
                'abertura' => $this->formatDate($ordem->data_abertura),
                'encerramento' => $this->formatDate($ordem->data_encerramento),
                'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
                'observacoes' => $ordem->motivo_nao_execucao ?: ($ordem->descricao ?: '-'),
            ])->values()->all(),
        ];
    }

    private function buildPeriodoDescricao(string $dataInicio, string $dataFim): string
    {
        if ($dataInicio === '' && $dataFim === '') {
            return 'Todos os períodos';
        }

        if ($dataInicio !== '' && $dataFim !== '') {
            return "{$this->formatDate($dataInicio)} a {$this->formatDate($dataFim)}";
        }

        if ($dataInicio !== '') {
            return "A partir de {$this->formatDate($dataInicio)}";
        }

        return "Até {$this->formatDate($dataFim)}";
    }

    private function buildFiltrosDescricao(
        string $status,
        string $tipo,
        string $prioridade,
        string $tecnicoId,
        Collection $tecnicos
    ): string {
        $tecnicoSelecionado = $tecnicos->firstWhere('id', $tecnicoId);
        $tecnico = is_array($tecnicoSelecionado) ? ($tecnicoSelecionado['name'] ?? 'Todos') : 'Todos';

        return collect([
            'Status = ' . ($status === 'todos' ? 'Todos' : $this->formatStatus($status)),
            'Tipo = ' . ($tipo === 'todos' ? 'Todos' : $tipo),
            'Prioridade = ' . ($prioridade === 'todas' ? 'Todas' : $this->formatPrioridade((int) $prioridade)),
            "Técnico = {$tecnico}",
        ])->join(' | ');
    }

    private function formatStatus(string $status): string
    {
        if ($status === 'em_execucao') {
            return 'Em execução';
        }

        if ($status === 'nao_executada') {
            return 'Não executada';
        }

        return ucfirst($status);
    }

    private function formatPrioridade(int $prioridade): string
    {
        return match ($prioridade) {
            1 => 'Alta',
            2 => 'Média',
            3 => 'Baixa',
            default => (string) $prioridade,
        };
    }

    private function formatDate(mixed $value): string
    {
        if (blank($value)) {
            return '-';
        }

        return date('d/m/Y', strtotime((string) $value));
    }
}
