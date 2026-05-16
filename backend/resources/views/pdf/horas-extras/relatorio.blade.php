<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>{{ $payload['title'] }}</title>
    @include('pdf.partials.document-styles')
</head>
<body>
@php
    $resumo = $payload['resumo'];
    $formatarMinutos = static function (int $minutos): string {
        return sprintf('%dh%02d', intdiv($minutos, 60), $minutos % 60);
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
                Gestão de pessoas<br>
                horas extras e folgas
            </td>
        </tr>
    </table>

    <h1 class="report-title">{{ $payload['title'] }}</h1>
    <div class="divider"></div>

    <table class="meta-card-grid">
        <tr>
            <td style="width:33.33%;">
                <div class="meta-card">
                    <div class="meta-label">Período</div>
                    <div class="meta-value">{{ $payload['periodo_descricao'] }}</div>
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
                    <div class="meta-value">{{ $payload['data_emissao'] }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <h2 class="section-title">Resumo Geral</h2>
        <table class="metric-grid">
            <tr>
                <td><div class="metric-card"><div class="metric-label">Funcionários</div><div class="metric-value">{{ $resumo['total_funcionarios'] }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">HE 50%</div><div class="metric-value">{{ $formatarMinutos($resumo['total_horas_extras_50_minutos']) }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">HE 100%</div><div class="metric-value metric-red">{{ $formatarMinutos($resumo['total_horas_extras_100_minutos']) }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Horas pagas</div><div class="metric-value metric-green">{{ $formatarMinutos($resumo['total_horas_pagas_minutos']) }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Saldo banco</div><div class="metric-value metric-purple">{{ $formatarMinutos($resumo['saldo_total_banco_minutos']) }}</div></div></td>
                <td><div class="metric-card"><div class="metric-label">Estimativa</div><div class="metric-value metric-cyan">R$ {{ number_format((float) $resumo['total_estimado_financeiro'], 2, ',', '.') }}</div></div></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Indicadores Consolidados</h2>
        <div class="panel">
            <table class="simple-table">
                <tbody>
                    <tr>
                        <td class="info-label">Total extras</td>
                        <td>{{ $formatarMinutos($resumo['total_extras_minutos']) }}</td>
                        <td class="info-label">Horas convertidas em folga</td>
                        <td>{{ $formatarMinutos($resumo['total_horas_convertidas_folga_minutos']) }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Dias de folga gerados</td>
                        <td>{{ $resumo['total_dias_folga_gerados'] }}</td>
                        <td class="info-label">Estimativa financeira</td>
                        <td>R$ {{ number_format((float) $resumo['total_estimado_financeiro'], 2, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Relatório Individual por Funcionário</h2>
        <div class="panel">
            <table class="data-table">
                <thead>
                    <tr>
                        @foreach ($payload['columns'] as $column)
                            <th>{{ $column['label'] }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @forelse ($payload['rows'] as $row)
                        <tr>
                            @foreach ($payload['columns'] as $column)
                                <td>{{ $row[$column['key']] ?? '-' }}</td>
                            @endforeach
                        </tr>
                    @empty
                        <tr>
                            <td colspan="{{ count($payload['columns']) }}">
                                Nenhum dado encontrado para os filtros aplicados.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Observações Finais</h2>
        <div class="text-panel">
            <ul class="notes">
                <li>Relatório gerado automaticamente pelo TechOS Flow para acompanhamento gerencial das horas extras.</li>
                <li>Os cálculos respeitam jornada padrão, adicional de 50% e 100%, limite mensal remunerado e banco de folgas.</li>
                <li>Recomenda-se validar o resultado com a chefia imediata antes do processamento financeiro.</li>
            </ul>

            <p><strong>Total de registros:</strong> {{ count($payload['rows']) }}</p>
            <p><strong>Responsável pela emissão:</strong> {{ $responsavelEmissao }}</p>

            <div class="signature-block">
                <div class="signature-line">Assinatura/validação</div>
            </div>
        </div>
    </div>

    <table class="footer">
        <tr>
            <td>Relatório gerado automaticamente pelo TechOS Flow.</td>
            <td class="footer-right">Documento administrativo interno</td>
        </tr>
    </table>
</div>
</body>
</html>
