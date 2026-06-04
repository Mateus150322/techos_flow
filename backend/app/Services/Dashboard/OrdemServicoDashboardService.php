<?php

namespace App\Services\Dashboard;

use App\Models\OrdemServico;
use App\Models\User;
use App\Support\Concerns\UsesCaseInsensitiveLike;
use Illuminate\Database\Eloquent\Builder;

class OrdemServicoDashboardService
{
    use UsesCaseInsensitiveLike;

    public function buildAdminDashboard(): array
    {
        $statusResumo = $this->buildStatusResumo();
        $total = array_sum(array_column($statusResumo, 'quantidade'));
        $abertas = $this->getStatusCount($statusResumo, 'aberta');
        $emExecucao = $this->getStatusCount($statusResumo, 'em_execucao');
        $finalizadas = $this->getStatusCount($statusResumo, 'finalizada');
        $naoExecutadas = $this->getStatusCount($statusResumo, 'nao_executada');
        $canceladas = $this->getStatusCount($statusResumo, 'cancelada');

        return [
            'resumo' => [
                'total' => $total,
                'abertas' => $abertas,
                'em_execucao' => $emExecucao,
                'finalizadas' => $finalizadas,
                'nao_executadas' => $naoExecutadas,
                'canceladas' => $canceladas,
                'pendentes' => $abertas + $emExecucao,
                'tempo_medio_horas' => $this->calculateTempoMedioHoras(),
            ],
            'distribuicao_status' => array_map(
                fn (array $item) => [
                    ...$item,
                    'percentual' => $total > 0 ? (int) round(($item['quantidade'] / $total) * 100) : 0,
                ],
                $statusResumo
            ),
            'tipos_breakdown' => OrdemServico::query()
                ->select('tipo')
                ->selectRaw('COUNT(*) as total')
                ->whereNotNull('tipo')
                ->groupBy('tipo')
                ->orderByDesc('total')
                ->limit(5)
                ->get()
                ->map(fn ($item) => [
                    'tipo' => $item->tipo,
                    'total' => (int) $item->total,
                ])
                ->values()
                ->all(),
            'produtividade_tecnicos' => User::query()
                ->select('users.id', 'users.name')
                ->selectRaw('COUNT(ordem_servicos.id) as atribuidas')
                ->selectRaw("SUM(CASE WHEN ordem_servicos.status = 'finalizada' THEN 1 ELSE 0 END) as finalizadas")
                ->leftJoin('ordem_servicos', 'ordem_servicos.tecnico_responsavel_id', '=', 'users.id')
                ->where('users.role', 'tecnico')
                ->groupBy('users.id', 'users.name')
                ->havingRaw('COUNT(ordem_servicos.id) > 0')
                ->orderByDesc('atribuidas')
                ->limit(4)
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'nome' => $item->name,
                    'atribuidas' => (int) $item->atribuidas,
                    'finalizadas' => (int) $item->finalizadas,
                ])
                ->values()
                ->all(),
            'resumo_mes_atual' => $this->buildResumoMesAtual(),
            'atividade_recente' => $this->baseListQuery()
                ->latest('data_abertura')
                ->limit(5)
                ->get()
                ->values()
                ->all(),
        ];
    }

    public function buildAtendenteDashboard(?string $search = null, int $perSection = 12): array
    {
        $baseQuery = $this->applySearch($this->baseListQuery(), $search);
        $statusCounts = $this->buildStatusCounts(
            $this->applySearch($this->baseMetricsQuery(), $search)
        );

        $abertasQuery = (clone $baseQuery)->where('status', 'aberta');
        $emExecucaoQuery = (clone $baseQuery)->where('status', 'em_execucao');
        $encerradasQuery = (clone $baseQuery)->whereIn('status', ['finalizada', 'nao_executada', 'cancelada']);

        return [
            'resumo' => [
                'total' => $statusCounts['total'],
                'abertas' => $statusCounts['aberta'],
                'em_execucao' => $statusCounts['em_execucao'],
                'encerradas' => $statusCounts['finalizada']
                    + $statusCounts['nao_executada']
                    + $statusCounts['cancelada'],
            ],
            'secoes' => [
                'abertas' => $abertasQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
                'em_execucao' => $emExecucaoQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
                'encerradas' => $encerradasQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
            ],
        ];
    }

    public function buildTecnicoDashboard(User $tecnico, ?string $search = null, int $perSection = 12): array
    {
        $baseQuery = $this->applySearch($this->baseListQuery(), $search);
        $metricsQuery = $this->applySearch($this->baseMetricsQuery(), $search);
        $statusCounts = $this->buildStatusCounts((clone $metricsQuery)->where('tecnico_responsavel_id', $tecnico->id));
        $totalFiltrado = $this->buildStatusCounts($metricsQuery)['total'];

        $disponiveisQuery = (clone $baseQuery)
            ->where('status', 'aberta')
            ->whereNull('tecnico_responsavel_id');
        $minhasQuery = (clone $baseQuery)->where('tecnico_responsavel_id', $tecnico->id);
        $emExecucaoQuery = (clone $minhasQuery)->where('status', 'em_execucao');
        $finalizadasQuery = (clone $minhasQuery)->whereIn('status', ['finalizada', 'nao_executada']);

        return [
            'resumo' => [
                'disponiveis' => (clone $metricsQuery)
                    ->where('status', 'aberta')
                    ->whereNull('tecnico_responsavel_id')
                    ->count(),
                'minhas' => $statusCounts['total'],
                'em_execucao' => $statusCounts['em_execucao'],
                'concluidas' => $statusCounts['finalizada'] + $statusCounts['nao_executada'],
                'total_filtrado' => $totalFiltrado,
            ],
            'secoes' => [
                'disponiveis' => $disponiveisQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
                'minhas' => $minhasQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
                'em_execucao' => $emExecucaoQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
                'finalizadas' => $finalizadasQuery->latest('data_abertura')->limit($perSection)->get()->values()->all(),
            ],
        ];
    }

    private function buildStatusResumo(): array
    {
        $counts = OrdemServico::query()
            ->select('status')
            ->selectRaw('COUNT(*) as quantidade')
            ->groupBy('status')
            ->pluck('quantidade', 'status');

        return [
            ['status' => 'aberta', 'label' => 'Abertas', 'quantidade' => (int) ($counts['aberta'] ?? 0)],
            ['status' => 'em_execucao', 'label' => 'Em execução', 'quantidade' => (int) ($counts['em_execucao'] ?? 0)],
            ['status' => 'finalizada', 'label' => 'Finalizadas', 'quantidade' => (int) ($counts['finalizada'] ?? 0)],
            ['status' => 'nao_executada', 'label' => 'Não executadas', 'quantidade' => (int) ($counts['nao_executada'] ?? 0)],
            ['status' => 'cancelada', 'label' => 'Canceladas', 'quantidade' => (int) ($counts['cancelada'] ?? 0)],
        ];
    }

    private function buildResumoMesAtual(): array
    {
        $inicio = now()->startOfMonth();
        $fim = now()->endOfMonth();

        $resumo = OrdemServico::query()
            ->whereBetween('data_abertura', [$inicio, $fim])
            ->selectRaw("SUM(CASE WHEN status = 'aberta' THEN 1 ELSE 0 END) as abertas")
            ->selectRaw("SUM(CASE WHEN status = 'em_execucao' THEN 1 ELSE 0 END) as em_execucao")
            ->selectRaw("SUM(CASE WHEN status = 'finalizada' THEN 1 ELSE 0 END) as finalizadas")
            ->first();

        return [
            'abertas' => (int) ($resumo->abertas ?? 0),
            'em_execucao' => (int) ($resumo->em_execucao ?? 0),
            'finalizadas' => (int) ($resumo->finalizadas ?? 0),
            'tecnicos_ativos' => (int) OrdemServico::query()
                ->whereBetween('data_abertura', [$inicio, $fim])
                ->whereNotNull('tecnico_responsavel_id')
                ->distinct()
                ->count('tecnico_responsavel_id'),
        ];
    }

    private function calculateTempoMedioHoras(): ?float
    {
        $query = OrdemServico::query()
            ->where('status', 'finalizada')
            ->whereNotNull('data_abertura')
            ->whereNotNull('data_encerramento');

        $driver = $query->getConnection()->getDriverName();
        $expression = $driver === 'pgsql'
            ? 'AVG(EXTRACT(EPOCH FROM (data_encerramento - data_abertura)) / 3600.0)'
            : 'AVG((julianday(data_encerramento) - julianday(data_abertura)) * 24.0)';

        $media = $query->selectRaw("{$expression} as media_horas")->value('media_horas');

        if ($media === null) {
            return null;
        }

        return round((float) $media, 1);
    }

    private function baseListQuery(): Builder
    {
        return OrdemServico::query()
            ->select([
                'id',
                'numero',
                'tipo',
                'nome_cliente',
                'status',
                'data_abertura',
                'descricao',
                'tecnico_responsavel_id',
            ])
            ->with(['tecnicoResponsavel:id,name']);
    }

    private function baseMetricsQuery(): Builder
    {
        return OrdemServico::query();
    }

    /**
     * @return array{total:int,aberta:int,em_execucao:int,finalizada:int,nao_executada:int,cancelada:int}
     */
    private function buildStatusCounts(Builder $query): array
    {
        $row = (clone $query)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'aberta' THEN 1 ELSE 0 END) as aberta")
            ->selectRaw("SUM(CASE WHEN status = 'em_execucao' THEN 1 ELSE 0 END) as em_execucao")
            ->selectRaw("SUM(CASE WHEN status = 'finalizada' THEN 1 ELSE 0 END) as finalizada")
            ->selectRaw("SUM(CASE WHEN status = 'nao_executada' THEN 1 ELSE 0 END) as nao_executada")
            ->selectRaw("SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as cancelada")
            ->first();

        return [
            'total' => (int) ($row->total ?? 0),
            'aberta' => (int) ($row->aberta ?? 0),
            'em_execucao' => (int) ($row->em_execucao ?? 0),
            'finalizada' => (int) ($row->finalizada ?? 0),
            'nao_executada' => (int) ($row->nao_executada ?? 0),
            'cancelada' => (int) ($row->cancelada ?? 0),
        ];
    }

    private function applySearch(Builder $query, ?string $search): Builder
    {
        $term = trim((string) $search);

        if ($term === '') {
            return $query;
        }

        $likeOperator = $this->caseInsensitiveLikeOperator($query);
        $pattern = $this->containsPattern($term);

        return $query->where(function (Builder $where) use ($likeOperator, $pattern) {
            $where->where('numero', $likeOperator, $pattern)
                ->orWhere('tipo', $likeOperator, $pattern)
                ->orWhere('descricao', $likeOperator, $pattern)
                ->orWhere('nome_cliente', $likeOperator, $pattern)
                ->orWhereHas('tecnicoResponsavel', function (Builder $tecnicoQuery) use ($pattern) {
                    $tecnicoLikeOperator = $this->caseInsensitiveLikeOperator($tecnicoQuery);

                    $tecnicoQuery->where('name', $tecnicoLikeOperator, $pattern);
                });
        });
    }

    private function getStatusCount(array $statusResumo, string $status): int
    {
        $item = collect($statusResumo)->firstWhere('status', $status);

        return (int) ($item['quantidade'] ?? 0);
    }
}
