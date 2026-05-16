<?php

namespace App\Services\HorasExtras;

use App\Models\Feriado;
use Carbon\CarbonImmutable;

class FeriadoService
{
    /**
     * @var array<string, array<string, string>>
     */
    private array $cache = [];

    public function isFeriado(
        CarbonImmutable $date,
        ?string $estado = null,
        ?string $municipio = null
    ): bool {
        $feriados = $this->listarFeriadosPorAno($date->year, $estado, $municipio);

        return array_key_exists($date->toDateString(), $feriados);
    }

    /**
     * @return array<string, string>
     */
    public function listarFeriadosPorAno(
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
            ->whereYear('data', $ano)
            ->where('ativo', true)
            ->where(function ($query) use ($estado, $municipio) {
                $query->where('escopo', 'nacional')
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
            ->mapWithKeys(fn (Feriado $feriado) => [
                $feriado->data->toDateString() => $feriado->nome,
            ])
            ->all();

        return $this->cache[$cacheKey] = array_merge($nacionais, $configuraveis);
    }

    /**
     * @return array<string, string>
     */
    private function feriadosNacionais(int $ano): array
    {
        return [
            CarbonImmutable::create($ano, 1, 1)->toDateString() => 'Confraternização Universal',
            CarbonImmutable::create($ano, 4, 21)->toDateString() => 'Tiradentes',
            CarbonImmutable::create($ano, 5, 1)->toDateString() => 'Dia do Trabalhador',
            CarbonImmutable::create($ano, 9, 7)->toDateString() => 'Independência do Brasil',
            CarbonImmutable::create($ano, 10, 12)->toDateString() => 'Nossa Senhora Aparecida',
            CarbonImmutable::create($ano, 11, 2)->toDateString() => 'Finados',
            CarbonImmutable::create($ano, 11, 15)->toDateString() => 'Proclamação da República',
            CarbonImmutable::create($ano, 11, 20)->toDateString() => 'Dia Nacional de Zumbi e da Consciência Negra',
            CarbonImmutable::create($ano, 12, 25)->toDateString() => 'Natal',
        ];
    }
}

