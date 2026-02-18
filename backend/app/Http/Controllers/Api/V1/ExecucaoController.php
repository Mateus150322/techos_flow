<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Execucao;
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExecucaoController extends Controller
{
    /**
     * Iniciar execução (cria uma execução e muda OS para em_execucao se estiver aberta)
     */
    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'data_inicio' => 'nullable|date',
            'observacao' => 'nullable|string',
        ]);

        $os = OrdemServico::where('id', $id)->firstOrFail();

        // regra: só inicia se não estiver finalizada/cancelada
        if (in_array($os->status, ['finalizada', 'cancelada'], true)) {
            return response()->json([
                'message' => 'Não é possível iniciar execução para OS finalizada/cancelada.'
            ], 422);
        }

        $execucao = Execucao::create([
            'os_id' => $os->id,
            'tecnico_id' => Auth::id(),
            'data_inicio' => $data['data_inicio'] ?? now(),
            'observacao' => $data['observacao'] ?? null,
        ]);

        // se estiver aberta, vira em_execucao automaticamente
        if ($os->status === 'aberta') {
            $os->status = 'em_execucao';
            $os->save();
        }

        return response()->json([
            'execucao' => $execucao,
            'os' => $os,
        ], 201);
    }

    /**
     * Finalizar execução (marca data_fim e finaliza OS)
     */
    public function finalizar(Request $request, string $id)
    {
        $data = $request->validate([
            'execucao_id' => 'required|uuid|exists:execucoes,id',
            'data_fim' => 'nullable|date',
            'observacao' => 'nullable|string',
        ]);

        $os = OrdemServico::where('id', $id)->firstOrFail();

        // busca execução
        $execucao = Execucao::where('id', $data['execucao_id'])
            ->where('os_id', $os->id)
            ->firstOrFail();

        // marca fim
        $execucao->data_fim = $data['data_fim'] ?? now();
        if (!empty($data['observacao'])) {
            $execucao->observacao = $data['observacao'];
        }
        $execucao->save();

        // finaliza OS
        $os->status = 'finalizada';
        $os->data_encerramento = now();
        $os->save();

        return response()->json([
            'message' => 'Execução finalizada e OS encerrada.',
            'execucao' => $execucao,
            'os' => $os,
        ]);
    }
}
