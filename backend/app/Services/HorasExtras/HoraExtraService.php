<?php

namespace App\Services\HorasExtras;

use App\Models\Execucao;
use App\Models\ExecucaoFuncionario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class HoraExtraService
{
    public const MINUTOS_LIMITE_REMUNERADO_MENSAL = 48 * 60;
    public const MINUTOS_POR_DIA_FOLGA = 8 * 60;

    public function __construct(
        private readonly FeriadoService $feriadoService
    ) {
    }

    /**
     * @param array<int, array<string, mixed>> $participantes
     * @return \Illuminate\Support\Collection<int, \App\Models\ExecucaoFuncionario>
     */
    public function registrarFuncionariosExecucao(Execucao $execucao, array $participantes): Collection
    {
        $ordem = $execucao->ordemServico;
        $estado = $ordem?->endereco?->estado;
        $municipio = $ordem?->endereco?->cidade;

        $normalizados = $this->normalizarParticipantes($execucao, $participantes);

        $execucao->execucaoFuncionarios()->delete();

        return collect($normalizados)->map(function (array $participante) use ($execucao, $estado, $municipio) {
            $inicio = CarbonImmutable::parse($participante['data_inicio']);
            $fim = CarbonImmutable::parse($participante['data_fim']);
            $metricas = $this->calcularIntervalo($inicio, $fim, $estado, $municipio);

            return ExecucaoFuncionario::query()->create([
                'execucao_id' => $execucao->id,
                'funcionario_id' => $participante['funcionario_id'],
                'colaborador_operacional_id' => $participante['colaborador_operacional_id'],
                'data_inicio' => $inicio,
                'data_fim' => $fim,
                'minutos_trabalhados' => $metricas['minutos_trabalhados'],
                'minutos_normais' => $metricas['minutos_normais'],
                'minutos_extras_50' => $metricas['minutos_extras_50'],
                'minutos_extras_100' => $metricas['minutos_extras_100'],
            ]);
        });
    }

    /**
     * @return array{
     *   minutos_trabalhados:int,
     *   minutos_normais:int,
     *   minutos_extras_50:int,
     *   minutos_extras_100:int,
     *   minutos_extras_total:int,
     *   diario:array<int, array<string, mixed>>
     * }
     */
    public function calcularIntervalo(
        CarbonImmutable $inicio,
        CarbonImmutable $fim,
        ?string $estado = null,
        ?string $municipio = null
    ): array {
        $diario = $this->quebrarPorDia($inicio, $fim, $estado, $municipio);

        return [
            'minutos_trabalhados' => array_sum(array_column($diario, 'minutos_trabalhados')),
            'minutos_normais' => array_sum(array_column($diario, 'minutos_normais')),
            'minutos_extras_50' => array_sum(array_column($diario, 'minutos_extras_50')),
            'minutos_extras_100' => array_sum(array_column($diario, 'minutos_extras_100')),
            'minutos_extras_total' => array_sum(array_column($diario, 'minutos_extras_total')),
            'diario' => $diario,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function quebrarPorDia(
        CarbonImmutable $inicio,
        CarbonImmutable $fim,
        ?string $estado = null,
        ?string $municipio = null
    ): array {
        if ($fim->lessThanOrEqualTo($inicio)) {
            return [];
        }

        $segmentos = [];
        $cursor = $inicio;

        while ($cursor->lessThan($fim)) {
            $inicioDia = $cursor->startOfDay();
            $proximoDia = $inicioDia->addDay();
            $segmentoInicio = $cursor;
            $segmentoFim = $fim->lessThan($proximoDia) ? $fim : $proximoDia;

            $segmentos[] = $this->calcularTrechoDia(
                $segmentoInicio,
                $segmentoFim,
                $estado,
                $municipio
            );

            $cursor = $proximoDia;
        }

        return $segmentos;
    }

    /**
     * @param array<int, array<string, mixed>> $participantes
     * @return array<int, array<string, string|null>>
     */
    public function normalizarParticipantes(Execucao $execucao, array $participantes): array
    {
        $inicioPrincipal = CarbonImmutable::parse($execucao->data_inicio)->toISOString();
        $fimPrincipal = CarbonImmutable::parse($execucao->data_fim)->toISOString();

        $normalizados = collect($participantes)
            ->map(function (array $participante) use ($execucao) {
                $inicio = !empty($participante['data_inicio'])
                    ? CarbonImmutable::parse((string) $participante['data_inicio'])
                    : CarbonImmutable::parse($execucao->data_inicio);

                $fim = !empty($participante['data_fim'])
                    ? CarbonImmutable::parse((string) $participante['data_fim'])
                    : CarbonImmutable::parse($execucao->data_fim);

                return [
                    'funcionario_id' => isset($participante['funcionario_id']) && $participante['funcionario_id'] !== null
                        ? (string) $participante['funcionario_id']
                        : null,
                    'colaborador_operacional_id' => isset($participante['colaborador_operacional_id']) && $participante['colaborador_operacional_id'] !== null
                        ? (string) $participante['colaborador_operacional_id']
                        : null,
                    'data_inicio' => $inicio->toISOString(),
                    'data_fim' => $fim->toISOString(),
                ];
            });

        if ($normalizados->isEmpty() || !$normalizados->contains(
            fn (array $participante) => $participante['funcionario_id'] === $execucao->tecnico_id
        )) {
            $normalizados->prepend([
                'funcionario_id' => $execucao->tecnico_id,
                'colaborador_operacional_id' => null,
                'data_inicio' => $inicioPrincipal,
                'data_fim' => $fimPrincipal,
            ]);
        }

        return $normalizados
            ->unique(fn (array $participante) => $this->participantKey($participante))
            ->values()
            ->all();
    }

    /**
     * @param array<string, mixed> $participante
     */
    private function participantKey(array $participante): string
    {
        if (! empty($participante['funcionario_id'])) {
            return 'usuario:' . $participante['funcionario_id'];
        }

        return 'colaborador:' . ($participante['colaborador_operacional_id'] ?? '');
    }

    /**
     * @return array<string, mixed>
     */
    private function calcularTrechoDia(
        CarbonImmutable $inicio,
        CarbonImmutable $fim,
        ?string $estado = null,
        ?string $municipio = null
    ): array {
        $minutosTrabalhados = $inicio->diffInMinutes($fim);
        $ehFimDeSemana = $inicio->isWeekend();
        $dataEspecial = $this->feriadoService->classificarData($inicio, $estado, $municipio);

        if ($dataEspecial && (int) ($dataEspecial['percentual_hora_extra'] ?? 100) > 0) {
            return $this->calcularTrechoEspecial(
                $inicio,
                $fim,
                $minutosTrabalhados,
                (string) ($dataEspecial['tipo'] ?? 'feriado'),
                (string) ($dataEspecial['nome'] ?? 'Data especial'),
                (int) ($dataEspecial['percentual_hora_extra'] ?? 100)
            );
        }

        if ($ehFimDeSemana) {
            return $this->calcularTrechoEspecial(
                $inicio,
                $fim,
                $minutosTrabalhados,
                'fim_de_semana',
                $inicio->isSunday() ? 'Domingo' : 'Sabado',
                100
            );
        }

        $inicioDia = $inicio->startOfDay();
        $normalManhaInicio = $inicioDia->setTime(7, 0);
        $normalManhaFim = $inicioDia->setTime(12, 0);
        $normalTardeInicio = $inicioDia->setTime(14, 0);
        $normalTardeFim = $inicioDia->setTime(17, 0);

        $minutosNormais =
            $this->sobreposicaoEmMinutos($inicio, $fim, $normalManhaInicio, $normalManhaFim)
            + $this->sobreposicaoEmMinutos($inicio, $fim, $normalTardeInicio, $normalTardeFim);

        $minutosExtras50 = max(0, $minutosTrabalhados - $minutosNormais);

        return [
            'data' => $inicio->toDateString(),
            'inicio' => $inicio->toISOString(),
            'fim' => $fim->toISOString(),
            'minutos_trabalhados' => $minutosTrabalhados,
            'minutos_normais' => $minutosNormais,
            'minutos_extras_50' => $minutosExtras50,
            'minutos_extras_100' => 0,
            'minutos_extras_total' => $minutosExtras50,
            'classificacao' => 'dia_util',
            'descricao_calendario' => null,
            'percentual_hora_extra' => 50,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function calcularTrechoEspecial(
        CarbonImmutable $inicio,
        CarbonImmutable $fim,
        int $minutosTrabalhados,
        string $classificacao,
        string $descricao,
        int $percentual
    ): array {
        $minutos50 = $percentual >= 100 ? 0 : $minutosTrabalhados;
        $minutos100 = $percentual >= 100 ? $minutosTrabalhados : 0;

        return [
            'data' => $inicio->toDateString(),
            'inicio' => $inicio->toISOString(),
            'fim' => $fim->toISOString(),
            'minutos_trabalhados' => $minutosTrabalhados,
            'minutos_normais' => 0,
            'minutos_extras_50' => $minutos50,
            'minutos_extras_100' => $minutos100,
            'minutos_extras_total' => $minutos50 + $minutos100,
            'classificacao' => $classificacao,
            'descricao_calendario' => $descricao,
            'percentual_hora_extra' => $percentual,
        ];
    }

    private function sobreposicaoEmMinutos(
        CarbonImmutable $inicio,
        CarbonImmutable $fim,
        CarbonImmutable $janelaInicio,
        CarbonImmutable $janelaFim
    ): int {
        $inicioEfetivo = $inicio->greaterThan($janelaInicio) ? $inicio : $janelaInicio;
        $fimEfetivo = $fim->lessThan($janelaFim) ? $fim : $janelaFim;

        if ($fimEfetivo->lessThanOrEqualTo($inicioEfetivo)) {
            return 0;
        }

        return $inicioEfetivo->diffInMinutes($fimEfetivo);
    }
}
