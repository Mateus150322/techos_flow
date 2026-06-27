<?php

namespace App\Services\HorasExtras;

use App\Models\ExecucaoFuncionario;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class HoraExtraAprovacaoService
{
    public function __construct(
        private readonly FechamentoHoraExtraService $fechamentoService
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     * @return array<string, int|string>
     */
    public function atualizarStatus(array $filters, string $status, User $admin, ?string $observacao = null): array
    {
        if (! in_array($status, ['aprovada', 'reprovada', 'pendente'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Status de aprovacao invalido.',
            ]);
        }

        [$inicio, $fim] = $this->resolvePeriodo($filters);

        if (! $inicio || ! $fim) {
            throw ValidationException::withMessages([
                'competencia' => 'Informe uma competencia mensal ou um periodo para aprovar horas extras.',
            ]);
        }

        $this->fechamentoService->assertPeriodoAberto($inicio, $fim);

        $participanteId = $filters['funcionario_id'] ?? $filters['participante_id'] ?? null;
        $query = ExecucaoFuncionario::query()
            ->whereBetween('data_inicio', [$inicio, $fim])
            ->where(function (Builder $builder) {
                $builder
                    ->where('minutos_extras_50', '>', 0)
                    ->orWhere('minutos_extras_100', '>', 0);
            });

        if (is_string($participanteId) && $participanteId !== '') {
            $query->where(function (Builder $builder) use ($participanteId) {
                $builder
                    ->where('funcionario_id', $participanteId)
                    ->orWhere('colaborador_operacional_id', $participanteId);
            });
        }

        $count = (clone $query)->count();

        $query->update([
            'aprovacao_status' => $status,
            'aprovado_por_id' => $status === 'pendente' ? null : $admin->id,
            'aprovado_em' => $status === 'pendente' ? null : now(),
            'aprovacao_observacao' => $observacao,
            'updated_at' => now(),
        ]);

        return [
            'status' => $status,
            'registros_atualizados' => $count,
        ];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{0:?CarbonImmutable,1:?CarbonImmutable}
     */
    private function resolvePeriodo(array $filters): array
    {
        if (! empty($filters['mes']) && ! empty($filters['ano'])) {
            return $this->fechamentoService->periodoMensal((int) $filters['ano'], (int) $filters['mes']);
        }

        $inicio = ! empty($filters['data_inicio'])
            ? CarbonImmutable::parse((string) $filters['data_inicio'])->startOfDay()
            : null;

        $fim = ! empty($filters['data_fim'])
            ? CarbonImmutable::parse((string) $filters['data_fim'])->endOfDay()
            : null;

        return [$inicio, $fim];
    }
}
