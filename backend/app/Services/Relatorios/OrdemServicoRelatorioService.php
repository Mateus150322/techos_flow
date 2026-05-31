<?php

namespace App\Services\Relatorios;

use App\Models\Anexo;
use App\Models\ExecucaoFuncionario;
use App\Models\OrdemServico;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class OrdemServicoRelatorioService
{
    public function __construct(
        private readonly OperationalContextFormatter $operationalContextFormatter
    ) {
    }

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
        $metricasOperacionais = $this->buildMetricasOperacionais($baseQuery);
        $resumoOperacional = $this->buildResumoOperacional($baseQuery, $resumo, $metricasOperacionais);
        $gargalosOperacionais = $this->buildGargalosOperacionais($resumoOperacional);
        $filaOperacional = $this->buildFilaOperacional($baseQuery);
        $cargaTecnicos = $this->buildCargaTecnicos($baseQuery);
        $resumoTiposStatus = $this->buildResumoTiposStatus($baseQuery);
        $resumoTecnicosOperacional = $this->buildResumoTecnicosOperacional($baseQuery);
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
            'resumoOperacional' => $resumoOperacional,
            'gargalosOperacionais' => $gargalosOperacionais,
            'filaOperacional' => $filaOperacional,
            'cargaTecnicos' => $cargaTecnicos,
            'statusResumo' => $statusResumo,
            'produtividadeTecnicos' => $produtividadeTecnicos,
            'tiposMaisFrequentes' => $tiposMaisFrequentes,
            'metricasOperacionais' => $metricasOperacionais,
            'resumoTiposStatus' => $resumoTiposStatus,
            'resumoTecnicosOperacional' => $resumoTecnicosOperacional,
            'reportDefinition' => $reportDefinition,
            'reportPagination' => $reportPagination,
            'ordensExportacao' => $forExport
                ? $this->buildOrdensExportacao($tipoRelatorio, $baseQuery)
                : [],
            'atividadeRecente' => (clone $baseQuery)
                ->with(['tecnicoResponsavel:id,name'])
                ->select([
                    'id',
                    'numero',
                    'nome_cliente',
                    'tipo',
                    'status',
                    'prioridade',
                    'data_abertura',
                    'updated_at',
                    'tecnico_responsavel_id',
                ])
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get()
                ->map(fn (OrdemServico $ordem) => [
                    'id' => $ordem->id,
                    'numero' => $ordem->numero,
                    'nome_cliente' => $ordem->nome_cliente,
                    'tipo' => $ordem->tipo,
                    'status' => $ordem->status,
                    'prioridade' => (int) $ordem->prioridade,
                    'data_abertura' => $ordem->data_abertura,
                    'atualizado_em' => $ordem->updated_at,
                    'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
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

    private function buildOrdensExportacao(string $tipoRelatorio, Builder $baseQuery): array
    {
        if ($tipoRelatorio === 'status' || $tipoRelatorio === 'produtividade' || $tipoRelatorio === 'tipo') {
            return [];
        }

        if ($tipoRelatorio === 'operacional') {
            return $this->buildOperationalOrderQuery($baseQuery)
                ->get()
                ->map(function (OrdemServico $ordem) {
                    $detalhes = $this->operationalContextFormatter->extractOperationalDetails($ordem);

                return [
                    'id' => $ordem->id,
                    'numero' => $ordem->numero,
                    'tipo' => (string) $ordem->tipo,
                    'status' => $this->formatStatus((string) $ordem->status),
                    'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
                    'clienteLocal' => $detalhes['local'] !== '-' ? $detalhes['local'] : ($ordem->nome_cliente ?? '-'),
                    'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
                    'abertura' => $this->formatDate($ordem->data_abertura),
                    'encerramento' => $this->formatDate($ordem->data_encerramento),
                    'contexto' => $detalhes['contexto'],
                ];
            })
            ->values()
            ->all();
        }

        return (clone $baseQuery)
            ->with(['tecnicoResponsavel:id,name'])
            ->orderByDesc('data_abertura')
            ->get()
            ->map(fn (OrdemServico $ordem) => [
                'id' => $ordem->id,
                'numero' => $ordem->numero,
                'tipo' => (string) $ordem->tipo,
                'status' => $this->formatStatus((string) $ordem->status),
                'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
                'clienteLocal' => $ordem->nome_cliente ?? '-',
                'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
                'abertura' => $this->formatDate($ordem->data_abertura),
                'encerramento' => $this->formatDate($ordem->data_encerramento),
                'contexto' => $this->operationalContextFormatter->formatContextoOperacional(
                    $ordem->motivo_nao_execucao,
                    $ordem->descricao,
                    $ordem->observacoes
                ),
            ])
            ->values()
            ->all();
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
            ['status' => 'Em execução', 'quantidade' => $resumo['emExecucao']],
            ['status' => 'Finalizadas', 'quantidade' => $resumo['finalizadas']],
            ['status' => 'Não executadas', 'quantidade' => $resumo['naoExecutadas']],
            ['status' => 'Canceladas', 'quantidade' => $resumo['canceladas']],
        ])->map(fn (array $item) => [
            ...$item,
            'percentual' => $resumo['total'] > 0
                ? round(($item['quantidade'] / $resumo['total']) * 100, 2)
                : 0,
        ])->values()->all();
    }

    private function buildProdutividadeTecnicos(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->whereNotNull('ordem_servicos.tecnico_responsavel_id')
            ->leftJoin('users as tecnicos', 'tecnicos.id', '=', 'ordem_servicos.tecnico_responsavel_id')
            ->selectRaw("
                COALESCE(tecnicos.name, 'Sem responsável') as tecnico,
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

    private function buildMetricasOperacionais(Builder $baseQuery): array
    {
        $fotosAnexadas = Anexo::query()
            ->where('tipo', 'foto')
            ->whereIn('os_id', (clone $baseQuery)->select('ordem_servicos.id'))
            ->count();

        $horasExtrasMinutos = (int) ExecucaoFuncionario::query()
            ->join('execucoes', 'execucoes.id', '=', 'execucao_funcionarios.execucao_id')
            ->join('ordem_servicos', 'ordem_servicos.id', '=', 'execucoes.os_id')
            ->whereIn('ordem_servicos.id', (clone $baseQuery)->select('ordem_servicos.id'))
            ->sum(DB::raw('COALESCE(execucao_funcionarios.minutos_extras_50, 0) + COALESCE(execucao_funcionarios.minutos_extras_100, 0)'));

        return [
            'fotosAnexadas' => (int) $fotosAnexadas,
            'horasExtrasMinutos' => $horasExtrasMinutos,
            'horasExtrasFormatadas' => $this->formatarMinutos($horasExtrasMinutos),
        ];
    }

    private function buildResumoOperacional(
        Builder $baseQuery,
        array $resumo,
        array $metricasOperacionais
    ): array {
        $limiteAbertas = now()->copy()->subHours(48);
        $limiteExecucoes = now()->copy()->subHours(24);

        $semResponsavel = (clone $baseQuery)
            ->where('status', 'aberta')
            ->whereNull('tecnico_responsavel_id')
            ->count();

        $criticasAtivas = (clone $baseQuery)
            ->whereIn('status', ['aberta', 'em_execucao'])
            ->where('prioridade', 1)
            ->count();

        $abertas48h = (clone $baseQuery)
            ->where('status', 'aberta')
            ->where('data_abertura', '<=', $limiteAbertas)
            ->count();

        $execucao24h = (clone $baseQuery)
            ->where('status', 'em_execucao')
            ->whereHas('execucoes', function (Builder $query) use ($limiteExecucoes) {
                $query
                    ->whereNull('data_fim')
                    ->where('data_inicio', '<=', $limiteExecucoes);
            })
            ->count();

        return [
            'filaAtiva' => $resumo['abertas'] + $resumo['emExecucao'],
            'semResponsavel' => $semResponsavel,
            'criticasAtivas' => $criticasAtivas,
            'abertas48h' => $abertas48h,
            'execucao24h' => $execucao24h,
            'fotosAnexadas' => (int) $metricasOperacionais['fotosAnexadas'],
            'horasExtrasFormatadas' => (string) $metricasOperacionais['horasExtrasFormatadas'],
        ];
    }

    private function buildGargalosOperacionais(array $resumoOperacional): array
    {
        return [
            [
                'id' => 'sem-responsavel',
                'label' => 'OS sem responsável',
                'quantidade' => $resumoOperacional['semResponsavel'],
                'descricao' => 'Ordens abertas aguardando aceite ou atribuição técnica.',
                'nivel' => $resumoOperacional['semResponsavel'] > 0 ? 'critico' : 'ok',
            ],
            [
                'id' => 'criticas-ativas',
                'label' => 'Alta prioridade ativa',
                'quantidade' => $resumoOperacional['criticasAtivas'],
                'descricao' => 'Ordens de alta prioridade ainda abertas ou em execução.',
                'nivel' => $resumoOperacional['criticasAtivas'] > 0 ? 'critico' : 'ok',
            ],
            [
                'id' => 'abertas-48h',
                'label' => 'Abertas há mais de 48h',
                'quantidade' => $resumoOperacional['abertas48h'],
                'descricao' => 'Ordens abertas com risco de represamento operacional.',
                'nivel' => $resumoOperacional['abertas48h'] > 0 ? 'atencao' : 'ok',
            ],
            [
                'id' => 'execucao-24h',
                'label' => 'Em execução há mais de 24h',
                'quantidade' => $resumoOperacional['execucao24h'],
                'descricao' => 'Execuções longas que exigem revisão ou acompanhamento.',
                'nivel' => $resumoOperacional['execucao24h'] > 0 ? 'atencao' : 'ok',
            ],
        ];
    }

    private function buildFilaOperacional(Builder $baseQuery): array
    {
        $agora = now();

        return $this->buildOperationalOrderQuery($baseQuery)
            ->limit(8)
            ->get()
            ->map(function (OrdemServico $ordem) use ($agora) {
                $idadeHoras = $ordem->data_abertura?->diffInHours($agora) ?? 0;

                return [
                    'id' => $ordem->id,
                    'numero' => $ordem->numero,
                    'tipo' => $ordem->tipo,
                    'clienteLocal' => $ordem->nome_cliente ?? '-',
                    'status' => $ordem->status,
                    'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
                    'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
                    'idadeHoras' => $idadeHoras,
                    'idadeDescricao' => $this->formatarIdadeHoras($idadeHoras),
                    'contexto' => $this->operationalContextFormatter->formatContextoOperacional(
                        $ordem->motivo_nao_execucao,
                        $ordem->descricao,
                        $ordem->observacoes
                    ),
                ];
            })
            ->values()
            ->all();
    }

    private function buildCargaTecnicos(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->whereNotNull('ordem_servicos.tecnico_responsavel_id')
            ->leftJoin('users as tecnicos', 'tecnicos.id', '=', 'ordem_servicos.tecnico_responsavel_id')
            ->selectRaw("
                COALESCE(tecnicos.name, 'Sem responsável') as tecnico,
                SUM(CASE WHEN ordem_servicos.status = 'aberta' THEN 1 ELSE 0 END) as abertas,
                SUM(CASE WHEN ordem_servicos.status = 'em_execucao' THEN 1 ELSE 0 END) as em_execucao,
                SUM(CASE WHEN ordem_servicos.status IN ('aberta', 'em_execucao') THEN 1 ELSE 0 END) as total_ativas,
                SUM(CASE WHEN ordem_servicos.prioridade = 1 AND ordem_servicos.status IN ('aberta', 'em_execucao') THEN 1 ELSE 0 END) as criticas
            ")
            ->groupBy('ordem_servicos.tecnico_responsavel_id', 'tecnicos.name')
            ->havingRaw("SUM(CASE WHEN ordem_servicos.status IN ('aberta', 'em_execucao') THEN 1 ELSE 0 END) > 0")
            ->orderByDesc('total_ativas')
            ->orderByDesc('criticas')
            ->orderBy('tecnicos.name')
            ->get()
            ->map(fn (object $row) => [
                'tecnico' => (string) $row->tecnico,
                'abertas' => (int) $row->abertas,
                'emExecucao' => (int) $row->em_execucao,
                'criticas' => (int) $row->criticas,
                'totalAtivas' => (int) $row->total_ativas,
            ])
            ->values()
            ->all();
    }

    private function buildResumoTiposStatus(Builder $baseQuery): array
    {
        return (clone $baseQuery)
            ->selectRaw('tipo, status, COUNT(*) as quantidade')
            ->groupBy('tipo', 'status')
            ->get()
            ->groupBy('tipo')
            ->map(function (Collection $items, string $tipo) {
                $statusMap = $items
                    ->pluck('quantidade', 'status')
                    ->map(fn (mixed $value) => (int) $value);

                $abertas = $statusMap->get('aberta', 0);
                $emExecucao = $statusMap->get('em_execucao', 0);
                $finalizadas = $statusMap->get('finalizada', 0);
                $naoExecutadas = $statusMap->get('nao_executada', 0);
                $canceladas = $statusMap->get('cancelada', 0);

                return [
                    'tipo' => $tipo,
                    'abertas' => $abertas,
                    'emExecucao' => $emExecucao,
                    'finalizadas' => $finalizadas,
                    'naoExecutadas' => $naoExecutadas,
                    'canceladas' => $canceladas,
                    'total' => $abertas + $emExecucao + $finalizadas + $naoExecutadas + $canceladas,
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    private function buildResumoTecnicosOperacional(Builder $baseQuery): array
    {
        return ExecucaoFuncionario::query()
            ->join('execucoes', 'execucoes.id', '=', 'execucao_funcionarios.execucao_id')
            ->join('ordem_servicos', 'ordem_servicos.id', '=', 'execucoes.os_id')
            ->join('users as funcionarios', 'funcionarios.id', '=', 'execucao_funcionarios.funcionario_id')
            ->where('funcionarios.role', 'tecnico')
            ->whereIn('ordem_servicos.id', (clone $baseQuery)->select('ordem_servicos.id'))
            ->selectRaw("
                funcionarios.name as tecnico,
                COUNT(DISTINCT CASE WHEN ordem_servicos.status = 'finalizada' THEN ordem_servicos.id END) as os_finalizadas,
                COALESCE(SUM(execucao_funcionarios.minutos_trabalhados), 0) as minutos_trabalhados,
                COALESCE(SUM(COALESCE(execucao_funcionarios.minutos_extras_50, 0) + COALESCE(execucao_funcionarios.minutos_extras_100, 0)), 0) as minutos_extras
            ")
            ->groupBy('funcionarios.id', 'funcionarios.name')
            ->orderByDesc('os_finalizadas')
            ->orderBy('funcionarios.name')
            ->get()
            ->map(fn (object $row) => [
                'tecnico' => (string) $row->tecnico,
                'osFinalizadas' => (int) $row->os_finalizadas,
                'horasTrabalhadas' => $this->formatarMinutos((int) $row->minutos_trabalhados),
                'horasExtras' => $this->formatarMinutos((int) $row->minutos_extras),
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
                'title' => 'Relatório por Status',
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
                'title' => 'Relatório de Produtividade dos Técnicos',
                'columns' => [
                    ['key' => 'tecnico', 'label' => 'Técnico'],
                    ['key' => 'aceitas', 'label' => 'OS aceitas'],
                    ['key' => 'iniciadas', 'label' => 'OS em execução'],
                    ['key' => 'finalizadas', 'label' => 'OS finalizadas'],
                    ['key' => 'naoExecutadas', 'label' => 'OS não executadas'],
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
                'title' => 'Relatório por Tipo de Serviço',
                'columns' => [
                    ['key' => 'tipo', 'label' => 'Tipo de serviço'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
                'rows' => $rows,
            ], $this->singlePagePagination(count($rows))];
        }

        if ($tipoRelatorio === 'operacional') {
            $columns = $this->operationalReportColumnsV2();
            $query = $this->buildOperationalOrderQuery($baseQuery);

            if ($forExport) {
                $rows = $this->mapOrdensOperacionaisToRows($query->get());

                return [[
                    'title' => 'Fila Operacional Priorizada',
                    'columns' => $columns,
                    'rows' => $rows,
                ], $this->singlePagePagination(count($rows))];
            }

            $perPage = (int) ($filters['per_page'] ?? 20);
            $page = (int) ($filters['page'] ?? 1);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);
            $rows = $this->mapOrdensOperacionaisToRows(collect($paginator->items()));

            return [[
                'title' => 'Fila Operacional Priorizada',
                'columns' => $columns,
                'rows' => $rows,
            ], [
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'lastPage' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ]];
        }

        $query = (clone $baseQuery)
            ->with([
                'tecnicoResponsavel:id,name',
                'endereco:id,rua,numero,complemento,bairro,cidade,estado',
            ])
            ->orderByDesc('data_abertura');

        $title = $tipoRelatorio === 'periodo'
            ? 'Relatório por Período'
            : 'Relatório Geral de Ordens de Serviço';

        $columns = [
            ['key' => 'numero', 'label' => 'Número da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de serviço'],
            ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'abertura', 'label' => 'Data de abertura'],
            ['key' => 'encerramento', 'label' => 'Data de encerramento'],
            ['key' => 'responsavel', 'label' => 'Responsável técnico'],
            ['key' => 'observacoes', 'label' => 'Contexto operacional'],
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
            'operacional' => [
                'title' => 'Fila Operacional Priorizada',
                'columns' => $this->operationalReportColumnsV2(),
            ],
            'status' => [
                'title' => 'Relatório por Status',
                'columns' => [
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
            ],
            'produtividade' => [
                'title' => 'Relatório de Produtividade dos Técnicos',
                'columns' => [
                    ['key' => 'tecnico', 'label' => 'Técnico'],
                    ['key' => 'aceitas', 'label' => 'OS aceitas'],
                    ['key' => 'iniciadas', 'label' => 'OS em execução'],
                    ['key' => 'finalizadas', 'label' => 'OS finalizadas'],
                    ['key' => 'naoExecutadas', 'label' => 'OS não executadas'],
                ],
            ],
            'tipo' => [
                'title' => 'Relatório por Tipo de Serviço',
                'columns' => [
                    ['key' => 'tipo', 'label' => 'Tipo de serviço'],
                    ['key' => 'quantidade', 'label' => 'Quantidade'],
                    ['key' => 'percentual', 'label' => 'Percentual'],
                ],
            ],
            'periodo' => [
                'title' => 'Relatório por Período',
                'columns' => $this->detailedReportColumns(),
            ],
            default => [
                'title' => 'Relatório Geral de Ordens de Serviço',
                'columns' => $this->detailedReportColumns(),
            ],
        };
    }

    public function streamCsvRows(array $filters, callable $emitRow): void
    {
        $tipoRelatorio = $filters['tipo_relatorio'] ?? 'geral';
        $baseQuery = $this->buildBaseQuery($filters);

        if ($tipoRelatorio === 'operacional') {
            foreach ($this->buildOperationalOrderQuery($baseQuery)->cursor() as $ordem) {
                $emitRow($this->mapOrdemOperacionalToRow($ordem));
            }

            return;
        }

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
                'ordem_servicos.observacoes',
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
                    'responsavel' => $row->tecnico_nome ?: 'Sem responsável',
                'observacoes' => $this->operationalContextFormatter->formatContextoOperacional(
                    $row->motivo_nao_execucao,
                    $row->descricao,
                    $row->observacoes
                ),
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
            'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
            'observacoes' => $this->operationalContextFormatter->formatContextoOperacional(
                $ordem->motivo_nao_execucao,
                $ordem->descricao,
                $ordem->observacoes
            ),
        ])->values()->all();
    }

    private function buildOperationalOrderQuery(Builder $baseQuery): Builder
    {
        return (clone $baseQuery)
            ->with(['tecnicoResponsavel:id,name'])
            ->whereIn('status', ['aberta', 'em_execucao'])
            ->orderByRaw('CASE prioridade WHEN 1 THEN 0 WHEN 2 THEN 1 ELSE 2 END')
            ->orderByRaw("CASE status WHEN 'aberta' THEN 0 ELSE 1 END")
            ->orderBy('data_abertura');
    }

    private function mapOrdensOperacionaisToRows(Collection $ordens): array
    {
        return $ordens
            ->map(fn (OrdemServico $ordem) => $this->mapOrdemOperacionalToRow($ordem))
            ->values()
            ->all();
    }

    private function mapOrdemOperacionalToRow(OrdemServico $ordem): array
    {
        $idadeHoras = $ordem->data_abertura?->diffInHours(now()) ?? 0;
        $detalhes = $this->operationalContextFormatter->extractOperationalDetails($ordem);

        return [
            'numero' => $ordem->numero,
            'tipo' => $ordem->tipo,
            'local' => $detalhes['local'],
            'origem' => $detalhes['origem'],
            'status' => $this->formatStatus($ordem->status),
            'prioridade' => $this->formatPrioridade((int) $ordem->prioridade),
            'servico' => $detalhes['servico'],
            'equipamento' => $detalhes['equipamento'],
            'responsavel' => $ordem->tecnicoResponsavel?->name ?? 'Sem responsável',
            'idade' => $this->formatarIdadeHoras($idadeHoras),
            'contexto' => $detalhes['contexto'],
        ];
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
    ): string
    {
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
        return match ($status) {
            'em_execucao' => 'Em execução',
            'nao_executada' => 'Não executada',
            default => ucfirst($status),
        };
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

    private function detailedReportColumns(): array
    {
        return [
            ['key' => 'numero', 'label' => 'Número da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de serviço'],
            ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'abertura', 'label' => 'Data de abertura'],
            ['key' => 'encerramento', 'label' => 'Data de encerramento'],
            ['key' => 'responsavel', 'label' => 'Responsável técnico'],
            ['key' => 'observacoes', 'label' => 'Contexto operacional'],
        ];
    }

    private function operationalReportColumnsV2(): array
    {
        return [
            ['key' => 'numero', 'label' => 'Número da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de serviço'],
            ['key' => 'local', 'label' => 'Unidade / Local'],
            ['key' => 'origem', 'label' => 'Origem da solicitação'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'servico', 'label' => 'Serviço solicitado'],
            ['key' => 'equipamento', 'label' => 'Equipamento'],
            ['key' => 'responsavel', 'label' => 'Responsável técnico'],
            ['key' => 'idade', 'label' => 'Tempo em fila'],
            ['key' => 'contexto', 'label' => 'Resumo operacional'],
        ];
    }

    private function operationalReportColumns(): array
    {
        return [
            ['key' => 'numero', 'label' => 'Número da OS'],
            ['key' => 'tipo', 'label' => 'Tipo de serviço'],
            ['key' => 'clienteLocal', 'label' => 'Cliente/Local'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'prioridade', 'label' => 'Prioridade'],
            ['key' => 'responsavel', 'label' => 'Responsável técnico'],
            ['key' => 'idade', 'label' => 'Tempo em fila'],
            ['key' => 'contexto', 'label' => 'Contexto operacional'],
        ];
    }
    private function extractOperationalDetails(OrdemServico $ordem): array
    {
        $campos = $this->extractStructuredContext($ordem->descricao);
        $contexto = $this->formatContextoOperacional(
            $ordem->motivo_nao_execucao,
            $ordem->descricao,
            $ordem->observacoes
        );

        $localPartes = array_filter([
            $campos['unidade'] ?? null,
            $campos['local'] ?? null,
        ]);

        if ($localPartes === []) {
            $localPartes = array_filter([
                $ordem->endereco?->rua,
                $ordem->endereco?->numero,
                $ordem->endereco?->bairro,
            ]);
        }

        $origemPartes = array_filter([
            $campos['setor'] ?? null,
            $campos['encarregado'] ?? null,
        ]);

        if ($origemPartes === []) {
            $origemPartes = array_filter([$ordem->nome_cliente]);
        }

        $servico = $campos['servico'] ?? $campos['tipo_manutencao'] ?? '';
        if ($servico === '') {
            $servico = $contexto !== '-' ? $contexto : $ordem->tipo;
        }

        $equipamento = $campos['equipamento'] ?? '';
        if ($equipamento === '') {
            $equipamento = $campos['diagnostico'] ?? '-';
        }

        return [
            'local' => $localPartes !== [] ? implode(' / ', $localPartes) : '-',
            'origem' => $origemPartes !== [] ? implode(' / ', $origemPartes) : 'Não informado',
            'servico' => $this->limitContext($this->sanitizeContextText($servico), 80),
            'equipamento' => $this->limitContext($this->sanitizeContextText($equipamento), 70),
            'contexto' => $contexto,
        ];
    }

    private function formatContextoOperacional(
        ?string $motivoNaoExecucao,
        ?string $descricao,
        ?string $observacoes = null
    ): string {
        $motivo = $this->sanitizeContextText($motivoNaoExecucao);

        if ($motivo !== '') {
            return $this->limitContext("Não executada: {$motivo}");
        }

        $campos = $this->extractStructuredContext($descricao);
        $resumoEstruturado = $this->buildStructuredContextSummary($campos);

        if ($resumoEstruturado !== '') {
            return $this->limitContext($resumoEstruturado);
        }

        $texto = $this->sanitizeContextText($observacoes ?: $descricao ?: '');

        if ($texto === '') {
            return '-';
        }

        if (str_contains(mb_strtolower($texto), 'seeder')) {
            return 'Registro inicial de demonstracao.';
        }

        return $this->limitContext($texto);
    }

    private function formatarMinutos(int $minutos): string
    {
        $horas = intdiv($minutos, 60);
        $resto = $minutos % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }

    private function formatarIdadeHoras(int $horas): string
    {
        if ($horas < 24) {
            return "{$horas}h";
        }

        $dias = intdiv($horas, 24);
        $restoHoras = $horas % 24;

        if ($restoHoras === 0) {
            return "{$dias}d";
        }

        return "{$dias}d {$restoHoras}h";
    }

    private function extractStructuredContext(?string $descricao): array
    {
        $texto = trim((string) $descricao);

        if ($texto === '') {
            return [];
        }

        $campos = [];

        foreach (preg_split("/\r\n|\n|\r/", $texto) ?: [] as $linha) {
            $linha = trim($linha);

            if ($linha === '' || !str_contains($linha, ':')) {
                continue;
            }

            [$chave, $valor] = array_pad(explode(':', $linha, 2), 2, '');
            $chaveNormalizada = $this->normalizeContextKey($chave);
            $valor = $this->sanitizeContextText($valor);

            if ($chaveNormalizada === '' || $valor === '') {
                continue;
            }

            $campos[$chaveNormalizada] = $valor;
        }

        return $campos;
    }

    private function buildStructuredContextSummary(array $campos): string
    {
        if ($campos === []) {
            return '';
        }

        $partes = [];
        $unidade = $campos['unidade'] ?? '';
        $local = $campos['local'] ?? '';
        $tipoManutencao = $campos['tipo_manutencao'] ?? '';
        $servico = $campos['servico'] ?? '';
        $equipamento = $campos['equipamento'] ?? '';
        $diagnostico = $campos['diagnostico'] ?? '';

        if ($unidade !== '' || $local !== '') {
            $partes[] = trim(implode(' / ', array_filter([$unidade, $local])));
        }

        if ($tipoManutencao !== '') {
            $partes[] = ucfirst(mb_strtolower($tipoManutencao));
        }

        if ($servico !== '') {
            $partes[] = 'Serviço: ' . $servico;
        }

        if ($equipamento !== '') {
            $partes[] = 'Equip.: ' . $equipamento;
        }

        if ($diagnostico !== '') {
            $partes[] = 'Diag.: ' . $diagnostico;
        }

        if ($partes === []) {
            foreach (['setor', 'encarregado', 'procedimento', 'material', 'material_utilizado'] as $campo) {
                if (!empty($campos[$campo])) {
                    $partes[] = ucfirst(str_replace('_', ' ', $campo)) . ': ' . $campos[$campo];
                }

                if (count($partes) >= 2) {
                    break;
                }
            }
        }

        return implode(' • ', $partes);
    }

    private function normalizeContextKey(string $chave): string
    {
        $normalizada = mb_strtolower(trim($chave));
        $normalizada = str_replace(
            ['Ã£', 'Ã¡', 'Ã ', 'Ã¢', 'Ã©', 'Ãª', 'Ã­', 'Ã³', 'Ã´', 'Ãµ', 'Ãº', 'Ã§'],
            ['a', 'a', 'a', 'a', 'e', 'e', 'i', 'o', 'o', 'o', 'u', 'c'],
            $normalizada
        );
        $normalizada = preg_replace('/[^a-z0-9]+/u', '_', $normalizada) ?? $normalizada;

        return trim($normalizada, '_');
    }

    private function sanitizeContextText(?string $texto): string
    {
        $texto = trim((string) $texto);
        $texto = preg_replace('/\s+/u', ' ', $texto) ?? $texto;

        return trim($texto, " \t\n\r\0\x0B,;.-");
    }

    private function limitContext(string $texto, int $limite = 110): string
    {
        if (mb_strlen($texto) <= $limite) {
            return $texto;
        }

        return rtrim(mb_substr($texto, 0, $limite - 3)) . '...';
    }
}




