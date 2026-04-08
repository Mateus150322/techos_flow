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

        $abertasQuery = (clone $baseQuery)->where('status', 'aberta');
        $emExecucaoQuery = (clone $baseQuery)->where('status', 'em_execucao');
        $encerradasQuery = (clone $baseQuery)->whereIn('status', ['finalizada', 'nao_executada', 'cancelada']);

        return [
            'resumo' => [
                'total' => (clone $baseQuery)->count(),
                'abertas' => (clone $abertasQuery)->count(),
                'em_execucao' => (clone $emExecucaoQuery)->count(),
                'encerradas' => (clone $encerradasQuery)->count(),
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

        $disponiveisQuery = (clone $baseQuery)
            ->where('status', 'aberta')
            ->whereNull('tecnico_responsavel_id');
        $minhasQuery = (clone $baseQuery)->where('tecnico_responsavel_id', $tecnico->id);
        $emExecucaoQuery = (clone $minhasQuery)->where('status', 'em_execucao');
        $finalizadasQuery = (clone $minhasQuery)->whereIn('status', ['finalizada', 'nao_executada']);

        return [
            'resumo' => [
                'disponiveis' => (clone $disponiveisQuery)->count(),
                'minhas' => (clone $minhasQuery)->count(),
                'em_execucao' => (clone $emExecucaoQuery)->count(),
                'concluidas' => (clone $finalizadasQuery)->count(),
                'total_filtrado' => (clone $baseQuery)->count(),
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
            ['status' => 'em_execucao', 'label' => 'Em execucao', 'quantidade' => (int) ($counts['em_execucao'] ?? 0)],
            ['status' => 'finalizada', 'label' => 'Finalizadas', 'quantidade' => (int) ($counts['finalizada'] ?? 0)],
            ['status' => 'nao_executada', 'label' => 'Nao executadas', 'quantidade' => (int) ($counts['nao_executada'] ?? 0)],
            ['status' => 'cancelada', 'label' => 'Canceladas', 'quantidade' => (int) ($counts['cancelada'] ?? 0)],
        ];
    }

    private function buildResumoMesAtual(): array
    {
        $inicio = now()->startOfMonth();
        $fim = now()->endOfMonth();

        $ordensDoMes = OrdemServico::query()
            ->whereBetween('data_abertura', [$inicio, $fim])
            ->get(['status', 'tecnico_responsavel_id']);

        return [
            'abertas' => $ordensDoMes->where('status', 'aberta')->count(),
            'em_execucao' => $ordensDoMes->where('status', 'em_execucao')->count(),
            'finalizadas' => $ordensDoMes->where('status', 'finalizada')->count(),
            'tecnicos_ativos' => $ordensDoMes
                ->pluck('tecnico_responsavel_id')
                ->filter()
                ->unique()
                ->count(),
        ];
    }

    private function calculateTempoMedioHoras(): ?float
    {
        $duracoes = OrdemServico::query()
            ->where('status', 'finalizada')
            ->whereNotNull('data_abertura')
            ->whereNotNull('data_encerramento')
            ->get(['data_abertura', 'data_encerramento'])
            ->map(function (OrdemServico $ordem) {
                $inicio = optional($ordem->data_abertura)->getTimestamp();
                $fim = optional($ordem->data_encerramento)->getTimestamp();

                if (! $inicio || ! $fim || $fim < $inicio) {
                    return null;
                }

                return ($fim - $inicio) / 3600;
            })
            ->filter(fn ($value) => is_numeric($value))
            ->values();

        if ($duracoes->isEmpty()) {
            return null;
        }

        return round((float) $duracoes->avg(), 1);
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
