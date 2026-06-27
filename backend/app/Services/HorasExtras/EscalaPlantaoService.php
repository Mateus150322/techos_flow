<?php

namespace App\Services\HorasExtras;

use App\Models\EscalaPlantao;
use Carbon\CarbonImmutable;

class EscalaPlantaoService
{
    public function minutosEmPlantao(
        string $tipoVinculo,
        string $participanteId,
        CarbonImmutable $inicio,
        CarbonImmutable $fim
    ): int {
        if ($fim->lessThanOrEqualTo($inicio)) {
            return 0;
        }

        $query = EscalaPlantao::query()
            ->where('ativo', true)
            ->where('data_inicio', '<', $fim)
            ->where('data_fim', '>', $inicio);

        if ($tipoVinculo === 'colaborador_operacional') {
            $query->where('colaborador_operacional_id', $participanteId);
        } else {
            $query->where('funcionario_id', $participanteId);
        }

        return (int) $query->get()->sum(function (EscalaPlantao $escala) use ($fim, $inicio) {
            $escalaInicio = CarbonImmutable::parse($escala->data_inicio);
            $escalaFim = CarbonImmutable::parse($escala->data_fim);
            $sobreposicaoInicio = $inicio->greaterThan($escalaInicio) ? $inicio : $escalaInicio;
            $sobreposicaoFim = $fim->lessThan($escalaFim) ? $fim : $escalaFim;

            if ($sobreposicaoFim->lessThanOrEqualTo($sobreposicaoInicio)) {
                return 0;
            }

            return $sobreposicaoInicio->diffInMinutes($sobreposicaoFim);
        });
    }
}
