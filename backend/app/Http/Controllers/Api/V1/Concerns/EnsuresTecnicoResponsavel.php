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
                'message' => 'Apenas tecnicos podem executar esta acao.',
            ], 403);
        }

        if (! $os->tecnico_responsavel_id) {
            return response()->json([
                'message' => 'A OS precisa ser aceita por um tecnico antes desta acao.',
            ], 422);
        }

        if ($os->tecnico_responsavel_id !== $user->id) {
            return response()->json([
                'message' => 'Esta OS esta atribuida a outro tecnico.',
            ], 403);
        }

        return null;
    }
}
