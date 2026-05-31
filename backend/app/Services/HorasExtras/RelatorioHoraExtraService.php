<?php

namespace App\Services\HorasExtras;

use App\Models\ExecucaoFuncionario;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class RelatorioHoraExtraService
{
    public function __construct(
        private readonly HoraExtraService $horaExtraService
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function build(array $filters): array
    {
        [$inicio, $fim] = $this->resolvePeriodo($filters);
        $participanteId = $filters['funcionario_id'] ?? $filters['participante_id'] ?? null;

        $query = ExecucaoFuncionario::query()
            ->with(['funcionario', 'colaboradorOperacional', 'execucao.ordemServico.endereco'])
            ->where(function (Builder $builder) {
                $builder
                    ->whereNotNull('funcionario_id')
                    ->orWhereNotNull('colaborador_operacional_id');
            })
            ->orderBy('data_inicio');

        if (is_string($participanteId) && $participanteId !== '') {
            $query->where(function (Builder $builder) use ($participanteId) {
                $builder
                    ->where('funcionario_id', $participanteId)
                    ->orWhere('colaborador_operacional_id', $participanteId);
            });
        }

        if ($fim) {
            $query->where('data_inicio', '<=', $fim->endOfDay());
        }

        $registros = $query->get();
        $linhas = $this->consolidarLinhas($registros, $inicio, $fim);

        $ordenadas = collect($linhas)
            ->sortBy([
                ['funcionario_nome', 'asc'],
            ])
            ->values();

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $total = $ordenadas->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min($page, $lastPage);
        $data = $ordenadas->forPage($page, $perPage)->values();

        return [
            'resumo' => $this->buildResumo($ordenadas),
            'indicadores' => [
                'top_funcionarios' => $this->topFuncionarios($ordenadas),
            ],
            'funcionarios' => $this->listarFuncionariosFiltro($registros),
            'rows' => $data,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => $lastPage,
                'total' => $total,
            ],
            'periodo_descricao' => $this->descricaoPeriodo($inicio, $fim, $filters),
            'data_emissao' => now()->format('d/m/Y H:i'),
        ];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function buildExportPayload(array $filters): array
    {
        $payload = $this->build(array_merge($filters, [
            'page' => 1,
            'per_page' => 10000,
        ]));

        return [
            'title' => 'Relatório de Horas Extras',
            'columns' => [
                ['key' => 'funcionario_nome', 'label' => 'Participante'],
                ['key' => 'funcao', 'label' => 'Função'],
                ['key' => 'horas_extras_50', 'label' => 'Horas extras 50%'],
                ['key' => 'horas_extras_100', 'label' => 'Horas extras 100%'],
                ['key' => 'total_extras', 'label' => 'Total extras'],
                ['key' => 'horas_pagas', 'label' => 'Horas pagas'],
                ['key' => 'horas_convertidas_folga', 'label' => 'Horas convertidas em folga'],
                ['key' => 'dias_folga_gerados', 'label' => 'Dias de folga gerados'],
                ['key' => 'saldo_banco', 'label' => 'Saldo banco'],
                ['key' => 'valor_estimado', 'label' => 'Estimativa financeira'],
            ],
            'rows' => collect($payload['rows'])
                ->map(fn (array $row) => [
                    'funcionario_nome' => $row['funcionario_nome'],
                    'funcao' => $row['funcao'],
                    'horas_extras_50' => $this->formatarMinutos($row['horas_extras_50_minutos']),
                    'horas_extras_100' => $this->formatarMinutos($row['horas_extras_100_minutos']),
                    'total_extras' => $this->formatarMinutos($row['total_extras_minutos']),
                    'horas_pagas' => $this->formatarMinutos($row['horas_pagas_minutos']),
                    'horas_convertidas_folga' => $this->formatarMinutos($row['horas_convertidas_folga_minutos']),
                    'dias_folga_gerados' => (string) $row['dias_folga_gerados'],
                    'saldo_banco' => $this->formatarMinutos($row['saldo_banco_minutos']),
                    'valor_estimado' => 'R$ ' . number_format((float) $row['valor_estimado_financeiro'], 2, ',', '.'),
                ])
                ->values()
                ->all(),
            'resumo' => $payload['resumo'],
            'periodo_descricao' => $payload['periodo_descricao'],
            'data_emissao' => $payload['data_emissao'],
        ];
    }

    /**
     * @param Collection<int, ExecucaoFuncionario> $registros
     * @return array<int, array<string, mixed>>
     */
    private function consolidarLinhas(Collection $registros, ?CarbonImmutable $inicio, ?CarbonImmutable $fim): array
    {
        $entries = [];

        foreach ($registros as $registro) {
            $participanteId = $registro->participanteId();

            if (! $participanteId) {
                continue;
            }

            $periodoInicio = CarbonImmutable::parse($registro->data_inicio);
            $periodoFim = CarbonImmutable::parse($registro->data_fim);
            $segmentos = $this->horaExtraService->quebrarPorDia(
                $periodoInicio,
                $periodoFim,
                $registro->execucao?->ordemServico?->endereco?->estado,
                $registro->execucao?->ordemServico?->endereco?->cidade
            );

            foreach ($segmentos as $segmento) {
                $data = CarbonImmutable::parse($segmento['data']);
                $entries[] = [
                    'participante_key' => $registro->participanteTipoVinculo() . ':' . $participanteId,
                    'funcionario_id' => $participanteId,
                    'funcionario_nome' => $registro->participanteNome(),
                    'tipo_vinculo' => $registro->participanteTipoVinculo(),
                    'role' => $registro->participanteCategoria(),
                    'funcao' => $registro->participanteFuncao(),
                    'valor_hora' => $registro->participanteValorHora(),
                    'data' => $data,
                    'competencia' => $data->format('Y-m'),
                    'in_selected_range' => $this->estaNoPeriodoSelecionado($data, $inicio, $fim),
                    'minutos_extras_50' => (int) $segmento['minutos_extras_50'],
                    'minutos_extras_100' => (int) $segmento['minutos_extras_100'],
                ];
            }
        }

        $porFuncionario = collect($entries)->groupBy('participante_key');
        $linhas = [];

        foreach ($porFuncionario as $itemsFuncionario) {
            $carryBanco = 0;
            $temSelecionado = false;
            $primeiro = $itemsFuncionario->first();

            $linha = [
                'funcionario_id' => (string) ($primeiro['funcionario_id'] ?? ''),
                'funcionario_nome' => (string) ($primeiro['funcionario_nome'] ?? 'Participante'),
                'tipo_vinculo' => (string) ($primeiro['tipo_vinculo'] ?? 'usuario'),
                'role' => (string) ($primeiro['role'] ?? 'tecnico'),
                'funcao' => (string) ($primeiro['funcao'] ?? 'Participante'),
                'horas_extras_50_minutos' => 0,
                'horas_extras_100_minutos' => 0,
                'total_extras_minutos' => 0,
                'horas_pagas_minutos' => 0,
                'horas_convertidas_folga_minutos' => 0,
                'dias_folga_gerados' => 0,
                'saldo_banco_minutos' => 0,
                'valor_estimado_financeiro' => 0.0,
            ];

            foreach ($itemsFuncionario->groupBy('competencia')->sortKeys() as $entriesCompetencia) {
                $totalCompetencia = (int) $entriesCompetencia
                    ->sum(fn (array $entry) => $entry['minutos_extras_50'] + $entry['minutos_extras_100']);
                $minutosPagosCompetencia = min(
                    $totalCompetencia,
                    HoraExtraService::MINUTOS_LIMITE_REMUNERADO_MENSAL
                );
                $restantePago = $minutosPagosCompetencia;

                foreach ($entriesCompetencia->sortBy('data')->values() as $entry) {
                    $totalEntry = $entry['minutos_extras_50'] + $entry['minutos_extras_100'];
                    $minutosPagosEntry = min($totalEntry, $restantePago);
                    $restantePago -= $minutosPagosEntry;

                    $proporcaoPago = $totalEntry > 0 ? $minutosPagosEntry / $totalEntry : 0.0;
                    $minutosPagos50 = (int) round($entry['minutos_extras_50'] * $proporcaoPago);
                    $minutosPagos50 = min($minutosPagos50, $minutosPagosEntry);
                    $minutosPagos100 = $minutosPagosEntry - $minutosPagos50;
                    $minutosExcedentes = $totalEntry - $minutosPagosEntry;

                    $availableBank = $carryBanco + $minutosExcedentes;
                    $diasGerados = intdiv($availableBank, HoraExtraService::MINUTOS_POR_DIA_FOLGA);
                    $carryBanco = $availableBank % HoraExtraService::MINUTOS_POR_DIA_FOLGA;

                    if (! $entry['in_selected_range']) {
                        continue;
                    }

                    $temSelecionado = true;
                    $linha['horas_extras_50_minutos'] += $entry['minutos_extras_50'];
                    $linha['horas_extras_100_minutos'] += $entry['minutos_extras_100'];
                    $linha['total_extras_minutos'] += $totalEntry;
                    $linha['horas_pagas_minutos'] += $minutosPagosEntry;
                    $linha['horas_convertidas_folga_minutos'] += $minutosExcedentes;
                    $linha['dias_folga_gerados'] += $diasGerados;
                    $linha['valor_estimado_financeiro'] += $this->calcularFinanceiro(
                        $minutosPagos50,
                        $minutosPagos100,
                        (float) $entry['valor_hora']
                    );
                }
            }

            if ($temSelecionado) {
                $linha['saldo_banco_minutos'] = $carryBanco;
                $linhas[] = $linha;
            }
        }

        return $linhas;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildResumo(Collection $rows): array
    {
        return [
            'total_funcionarios' => $rows->count(),
            'total_horas_extras_50_minutos' => (int) $rows->sum('horas_extras_50_minutos'),
            'total_horas_extras_100_minutos' => (int) $rows->sum('horas_extras_100_minutos'),
            'total_extras_minutos' => (int) $rows->sum('total_extras_minutos'),
            'total_horas_pagas_minutos' => (int) $rows->sum('horas_pagas_minutos'),
            'total_horas_convertidas_folga_minutos' => (int) $rows->sum('horas_convertidas_folga_minutos'),
            'total_dias_folga_gerados' => (int) $rows->sum('dias_folga_gerados'),
            'saldo_total_banco_minutos' => (int) $rows->sum('saldo_banco_minutos'),
            'total_estimado_financeiro' => round((float) $rows->sum('valor_estimado_financeiro'), 2),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function topFuncionarios(Collection $rows): array
    {
        return $rows
            ->sortByDesc('total_extras_minutos')
            ->take(5)
            ->map(fn (array $row) => [
                'funcionario_id' => $row['funcionario_id'],
                'funcionario_nome' => $row['funcionario_nome'],
                'funcao' => $row['funcao'],
                'total_extras_minutos' => $row['total_extras_minutos'],
            ])
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, ExecucaoFuncionario> $registros
     * @return array<int, array<string, string>>
     */
    private function listarFuncionariosFiltro(Collection $registros): array
    {
        return $registros
            ->map(function (ExecucaoFuncionario $registro) {
                $id = $registro->participanteId();

                if (! $id) {
                    return null;
                }

                return [
                    'key' => $registro->participanteTipoVinculo() . ':' . $id,
                    'id' => $id,
                    'name' => $registro->participanteNome(),
                    'role' => $registro->participanteCategoria(),
                    'funcao' => $registro->participanteFuncao(),
                    'tipo_vinculo' => $registro->participanteTipoVinculo(),
                ];
            })
            ->filter()
            ->unique('key')
            ->sortBy('name')
            ->values()
            ->map(fn (array $participante) => [
                'id' => $participante['id'],
                'name' => $participante['name'],
                'role' => $participante['role'],
                'funcao' => $participante['funcao'],
                'tipo_vinculo' => $participante['tipo_vinculo'],
            ])
            ->all();
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{0:?CarbonImmutable,1:?CarbonImmutable}
     */
    private function resolvePeriodo(array $filters): array
    {
        if (! empty($filters['mes']) && ! empty($filters['ano'])) {
            $inicio = CarbonImmutable::create(
                (int) $filters['ano'],
                (int) $filters['mes'],
                1
            )->startOfDay();

            return [$inicio, $inicio->endOfMonth()->endOfDay()];
        }

        $inicio = ! empty($filters['data_inicio'])
            ? CarbonImmutable::parse((string) $filters['data_inicio'])->startOfDay()
            : null;

        $fim = ! empty($filters['data_fim'])
            ? CarbonImmutable::parse((string) $filters['data_fim'])->endOfDay()
            : null;

        return [$inicio, $fim];
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function descricaoPeriodo(?CarbonImmutable $inicio, ?CarbonImmutable $fim, array $filters): string
    {
        if (! empty($filters['mes']) && ! empty($filters['ano'])) {
            return sprintf('%02d/%04d', (int) $filters['mes'], (int) $filters['ano']);
        }

        if ($inicio && $fim) {
            return $inicio->format('d/m/Y') . ' a ' . $fim->format('d/m/Y');
        }

        if ($inicio) {
            return 'A partir de ' . $inicio->format('d/m/Y');
        }

        if ($fim) {
            return 'Até ' . $fim->format('d/m/Y');
        }

        return 'Todo o período';
    }

    private function estaNoPeriodoSelecionado(
        CarbonImmutable $data,
        ?CarbonImmutable $inicio,
        ?CarbonImmutable $fim
    ): bool {
        if ($inicio && $data->lessThan($inicio->startOfDay())) {
            return false;
        }

        if ($fim && $data->greaterThan($fim->endOfDay())) {
            return false;
        }

        return true;
    }

    private function calcularFinanceiro(int $minutos50, int $minutos100, float $valorHora): float
    {
        $hora50 = ($minutos50 / 60) * $valorHora * 1.5;
        $hora100 = ($minutos100 / 60) * $valorHora * 2.0;

        return round($hora50 + $hora100, 2);
    }

    private function formatarMinutos(int $minutos): string
    {
        $horas = intdiv($minutos, 60);
        $resto = $minutos % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }
}
