<?php

namespace App\Services\Relatorios;

use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class OrdemServicoRelatorioService
{
    public function buildPayload(array $filters, bool $forExport = false): array
    {
        $tipoRelatorio = $filters['tipo_relatorio'] ?? 'geral';
        $status = $filters['status'] ?? 'todos';
        $tipo = $filters['tipo'] ?? 'todos';
        $prioridade = $filters['prioridade'] ?? 'todas';
        $tecnicoId = $filters['tecnico_id'] ?? 'todos';
        $dataInicio = $filters['data_inicio'] ?? '';
        $dataFim = $filters['data_fim'] ?? '';

        $baseQuery = $this->buildBaseQuery($filters);

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

        $statusCountMap = $this->buildStatusCountMap($baseQuery);
        $resumo = $this->buildResumo($statusCountMap);
        $statusResumo = $this->buildStatusResumo($resumo);
        $produtividadeTecnicos = $this->buildProdutividadeTecnicos($baseQuery);
        $tiposMaisFrequentes = $this->buildTiposMaisFrequentes($baseQuery, $resumo['total']);
        [$reportDefinition, $reportPagination] = $this->buildReportDefinition(
            $tipoRelatorio,
            $baseQuery,
            $filters,
            $statusResumo,
            $produtividadeTecnicos,
            $tiposMaisFrequentes,
            $forExport
        );

        return [
            'tipos' => $tipos,
            'tecnicos' => $tecnicos,
            'resumo' => $resumo,
            'statusResumo' => $statusResumo,
            'produtividadeTecnicos' => $produtividadeTecnicos,
            'tiposMaisFrequentes' => $tiposMaisFrequentes,
            'reportDefinition' => $reportDefinition,
            'reportPagination' => $reportPagination,
            'atividadeRecente' => (clone $baseQuery)
                ->select(['id', 'numero', 'nome_cliente', 'tipo', 'status', 'data_abertura'])
                ->orderByDesc('data_abertura')
                ->limit(5)
                ->get()
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

    private function buildBaseQuery(array $filters): Builder
    {
        $status = $filters['status'] ?? 'todos';
        $tipo = $filters['tipo'] ?? 'todos';
        $prioridade = $filters['prioridade'] ?? 'todas';
        $tecnicoId = $filters['tecnico_id'] ?? 'todos';
        $dataInicio = $filters['data_inicio'] ?? '';
        $dataFim = $filters['data_fim'] ?? '';

        return OrdemServico::query()
            ->when($status !== 'todos', fn (Builder $query) => $query->where('status', $status))
            ->when($tipo !== 'todos', fn (Builder $query) => $query->where('tipo', $tipo))
            ->when($prioridade !== 'todas', fn (Builder $query) => $query->where('prioridade', (int) $prioridade))
            ->when($tecnicoId !== 'todos', fn (Builder $query) => $query->where('tecnico_responsavel_id', $tecnicoId))
            ->when($dataInicio !== '', fn (Builder $query) => $query->whereDate('data_abertura', '>=', $dataInicio))
            ->when($dataFim !== '', fn (Builder $query) => $query->whereDate('data_abertura', '<=', $dataFim));
    }

    private function buildStatusCountMap(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->selectRaw('status, COUNT(*) as quantidade')
            ->groupBy('status')
            ->pluck('quantidade', 'status')
            ->map(fn (mixed $quantidade) => (int) $quantidade)
            ->all();
    }

    private function buildResumo(array $statusCountMap): array
    {
        return [
            'total' => array_sum($statusCountMap),
            'abertas' => $statusCountMap['aberta'] ?? 0,
            'emExecucao' => $statusCountMap['em_execucao'] ?? 0,
            'finalizadas' => $statusCountMap['finalizada'] ?? 0,
            'naoExecutadas' => $statusCountMap['nao_executada'] ?? 0,
            'canceladas' => $statusCountMap['cancelada'] ?? 0,
        ];
    }

    private function buildStatusResumo(array $resumo): array
    {
        return collect([
            ['status' => 'Abertas', 'quantidade' => $resumo['abertas']],
            ['status' => 'Em execucao', 'quantidade' => $resumo['emExecucao']],
            ['status' => 'Finalizadas', 'quantidade' => $resumo['finalizadas']],
            ['status' => 'Nao executadas', 'quantidade' => $resumo['naoExecutadas']],
            ['status' => 'Canceladas', 'quantidade' => $resumo['canceladas']],
        ])->map(fn (array $item) => [
            ...$item,
            'percentual' => $resumo['total'] > 0
                ? (int) round(($item['quantidade'] / $resumo['total']) * 100)
                : 0,
        ])->values()->all();
    }

    private function buildProdutividadeTecnicos(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->whereNotNull('ordem_servicos.tecnico_responsavel_id')
            ->leftJoin('users as tecnicos', 'tecnicos.id', '=', 'ordem_servicos.tecnico_responsavel_id')
            ->selectRaw("
                COALESCE(tecnicos.name, 'Sem responsavel') as tecnico,
                COUNT(*) as aceitas,
                SUM(CASE WHEN ordem_servicos.status = 'em_execucao' THEN 1 ELSE 0 END) as iniciadas,
                SUM(CASE WHEN ordem_servicos.status = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
                SUM(CASE WHEN ordem_servicos.status = 'nao_executada' THEN 1 ELSE 0 END) as naoExecutadas
            ")
            ->groupBy('ordem_servicos.tecnico_responsavel_id', 'tecnicos.name')
            ->orderByDesc('finalizadas')
            ->get()
            ->map(fn (object $row) => [
                'tecnico' => (string) $row->tecnico,
                'aceitas' => (int) $row->aceitas,
                'iniciadas' => (int) $row->iniciadas,
                'finalizadas' => (int) $row->finalizadas,
                'naoExecutadas' => (int) $row->naoExecutadas,
            ])
            ->values()
            ->all();
    }

    private function buildTiposMaisFrequentes(Builder $baseQuery, int $totalOrdens): array
    {
        return (clone $baseQuery)
            ->selectRaw('tipo, COUNT(*) as quantidade')
            ->groupBy('tipo')
            ->orderByDesc('quantidade')
            ->get()
            ->map(fn (object $row) => [
                'tipo' => (string) $row->tipo,
                'quantidade' => (int) $row->quantidade,
                'percentual' => $totalOrdens > 0
                    ? (int) round(((int) $row->quantidade / $totalOrdens) * 100)
                    : 0,
            ])
            ->values()
            ->all();
    }

    private function buildReportDefinition(
        string $tipoRelatorio,
        Builder $baseQuery,
        array $filters,
        array $statusResumo,
        array $produtividadeTecnicos,
        array $tiposMaisFrequentes,
        bool $forExport
    ): array {
        if ($tipoRelatorio === 'status') {
            $rows = collect($statusResumo)->map(fn (array $item) => [
                'status' => $item['status'],
                'quantidade' => (string) $item['quantidade'],
                'percentual' => "{$item['percentual']}%",
            ])->values()->all();

            return [[
                'title' => 'Relatorio por Status',
                'columns' => [
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
                'rows' => $rows,
            ], $this->singlePagePagination(count($rows))];
        }

        if ($tipoRelatorio === 'produtividade') {
            $rows = collect($produtividadeTecnicos)->map(fn (array $item) => [
                'tecnico' => $item['tecnico'],
                'aceitas' => (string) $item['aceitas'],
                'iniciadas' => (string) $item['iniciadas'],
                'finalizadas' => (string) $item['finalizadas'],
                'naoExecutadas' => (string) $item['naoExecutadas'],
            ])->values()->all();

            return [[
                'title' => 'Relatorio de Produtividade dos Tecnicos',
                'columns' => [
                    ['key' => 'tecnico', 'label' => 'Tecnico'],
                    ['key' => 'aceitas', 'label' => 'OS aceitas'],
                    ['key' => 'iniciadas', 'label' => 'OS em execucao'],
                    ['key' => 'finalizadas', 'label' => 'OS finalizadas'],
                    ['key' => 'naoExecutadas', 'label' => 'OS nao executadas'],
                ],
                'rows' => $rows,
            ], $this->singlePagePagination(count($rows))];
        }

        if ($tipoRelatorio === 'tipo') {
            $rows = collect($tiposMaisFrequentes)->map(fn (array $item) => [
                'tipo' => $item['tipo'],
                'quantidade' => (string) $item['quantidade'],
                'percentual' => "{$item['percentual']}%",
            ])->values()->all();

            return [[
                'title' => 'Relatorio por Tipo de Servico',
                'columns' => [
                    ['key' => 'tipo', 'label' => 'Tipo de servico'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
                'rows' => $rows,
            ], $this->singlePagePagination(count($rows))];
        }

        $query = (clone $baseQuery)
            ->with(['tecnicoResponsavel:id,name'])
            ->orderByDesc('data_abertura');

        $title = $tipoRelatorio === 'periodo'
            ? 'Relatorio por Periodo'
            : 'Relatorio Geral de Ordens de Servico';

        $columns = [
            ['key' => 'numero', 'label' => 'Numero da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de servico'],
            ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'abertura', 'label' => 'Data de abertura'],
            ['key' => 'encerramento', 'label' => 'Data de encerramento'],
            ['key' => 'responsavel', 'label' => 'Responsavel tecnico'],
            ['key' => 'observacoes', 'label' => 'Observacoes'],
        ];

        if ($forExport) {
            $ordens = $query->get();
            $rows = $this->mapOrdensToRows($ordens);

            return [[
                'title' => $title,
                'columns' => $columns,
                'rows' => $rows,
            ], $this->singlePagePagination(count($rows))];
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $rows = $this->mapOrdensToRows(collect($paginator->items()));

        return [[
            'title' => $title,
            'columns' => $columns,
            'rows' => $rows,
        ], [
            'page' => $paginator->currentPage(),
            'perPage' => $paginator->perPage(),
            'lastPage' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ]];
    }

    public function describeReport(array $filters): array
    {
        $tipoRelatorio = $filters['tipo_relatorio'] ?? 'geral';

        return match ($tipoRelatorio) {
            'status' => [
                'title' => 'Relatorio por Status',
                'columns' => [
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
            ],
            'produtividade' => [
                'title' => 'Relatorio de Produtividade dos Tecnicos',
                'columns' => [
                    ['key' => 'tecnico', 'label' => 'Tecnico'],
                    ['key' => 'aceitas', 'label' => 'OS aceitas'],
                    ['key' => 'iniciadas', 'label' => 'OS em execucao'],
                    ['key' => 'finalizadas', 'label' => 'OS finalizadas'],
                    ['key' => 'naoExecutadas', 'label' => 'OS nao executadas'],
                ],
            ],
            'tipo' => [
                'title' => 'Relatorio por Tipo de Servico',
                'columns' => [
                    ['key' => 'tipo', 'label' => 'Tipo de servico'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
            ],
            'periodo' => [
                'title' => 'Relatorio por Periodo',
                'columns' => $this->detailedReportColumns(),
            ],
            default => [
                'title' => 'Relatorio Geral de Ordens de Servico',
                'columns' => $this->detailedReportColumns(),
            ],
        };
    }

    public function streamCsvRows(array $filters, callable $emitRow): void
    {
        $tipoRelatorio = $filters['tipo_relatorio'] ?? 'geral';
        $baseQuery = $this->buildBaseQuery($filters);

        if ($tipoRelatorio === 'status') {
            $resumo = $this->buildResumo($this->buildStatusCountMap($baseQuery));

            foreach ($this->buildStatusResumo($resumo) as $item) {
                $emitRow([
                    'status' => $item['status'],
                    'quantidade' => (string) $item['quantidade'],
                    'percentual' => "{$item['percentual']}%",
                ]);
            }

            return;
        }

        if ($tipoRelatorio === 'produtividade') {
            foreach ($this->buildProdutividadeTecnicos($baseQuery) as $item) {
                $emitRow([
                    'tecnico' => $item['tecnico'],
                    'aceitas' => (string) $item['aceitas'],
                    'iniciadas' => (string) $item['iniciadas'],
                    'finalizadas' => (string) $item['finalizadas'],
                    'naoExecutadas' => (string) $item['naoExecutadas'],
                ]);
            }

            return;
        }

        if ($tipoRelatorio === 'tipo') {
            $resumo = $this->buildResumo($this->buildStatusCountMap($baseQuery));

            foreach ($this->buildTiposMaisFrequentes($baseQuery, $resumo['total']) as $item) {
                $emitRow([
                    'tipo' => $item['tipo'],
                    'quantidade' => (string) $item['quantidade'],
                    'percentual' => "{$item['percentual']}%",
                ]);
            }

            return;
        }

        $query = (clone $baseQuery)
            ->leftJoin('users as tecnicos', 'tecnicos.id', '=', 'ordem_servicos.tecnico_responsavel_id')
            ->select([
                'ordem_servicos.numero',
                'ordem_servicos.tipo',
                'ordem_servicos.nome_cliente',
                'ordem_servicos.status',
                'ordem_servicos.prioridade',
                'ordem_servicos.data_abertura',
                'ordem_servicos.data_encerramento',
                'ordem_servicos.motivo_nao_execucao',
                'ordem_servicos.descricao',
                'tecnicos.name as tecnico_nome',
            ])
            ->orderByDesc('ordem_servicos.data_abertura');

        foreach ($query->cursor() as $row) {
            $emitRow([
                'numero' => (string) $row->numero,
                'tipo' => (string) $row->tipo,
                'clienteLocal' => $row->nome_cliente ?: '-',
                'status' => $this->formatStatus((string) $row->status),
                'prioridade' => $this->formatPrioridade((int) $row->prioridade),
                'abertura' => $this->formatDate($row->data_abertura),
                'encerramento' => $this->formatDate($row->data_encerramento),
                'responsavel' => $row->tecnico_nome ?: 'Sem responsavel',
                'observacoes' => $row->motivo_nao_execucao ?: ($row->descricao ?: '-'),
            ]);
        }
    }

    private function mapOrdensToRows(Collection $ordens): array
    {
        return $ordens->map(fn (OrdemServico $ordem) => [
            'numero' => $ordem->numero,
            'tipo' => $ordem->tipo,
            'clienteLocal' => $ordem->nome_cliente ?? '-',
            'status' => $this->formatStatus($ordem->status),
            'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
            'abertura' => $this->formatDate($ordem->data_abertura),
            'encerramento' => $this->formatDate($ordem->data_encerramento),
            'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsavel',
            'observacoes' => $ordem->motivo_nao_execucao ?: ($ordem->descricao ?: '-'),
        ])->values()->all();
    }

    private function singlePagePagination(int $total): array
    {
        return [
            'page' => 1,
            'perPage' => $total === 0 ? 1 : $total,
            'lastPage' => 1,
            'total' => $total,
        ];
    }

    private function buildPeriodoDescricao(string $dataInicio, string $dataFim): string
    {
        if ($dataInicio === '' && $dataFim === '') {
            return 'Todos os periodos';
        }

        if ($dataInicio !== '' && $dataFim !== '') {
            return "{$this->formatDate($dataInicio)} a {$this->formatDate($dataFim)}";
        }

        if ($dataInicio !== '') {
            return "A partir de {$this->formatDate($dataInicio)}";
        }

        return "Ate {$this->formatDate($dataFim)}";
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
            "Tecnico = {$tecnico}",
        ])->join(' | ');
    }

    private function formatStatus(string $status): string
    {
        return match ($status) {
            'em_execucao' => 'Em execucao',
            'nao_executada' => 'Nao executada',
            default => ucfirst($status),
        };
    }

    private function formatPrioridade(int $prioridade): string
    {
        return match ($prioridade) {
            1 => 'Alta',
            2 => 'Media',
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

    private function detailedReportColumns(): array
    {
        return [
            ['key' => 'numero', 'label' => 'Numero da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de servico'],
            ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'abertura', 'label' => 'Data de abertura'],
            ['key' => 'encerramento', 'label' => 'Data de encerramento'],
            ['key' => 'responsavel', 'label' => 'Responsavel tecnico'],
            ['key' => 'observacoes', 'label' => 'Observacoes'],
        ];
    }
}
