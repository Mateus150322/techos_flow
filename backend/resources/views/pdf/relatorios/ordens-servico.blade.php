<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>{{ $payload['reportDefinition']['title'] }}</title>
    @include('pdf.partials.document-styles')
</head>
<body>
@php
    $resumo = $payload['resumo'];
    $statusResumo = $payload['statusResumo'] ?? [];
    $resumoTiposStatus = $payload['resumoTiposStatus'] ?? [];
    $resumoTecnicos = $payload['resumoTecnicosOperacional'] ?? [];
    $metricas = $payload['metricasOperacionais'] ?? [
        'fotosAnexadas' => 0,
        'horasExtrasFormatadas' => '0h00',
    ];
    $linhasDetalhe = $payload['reportDefinition']['rows'] ?? [];
    $colunasDetalhe = $payload['reportDefinition']['columns'] ?? [];
    $ordensRelatorio = collect($payload['ordensRelatorio'] ?? []);
    $resumoOperacional = $payload['resumoOperacional'] ?? [
        'filaAtiva' => 0,
        'semResponsavel' => 0,
        'criticasAtivas' => 0,
        'abertas48h' => 0,
        'execucao24h' => 0,
    ];
    $isOperationalReport = ($colunasDetalhe[2]['key'] ?? null) === 'local';

    $statusBadgeClass = static function (?string $status): string {
        return match (mb_strtolower(trim((string) $status))) {
            'aberta' => 'badge-info',
            'em execução', 'em execucao' => 'badge-warning',
            'finalizada' => 'badge-success',
            'não executada', 'nao executada' => 'badge-danger',
            'cancelada' => 'badge-neutral',
            default => 'badge-neutral',
        };
    };

    $priorityBadgeClass = static function (?string $prioridade): string {
        return match (mb_strtolower(trim((string) $prioridade))) {
            'alta' => 'badge-danger',
            'média', 'media' => 'badge-warning',
            'baixa' => 'badge-info',
            default => 'badge-neutral',
        };
    };
@endphp

