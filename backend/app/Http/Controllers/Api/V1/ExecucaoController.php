<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Execucao;
use App\Models\OrdemServico;
use Illuminate\Http\Request;

class ExecucaoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'data_inicio' => 'nullable|date',
            'observacao' => 'nullable|string',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if (in_array($os->status, ['finalizada', 'cancelada', 'nao_executada'], true)) {
            return response()->json([
                'message' => 'Não é possível iniciar execução para OS já encerrada.',
            ], 422);
        }

        $execucaoAberta = Execucao::query()
            ->where('os_id', $os->id)
            ->whereNull('data_fim')
            ->first();

        if ($execucaoAberta) {
            return response()->json([
                'message' => 'Já existe uma execução em andamento para esta OS.',
                'execucao' => $execucaoAberta,
            ], 422);
        }

        $execucao = Execucao::create([
            'os_id' => $os->id,
            'tecnico_id' => $user->id,
            'data_inicio' => $data['data_inicio'] ?? now(),
            'observacao' => $data['observacao'] ?? null,
        ]);

        if ($os->status === 'aberta') {
            $os->status = 'em_execucao';
            $os->save();
        }

        return response()->json([
            'execucao' => $execucao,
            'os' => $os,
        ], 201);
    }

    public function finalizar(Request $request, string $id)
    {
        $data = $request->validate([
            'execucao_id' => 'required|uuid|exists:execucoes,id',
            'data_fim' => 'nullable|date',
            'observacao' => 'nullable|string',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if ($os->status !== 'em_execucao') {
            return response()->json([
                'message' => 'A OS precisa estar em execução para ser finalizada.',
            ], 422);
        }

        $execucao = Execucao::query()
            ->where('id', $data['execucao_id'])
            ->where('os_id', $os->id)
            ->where('tecnico_id', $user->id)
            ->firstOrFail();

        if ($execucao->data_fim) {
            return response()->json([
                'message' => 'Esta execução já foi finalizada.',
            ], 422);
        }

        $execucao->data_fim = $data['data_fim'] ?? now();

        if (! empty($data['observacao'])) {
            $execucao->observacao = $data['observacao'];
        }

        $execucao->save();

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
