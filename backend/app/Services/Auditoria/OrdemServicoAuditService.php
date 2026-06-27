<?php

namespace App\Services\Auditoria;

use App\Models\OrdemServico;
use App\Models\OrdemServicoEvento;
use App\Models\User;

class OrdemServicoAuditService
{
    /**
     * @param  array<string, mixed>|null  $dadosAnteriores
     * @param  array<string, mixed>|null  $dadosNovos
     */
    public function registrar(
        OrdemServico $ordemServico,
        ?User $usuario,
        string $evento,
        ?string $descricao = null,
        ?array $dadosAnteriores = null,
        ?array $dadosNovos = null,
        ?string $clientOperationId = null
    ): OrdemServicoEvento {
        if ($clientOperationId !== null) {
            $existente = OrdemServicoEvento::query()
                ->where('evento', $evento)
                ->where('client_operation_id', $clientOperationId)
                ->first();

            if ($existente) {
                return $existente;
            }
        }

        return OrdemServicoEvento::query()->create([
            'os_id' => $ordemServico->id,
            'usuario_id' => $usuario?->id,
            'evento' => $evento,
            'descricao' => $descricao,
            'dados_anteriores' => $dadosAnteriores,
            'dados_novos' => $dadosNovos,
            'client_operation_id' => $clientOperationId,
        ]);
    }
}
