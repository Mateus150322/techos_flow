<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Anexo;
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

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
        $caminho = $arquivo->store('anexos', 'local');

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
            'anexo' => $this->buildAnexoPayload($anexo),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $anexo = Anexo::query()->with('ordemServico')->findOrFail($id);
        $ordemServico = $anexo->ordemServico;

        if (! $ordemServico) {
            abort(404);
        }

        if (! in_array($user->role, ['atendente', 'tecnico', 'administrador'], true)) {
            return response()->json([
                'message' => 'Acesso negado ao anexo solicitado.',
            ], 403);
        }

        $disk = $this->resolveStorageDisk($anexo->caminho);

        if (! $disk) {
            abort(404);
        }

        $fileName = basename((string) $anexo->caminho);
        $mimeType = Storage::disk($disk)->mimeType($anexo->caminho) ?: 'application/octet-stream';
        $disposition = str_starts_with($mimeType, 'image/') || $mimeType === 'application/pdf'
            ? ResponseHeaderBag::DISPOSITION_INLINE
            : ResponseHeaderBag::DISPOSITION_ATTACHMENT;
        $headers = new ResponseHeaderBag();

        return response()->file(
            Storage::disk($disk)->path($anexo->caminho),
            [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $headers->makeDisposition($disposition, $fileName),
                'Cache-Control' => 'private, no-store, max-age=0',
                'Pragma' => 'no-cache',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    private function buildAnexoPayload(Anexo $anexo): array
    {
        return [
            'id' => $anexo->id,
            'caminho' => $anexo->caminho,
            'tipo' => $anexo->tipo,
            'latitude' => $anexo->latitude,
            'longitude' => $anexo->longitude,
            'precisao_metros' => $anexo->precisao_metros,
            'geolocalizacao_capturada_em' => optional($anexo->geolocalizacao_capturada_em)->toISOString(),
            'endereco_capturado' => $anexo->endereco_capturado,
        ];
    }

    private function resolveStorageDisk(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Storage::disk('local')->exists($path)) {
            return 'local';
        }

        if (Storage::disk('public')->exists($path)) {
            return 'public';
        }

        return null;
    }
}
