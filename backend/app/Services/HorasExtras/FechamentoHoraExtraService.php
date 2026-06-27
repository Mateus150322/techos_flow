<?php

namespace App\Services\HorasExtras;

use App\Models\ExecucaoFuncionario;
use App\Models\FechamentoHoraExtra;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class FechamentoHoraExtraService
{
    public function competencia(int $ano, int $mes): CarbonImmutable
    {
        return CarbonImmutable::create($ano, $mes, 1)->startOfDay();
    }

    public function buscar(int $ano, int $mes): ?FechamentoHoraExtra
    {
        return FechamentoHoraExtra::query()
            ->with('fechadoPor:id,name')
            ->whereDate('competencia', $this->competencia($ano, $mes)->toDateString())
            ->first();
    }

    public function assertPeriodoAberto(CarbonImmutable $inicio, CarbonImmutable $fim): void
    {
        if ($fim->lessThan($inicio)) {
            return;
        }

        $cursor = $inicio->startOfMonth();
        $fimMes = $fim->startOfMonth();

        while ($cursor->lessThanOrEqualTo($fimMes)) {
            $fechamento = $this->buscar($cursor->year, $cursor->month);

            if ($fechamento) {
                throw ValidationException::withMessages([
                    'data_inicio' => 'A competencia '.$cursor->format('m/Y').' ja esta fechada para horas extras.',
                ]);
            }

            $cursor = $cursor->addMonth();
        }
    }

    public function fechar(int $ano, int $mes, User $admin, ?string $observacao = null): FechamentoHoraExtra
    {
        $competencia = $this->competencia($ano, $mes);
        $pendentes = $this->contarPendencias($ano, $mes);

        if ($pendentes > 0) {
            throw ValidationException::withMessages([
                'competencia' => 'A competencia ainda possui horas extras pendentes de aprovacao.',
            ]);
        }

        return FechamentoHoraExtra::query()->updateOrCreate(
            ['competencia' => $competencia->toDateString()],
            [
                'fechado_por_id' => $admin->id,
                'fechado_em' => now(),
                'observacao' => $observacao,
            ]
        )->load('fechadoPor:id,name');
    }

    public function reabrir(FechamentoHoraExtra $fechamento): void
    {
        $fechamento->delete();
    }

    public function contarPendencias(int $ano, int $mes): int
    {
        [$inicio, $fim] = $this->periodoMensal($ano, $mes);

        return ExecucaoFuncionario::query()
            ->whereBetween('data_inicio', [$inicio, $fim])
            ->where('aprovacao_status', 'pendente')
            ->where(function ($query) {
                $query
                    ->where('minutos_extras_50', '>', 0)
                    ->orWhere('minutos_extras_100', '>', 0);
            })
            ->count();
    }

    /**
     * @return array{0:CarbonImmutable,1:CarbonImmutable}
     */
    public function periodoMensal(int $ano, int $mes): array
    {
        $inicio = $this->competencia($ano, $mes);

        return [$inicio, $inicio->endOfMonth()->endOfDay()];
    }
}
