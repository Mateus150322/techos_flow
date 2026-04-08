<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Anexo;
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnexoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    public function store(Request $request, string $id)
    {
        $request->validate([
            'arquivo' => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,csv,txt|max:5120',
            'tipo' => 'nullable|string|max:50',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'precisao_metros' => 'nullable|numeric|min:0',
            'geolocalizacao_capturada_em' => 'nullable|date',
            'endereco_capturado' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

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
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'precisao_metros' => $request->input('precisao_metros'),
            'geolocalizacao_capturada_em' => $request->input('geolocalizacao_capturada_em'),
            'endereco_capturado' => $request->input('endereco_capturado'),
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
                'latitude' => $anexo->latitude,
                'longitude' => $anexo->longitude,
                'precisao_metros' => $anexo->precisao_metros,
                'geolocalizacao_capturada_em' => optional($anexo->geolocalizacao_capturada_em)->toISOString(),
                'endereco_capturado' => $anexo->endereco_capturado,
            ],
        ], 201);
    }

}