<div class="page-shell">
    <table class="brand-table">
        <tr>
            <td style="width:60px;">
                <div class="brand-badge">T</div>
            </td>
            <td>
                <div class="brand-name">TechOS <span class="accent">Flow</span></div>
            </td>
            <td class="brand-skyline" style="width:180px;">
                operação mensal<br>
                saneamento e serviços
            </td>
        </tr>
    </table>

    <h1 class="report-title">{{ $payload['reportDefinition']['title'] }}</h1>
    <div class="divider"></div>

    <table class="meta-card-grid">
        <tr>
            <td style="width:33.33%;">
                <div class="meta-card">
                    <div class="meta-label">Período</div>
                    <div class="meta-value">{{ $payload['periodoDescricao'] }}</div>
                </div>
            </td>
            <td style="width:33.33%;">
                <div class="meta-card">
                    <div class="meta-label">Emitido por</div>
                    <div class="meta-value">{{ $responsavelEmissao }}</div>
                </div>
            </td>
            <td style="width:33.33%;">
                <div class="meta-card">
                    <div class="meta-label">Data de emissão</div>
                    <div class="meta-value">{{ $payload['dataEmissao'] }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <div class="panel panel-soft">
            <div class="panel-header">Contexto da consulta</div>
            <div class="panel-body">
                <div class="filter-summary">
                    <span class="summary-kicker">Filtros aplicados</span>
                    <div class="summary-copy">{{ $payload['filtrosDescricao'] }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Resumo executivo</h2>
        <table class="metric-grid">
            <tr>
                <td><div class="metric-card"><div class="metric-label">OS abertas</div><div class="metric-value">{{ $resumo['abertas'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Finalizadas</div><div class="metric-value metric-green">{{ $resumo['finalizadas'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Em execução</div><div class="metric-value metric-amber">{{ $resumo['emExecucao'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Não executadas</div><div class="metric-value metric-red">{{ $resumo['naoExecutadas'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Canceladas</div><div class="metric-value metric-slate">{{ $resumo['canceladas'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Fotos anexadas</div><div class="metric-value metric-purple">{{ $metricas['fotosAnexadas'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Horas extras</div><div class="metric-value metric-cyan">{{ $metricas['horasExtrasFormatadas'] }}</div></div></td>
            </tr>
        </table>
    </div>

    @if ($isOperationalReport)
        <div class="section">
            <h2 class="section-title">Painel operacional do recorte</h2>
            <table class="metric-grid">
                <tr>
                    <td><div class="metric-card"><div class="metric-label">Fila ativa</div><div class="metric-value">{{ $resumoOperacional['filaAtiva'] }}</div></div></td>
                    <td><div class="metric-card"><div class="metric-label">Sem responsável</div><div class="metric-value metric-red">{{ $resumoOperacional['semResponsavel'] }}</div></div></td>
                    <td><div class="metric-card"><div class="metric-label">Críticas ativas</div><div class="metric-value metric-amber">{{ $resumoOperacional['criticasAtivas'] }}</div></div></td>
                    <td><div class="metric-card"><div class="metric-label">Abertas &gt; 48h</div><div class="metric-value metric-red">{{ $resumoOperacional['abertas48h'] }}</div></div></td>
                    <td><div class="metric-card"><div class="metric-label">Execuções &gt; 24h</div><div class="metric-value metric-purple">{{ $resumoOperacional['execucao24h'] }}</div></div></td>
                </tr>
            </table>
        </div>
    @endif

    <div class="section">
        <table class="two-column-grid">
            <tr>
                <td>
                    <h2 class="section-title mt-0">Resumo por status</h2>
                    <div class="panel">
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Quantidade</th>
                                    <th>% do total</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($statusResumo as $item)
                                    <tr>
                                        <td>
                                            <span class="badge {{ $statusBadgeClass($item['status'] ?? '') }}">
                                                {{ $item['status'] }}
                                            </span>
                                        </td>
                                        <td>{{ $item['quantidade'] }}</td>
                                        <td>{{ number_format((float) $item['percentual'], 2, ',', '.') }}%</td>
                                    </tr>
                                @endforeach
                                <tr class="total-row">
                                    <td>Total</td>
                                    <td>{{ $resumo['total'] }}</td>
                                    <td>100,00%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
                <td>
                    <h2 class="section-title mt-0">Resumo por técnico</h2>
                    <div class="panel">
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Técnico</th>
                                    <th>OS finalizadas</th>
                                    <th>Horas trabalhadas</th>
                                    <th>Horas extras</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($resumoTecnicos as $item)
                                    <tr>
                                        <td>{{ $item['tecnico'] }}</td>
                                        <td>{{ $item['osFinalizadas'] }}</td>
                                        <td>{{ $item['horasTrabalhadas'] }}</td>
                                        <td>{{ $item['horasExtras'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4">Nenhum técnico encontrado para os filtros aplicados.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Resumo por tipo de serviço</h2>
        <div class="panel">
            <table class="simple-table">
                <thead>
                    <tr>
                        <th>Tipo de serviço</th>
                        <th>OS abertas</th>
                        <th>Em execução</th>
                        <th>Finalizadas</th>
                        <th>Não executadas</th>
                        <th>Canceladas</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($resumoTiposStatus as $item)
                        <tr>
                            <td>{{ $item['tipo'] }}</td>
                            <td>{{ $item['abertas'] }}</td>
                            <td>{{ $item['emExecucao'] }}</td>
                            <td>{{ $item['finalizadas'] }}</td>
                            <td>{{ $item['naoExecutadas'] }}</td>
                            <td>{{ $item['canceladas'] }}</td>
                            <td>{{ $item['total'] }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">Nenhum tipo de serviço encontrado para os filtros aplicados.</td>
                        </tr>
                    @endforelse
                    <tr class="total-row">
                        <td>Total</td>
                        <td>{{ $resumo['abertas'] }}</td>
                        <td>{{ $resumo['emExecucao'] }}</td>
                        <td>{{ $resumo['finalizadas'] }}</td>
                        <td>{{ $resumo['naoExecutadas'] }}</td>
                        <td>{{ $resumo['canceladas'] }}</td>
                        <td>{{ $resumo['total'] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    @if ($ordensRelatorio->isNotEmpty())
        <div class="section page-break-before">
            <h2 class="section-title">Ordens de serviço do período</h2>

            @foreach ($ordensRelatorio as $ordem)
                @php
                    $fotos = collect($ordem['fotos'] ?? []);
                    $fotoLinhas = $fotos->chunk(2);
                    $fotoUnica = $fotos->count() === 1 ? $fotos->first() : null;
                    $contexto = trim((string) ($ordem['contexto'] ?? ''));
                @endphp

                <div class="panel stack-gap report-os-panel{{ $loop->first ? '' : ' report-os-sheet' }}">
                    <div class="panel-header">OS {{ $ordem['numero'] }} · {{ $ordem['tipo'] }}</div>
                    <div class="panel-body report-os-panel-body">
                        <div class="summary-copy report-os-summary">
                            <strong>Abertura:</strong> {{ $ordem['abertura'] ?? '-' }}
                            @if (($ordem['encerramento'] ?? '-') !== '-')
                                &nbsp;·&nbsp;
                                <strong>Encerramento:</strong> {{ $ordem['encerramento'] }}
                            @endif
                            &nbsp;·&nbsp;
                            <strong>Status:</strong> {{ $ordem['status'] }}
                            &nbsp;·&nbsp;
                            <strong>Prioridade:</strong> {{ $ordem['prioridade'] }}
                            &nbsp;·&nbsp;
                            <strong>Cliente/Local:</strong> {{ $ordem['clienteLocal'] }}
                            &nbsp;·&nbsp;
                            <strong>Responsável:</strong> {{ $ordem['responsavel'] }}
                        </div>

                        <div class="text-panel stack-gap report-os-context">
                            <strong>Contexto operacional:</strong>
                            {{ $contexto !== '' && $contexto !== '-' ? $contexto : 'Sem contexto operacional adicional registrado para esta OS.' }}
                        </div>

                        @if ($fotoLinhas->isEmpty())
                            <div class="text-panel placeholder-text stack-gap">Nenhuma evidência fotográfica registrada para esta OS.</div>
                        @elseif ($fotoUnica)
                            <div class="stack-gap report-single-evidence">
                                <p class="photo-label report-single-evidence-label">{{ $fotoUnica['titulo'] }}</p>
                                <table class="two-column-grid report-single-evidence-grid">
                                    <tr>
                                        <td class="report-single-evidence-photo-cell">
                                            <div class="photo-frame report-single-evidence-frame">
                                                @if (!empty($fotoUnica['src']))
                                                    <img src="{{ $fotoUnica['src'] }}" alt="{{ $fotoUnica['titulo'] }}">
                                                @else
                                                    <div class="photo-empty">Sem imagem registrada</div>
                                                @endif
                                            </div>
                                        </td>
                                        <td class="report-single-evidence-meta-cell">
                                            <div class="photo-meta report-single-evidence-meta">
                                                <div class="photo-meta-title">GeolocalizaÃ§Ã£o da evidÃªncia</div>

                                                @if (!empty($fotoUnica['capturada_em']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Capturada em</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['capturada_em'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['registrada_por']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Registrada por</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['registrada_por'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['coordenadas']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Coordenadas</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['coordenadas'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['precisao']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">PrecisÃ£o</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['precisao'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['rua']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Rua</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['rua'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['bairro']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Bairro</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['bairro'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['cidade_estado']))
                                                    <div class="photo-meta-row">
                                                        <span class="photo-meta-label">Cidade/UF</span>
                                                        <span class="photo-meta-value">{{ $fotoUnica['cidade_estado'] }}</span>
                                                    </div>
                                                @endif

                                                @if (!empty($fotoUnica['endereco_capturado']))
                                                    <div class="photo-meta-block">
                                                        <div class="photo-meta-label">EndereÃ§o capturado</div>
                                                        <div class="photo-meta-value photo-meta-address">{{ $fotoUnica['endereco_capturado'] }}</div>
                                                    </div>
                                                @endif

                                                @if (
                                                    empty($fotoUnica['coordenadas']) &&
                                                    empty($fotoUnica['precisao']) &&
                                                    empty($fotoUnica['endereco_capturado']) &&
                                                    empty($fotoUnica['rua']) &&
                                                    empty($fotoUnica['bairro']) &&
                                                    empty($fotoUnica['cidade_estado'])
                                                )
                                                    <div class="photo-meta-empty">Sem geolocalizaÃ§Ã£o registrada nesta evidÃªncia.</div>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        @else
                            <table class="photo-grid report-photo-grid stack-gap">
                                @foreach ($fotoLinhas as $linha)
                                    <tr>
                                        @foreach ($linha as $foto)
                                            <td>
                                                <div class="photo-card report-photo-card">
                                                    <p class="photo-label">{{ $foto['titulo'] }}</p>
                                                    <div class="photo-frame report-photo-frame">
                                                        @if (!empty($foto['src']))
                                                            <img src="{{ $foto['src'] }}" alt="{{ $foto['titulo'] }}">
                                                        @else
                                                            <div class="photo-empty">Sem imagem registrada</div>
                                                        @endif
                                                    </div>

                                                    <div class="photo-meta report-photo-meta">
                                                        <div class="photo-meta-title">Geolocalização da evidência</div>

                                                        @if (!empty($foto['capturada_em']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Capturada em</span>
                                                                <span class="photo-meta-value">{{ $foto['capturada_em'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['registrada_por']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Registrada por</span>
                                                                <span class="photo-meta-value">{{ $foto['registrada_por'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['coordenadas']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Coordenadas</span>
                                                                <span class="photo-meta-value">{{ $foto['coordenadas'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['precisao']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Precisão</span>
                                                                <span class="photo-meta-value">{{ $foto['precisao'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['rua']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Rua</span>
                                                                <span class="photo-meta-value">{{ $foto['rua'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['bairro']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Bairro</span>
                                                                <span class="photo-meta-value">{{ $foto['bairro'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['cidade_estado']))
                                                            <div class="photo-meta-row">
                                                                <span class="photo-meta-label">Cidade/UF</span>
                                                                <span class="photo-meta-value">{{ $foto['cidade_estado'] }}</span>
                                                            </div>
                                                        @endif

                                                        @if (!empty($foto['endereco_capturado']))
                                                            <div class="photo-meta-block">
                                                                <div class="photo-meta-label">Endereço capturado</div>
                                                                <div class="photo-meta-value photo-meta-address">{{ $foto['endereco_capturado'] }}</div>
                                                            </div>
                                                        @endif

                                                        @if (
                                                            empty($foto['coordenadas']) &&
                                                            empty($foto['precisao']) &&
                                                            empty($foto['endereco_capturado']) &&
                                                            empty($foto['rua']) &&
                                                            empty($foto['bairro']) &&
                                                            empty($foto['cidade_estado'])
                                                        )
                                                            <div class="photo-meta-empty">Sem geolocalização registrada nesta evidência.</div>
                                                        @endif
                                                    </div>
                                                </div>
                                            </td>
                                        @endforeach
                                        @for ($slot = $linha->count(); $slot < 2; $slot++)
                                            <td class="report-photo-placeholder-cell"></td>
                                        @endfor
                                    </tr>
                                @endforeach
                            </table>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @elseif (count($linhasDetalhe) > 0)
        <div class="section">
            <h2 class="section-title">{{ $isOperationalReport ? 'Fila operacional detalhada' : 'Detalhamento da consulta' }}</h2>
            <div class="panel">
                <table class="data-table{{ $isOperationalReport ? ' data-table-compact operational-table' : '' }}">
                    <thead>
                        <tr>
                            @foreach ($colunasDetalhe as $column)
                                <th>{{ $column['label'] }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($linhasDetalhe as $row)
                            <tr>
                                @foreach ($colunasDetalhe as $column)
                                    @php
                                        $value = $row[$column['key']] ?? '-';
                                    @endphp
                                    <td>
                                        @if ($column['key'] === 'status')
                                            <span class="badge {{ $statusBadgeClass($value) }}">{{ $value }}</span>
                                        @elseif ($column['key'] === 'prioridade')
                                            <span class="badge {{ $priorityBadgeClass($value) }}">{{ $value }}</span>
                                        @else
                                            {{ $value }}
                                        @endif
                                    </td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @endif

    <table class="footer">
        <tr>
            <td>Relatório gerado automaticamente pelo TechOS Flow.</td>
            <td class="footer-right">Documento administrativo interno</td>
        </tr>
    </table>
</div>
</body>
</html>
