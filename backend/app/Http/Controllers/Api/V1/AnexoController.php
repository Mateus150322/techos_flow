<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Anexo;
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AnexoController extends Controller
{
    public function store(Request $request, string $id)
    {
        $request->validate([
            'arquivo' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'tipo' => 'nullable|string|max:50',
        ]);

        $os = OrdemServico::where('id', $id)->firstOrFail();

        $arquivo = $request->file('arquivo');
        $caminho = $arquivo->store('anexos', 'public');

        $tipo = $request->input('tipo');

        if (!$tipo) {
            $mime = $arquivo->getMimeType();

            if (str_starts_with($mime, 'image/')) {
                $tipo = 'foto';
            } elseif ($mime === 'application/pdf') {
                $tipo = 'pdf';
            } else {
                $tipo = 'arquivo';
            }
        }

        $anexo = Anexo::create([
            'os_id' => $os->id,
            'caminho' => $caminho,
            'tipo' => $tipo,
            'submetido_por_id' => Auth::id(),
            'criado_em' => now(),
        ]);

        return response()->json([
            'message' => 'Anexo enviado com sucesso.',
            'anexo' => [
                'id' => $anexo->id,
                'caminho' => $anexo->caminho,
                'tipo' => $anexo->tipo,
                'url' => asset('storage/' . $anexo->caminho),
            ],
        ], 201);
    }
}