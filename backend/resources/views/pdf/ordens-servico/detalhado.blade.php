<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>{{ $payload['titulo'] }} - {{ $payload['numero'] }}</title>
    @include('pdf.partials.document-styles')
</head>
<body>
@php
    $fotos = collect($payload['fotos'] ?? [])->pad(3, ['titulo' => 'Evidência', 'src' => null]);
    $mostrarHorasExtras = (bool) ($payload['mostrar_horas_extras'] ?? false);
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
                Operação e controle<br>
                ordens de serviço
            </td>
        </tr>
    </table>

    <h1 class="report-title">{{ $payload['titulo'] }}</h1>
    <div class="divider"></div>

    <table class="meta-card-grid">
        <tr>
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
            <td style="width:33.33%;">
                <div class="meta-card">
                    <div class="meta-label">Documento</div>
                    <div class="meta-value">Relatório técnico detalhado</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <h2 class="section-title">Detalhamento da OS</h2>

        <table class="summary-grid">
            <tr>
                <td>
                    <div class="summary-card">
                        <div class="summary-kicker">OS Nº</div>
                        <div class="summary-text blue">{{ $payload['numero'] }}</div>
                    </div>
                </td>
                <td>
                    <div class="summary-card">
                        <div class="summary-kicker">Tipo</div>
                        <div class="summary-text">{{ $payload['tipo'] }}</div>
                    </div>
                </td>
                <td>
                    <div class="summary-card">
                        <div class="summary-kicker">Status</div>
                        <div class="summary-text {{ $payload['statusTone'] }}">{{ $payload['status'] }}</div>
                    </div>
                </td>
                <td>
                    <div class="summary-card">
                        <div class="summary-kicker">Prioridade</div>
                        <div class="summary-text {{ $payload['prioridadeTone'] }}">{{ $payload['prioridade'] }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <table class="two-column-grid">
            <tr>
                <td>
                    <div class="panel">
                        <div class="panel-body">
                            <table class="info-table">
                                @foreach ($payload['linhas_esquerda'] as $linha)
                                    <tr>
                                        <td class="info-label">{{ $linha['label'] }}</td>
                                        <td class="info-value">{{ $linha['value'] }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="panel">
                        <div class="panel-body">
                            <table class="info-table">
                                @foreach ($payload['linhas_direita'] as $linha)
                                    <tr>
                                        <td class="info-label">{{ $linha['label'] }}</td>
                                        <td class="info-value">{{ $linha['value'] }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Descrição da solicitação</h2>
        <div class="text-panel">
            {{ $payload['descricaoSolicitacao'] ?: 'Sem descrição registrada para esta ordem de serviço.' }}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Execução do serviço</h2>
        <div class="text-panel">
            {{ $payload['execucaoServico'] ?: 'Sem informações de execução registradas.' }}
        </div>
    </div>

    <div class="section">
        <table class="two-column-grid">
            <tr>
                <td style="{{ $mostrarHorasExtras ? '' : 'width:100%; padding-right:0;' }}">
                    <div class="panel">
                        <div class="panel-header">Equipe participante</div>
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Função</th>
                                    <th>Horário</th>
                                    <th>Horas trabalhadas</th>
                                    <th>Hora extra</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($payload['equipe'] as $item)
                                    <tr>
                                        <td>{{ $item['nome'] }}</td>
                                        <td>{{ $item['funcao'] }}</td>
                                        <td>{{ $item['horario'] }}</td>
                                        <td>{{ $item['horas_trabalhadas'] }}</td>
                                        <td>{{ $item['hora_extra'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="5" class="placeholder-text">Nenhum participante registrado para esta execução.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </td>
                @if ($mostrarHorasExtras)
                    <td>
                        <div class="panel">
                            <div class="panel-header">Horas extras da OS</div>
                            <table class="simple-table">
                                <thead>
                                    <tr>
                                        <th>Funcionário</th>
                                        <th>Data</th>
                                        <th>Entrada</th>
                                        <th>Saída</th>
                                        <th>Horas normais</th>
                                        <th>HE 50%</th>
                                        <th>HE 100%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($payload['horas_extras'] as $item)
                                        <tr>
                                            <td>{{ $item['funcionario'] }}</td>
                                            <td>{{ $item['data'] }}</td>
                                            <td>{{ $item['entrada'] }}</td>
                                            <td>{{ $item['saida'] }}</td>
                                            <td>{{ $item['horas_normais'] }}</td>
                                            <td>{{ $item['he_50'] }}</td>
                                            <td>{{ $item['he_100'] }}</td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="7" class="placeholder-text">Nenhum cálculo de hora extra registrado para esta ordem.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                    </td>
                @endif
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Evidências / Fotos da OS</h2>
        <table class="photo-grid">
            <tr>
                @foreach ($fotos as $foto)
                    <td>
                        <div class="photo-card">
                            <p class="photo-label">{{ $foto['titulo'] }}</p>
                            <div class="photo-frame">
                                @if (!empty($foto['src']))
                                    <img src="{{ $foto['src'] }}" alt="{{ $foto['titulo'] }}">
                                @else
                                    <div class="photo-empty">Sem imagem registrada</div>
                                @endif
                            </div>
                        </div>
                    </td>
                @endforeach
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Conclusão técnica</h2>
        <div class="text-panel">
            {{ $payload['conclusaoTecnica'] ?: 'Sem conclusão técnica registrada para esta ordem de serviço.' }}
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
