<?php

namespace App\Services\HorasExtras;

use App\Models\Feriado;
use Carbon\CarbonImmutable;

class FeriadoService
{
    /**
     * @var array<string, array<string, array<string, mixed>>>
     */
    private array $cache = [];

    public function isFeriado(
        CarbonImmutable $date,
        ?string $estado = null,
        ?string $municipio = null
    ): bool {
        return $this->classificarData($date, $estado, $municipio) !== null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function classificarData(
        CarbonImmutable $date,
        ?string $estado = null,
        ?string $municipio = null
    ): ?array {
        $datas = $this->listarDatasEspeciaisPorAno($date->year, $estado, $municipio);

        return $datas[$date->toDateString()] ?? null;
    }

    /**
     * @return array<string, string>
     */
    public function listarFeriadosPorAno(
        int $ano,
        ?string $estado = null,
        ?string $municipio = null
    ): array {
        return collect($this->listarDatasEspeciaisPorAno($ano, $estado, $municipio))
            ->filter(fn (array $data) => ($data['tipo'] ?? 'feriado') === 'feriado')
            ->map(fn (array $data) => (string) $data['nome'])
            ->all();
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function listarDatasEspeciaisPorAno(
        int $ano,
        ?string $estado = null,
        ?string $municipio = null
    ): array {
        $cacheKey = implode('|', [
            $ano,
            strtoupper((string) $estado),
            mb_strtolower((string) $municipio),
        ]);

        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }

        $nacionais = $this->feriadosNacionais($ano);
        $configuraveis = Feriado::query()
            ->where(function ($query) use ($ano) {
                $query
                    ->whereYear('data', $ano)
                    ->orWhere('recorrente', true);
            })
            ->where('ativo', true)
            ->where(function ($query) use ($estado, $municipio) {
                $query->where('escopo', 'nacional')
                    ->orWhere('escopo', 'interno')
                    ->orWhere(function ($scopeQuery) use ($estado) {
                        $scopeQuery->where('escopo', 'estadual');

                        if ($estado) {
                            $scopeQuery->where('estado', strtoupper($estado));
                        }
                    })
                    ->orWhere(function ($scopeQuery) use ($estado, $municipio) {
                        $scopeQuery->where('escopo', 'municipal');

                        if ($estado) {
                            $scopeQuery->where('estado', strtoupper($estado));
                        }

                        if ($municipio) {
                            $scopeQuery->whereRaw('LOWER(municipio) = ?', [mb_strtolower($municipio)]);
                        }
                    });
            })
            ->get()
            ->filter(fn (Feriado $feriado) => $feriado->recorrente || (int) $feriado->data->year === $ano)
            ->mapWithKeys(function (Feriado $feriado) use ($ano) {
                $data = $feriado->recorrente
                    ? CarbonImmutable::create($ano, (int) $feriado->data->month, (int) $feriado->data->day)
                    : CarbonImmutable::parse($feriado->data);

                return [
                    $data->toDateString() => [
                        'nome' => $feriado->nome,
                        'tipo' => $feriado->tipo ?: 'feriado',
                        'escopo' => $feriado->escopo,
                        'percentual_hora_extra' => (int) $feriado->percentual_hora_extra,
                        'recorrente' => (bool) $feriado->recorrente,
                    ],
                ];
            })
            ->all();

        return $this->cache[$cacheKey] = array_merge($nacionais, $configuraveis);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function feriadosNacionais(int $ano): array
    {
        return collect([
            [1, 1, 'Confraternizacao Universal'],
            [4, 21, 'Tiradentes'],
            [5, 1, 'Dia do Trabalhador'],
            [9, 7, 'Independencia do Brasil'],
            [10, 12, 'Nossa Senhora Aparecida'],
            [11, 2, 'Finados'],
            [11, 15, 'Proclamacao da Republica'],
            [11, 20, 'Dia Nacional de Zumbi e da Consciencia Negra'],
            [12, 25, 'Natal'],
        ])->mapWithKeys(fn (array $feriado) => [
            CarbonImmutable::create($ano, $feriado[0], $feriado[1])->toDateString() => [
                'nome' => $feriado[2],
                'tipo' => 'feriado',
                'escopo' => 'nacional',
                'percentual_hora_extra' => 100,
                'recorrente' => true,
            ],
        ])->all();
    }
}
