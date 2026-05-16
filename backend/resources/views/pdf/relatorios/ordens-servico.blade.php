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
        <h2 class="section-title">Resumo Geral do Mês</h2>
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

    <div class="section">
        <h2 class="section-title">Resumo por Status</h2>
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
                            <td>{{ $item['status'] }}</td>
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
    </div>

    <div class="section">
        <h2 class="section-title">Resumo por Tipo de Serviço</h2>
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

    <div class="section">
        <h2 class="section-title">Resumo por Técnico</h2>
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
    </div>

    @if (count($linhasDetalhe) > 0)
        <div class="section">
            <h2 class="section-title">Detalhamento da Consulta</h2>
            <div class="panel">
                <table class="data-table">
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
                                    <td>{{ $row[$column['key']] ?? '-' }}</td>
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
