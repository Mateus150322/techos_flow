<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\OrdemServico;
use App\Models\User;

trait EnsuresTecnicoResponsavel
{
    protected function ensureTecnicoResponsavel(User $user, OrdemServico $os)
    {
        if ($user->role !== 'tecnico') {
            return response()->json([
                'message' => 'Apenas técnicos podem executar esta ação.',
            ], 403);
        }

        if (!$os->tecnico_responsavel_id) {
            return response()->json([
                'message' => 'A OS precisa ser aceita por um técnico antes desta ação.',
            ], 422);
        }

        if ($os->tecnico_responsavel_id !== $user->id) {
            return response()->json([
                'message' => 'Esta OS está atribuída a outro técnico.',
            ], 403);
        }

        return null;
    }
}
