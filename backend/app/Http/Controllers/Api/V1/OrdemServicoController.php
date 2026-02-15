<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller; // ✅ ESTE É O PONTO
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrdemServicoController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|string|max:100',
            'descricao' => 'required|string',
            'prioridade' => 'nullable|integer|in:1,2,3',
            'endereco_id' => 'required|uuid|exists:enderecos,id',
        ]);

        $ano = now()->year;

        $ultimo = OrdemServico::whereYear('data_abertura', $ano)
            ->orderBy('numero', 'desc')
            ->first();

        $sequencial = $ultimo
            ? (int) substr($ultimo->numero, 5) + 1
            : 1;

        $numero = sprintf('%d-%06d', $ano, $sequencial);

        $os = OrdemServico::create([
            'numero' => $numero,
            'tipo' => $data['tipo'],
            'descricao' => $data['descricao'],
            'prioridade' => $data['prioridade'] ?? 2,
            'endereco_id' => $data['endereco_id'],
            'criada_por_id' => Auth::id(),
        ]);

        return response()->json($os, 201);
    }
}
