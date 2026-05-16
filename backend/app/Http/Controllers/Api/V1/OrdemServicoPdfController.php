<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrdemServico;
use App\Services\Relatorios\OrdemServicoDetalhadaPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelPdf\PdfBuilder;

class OrdemServicoPdfController extends Controller
{
    public function show(
        Request $request,
        string $id,
        OrdemServicoDetalhadaPdfService $pdfService
    ): JsonResponse|PdfBuilder {
        $user = $request->user();
        $ordemServico = OrdemServico::query()->findOrFail($id);

        if (! in_array($user->role, ['atendente', 'tecnico', 'administrador'], true)) {
            return response()->json([
                'message' => 'Acesso negado ao relatório solicitado.',
            ], 403);
        }

        if ($user->role === 'tecnico') {
            $osDisponivel = $ordemServico->status === 'aberta' && ! $ordemServico->tecnico_responsavel_id;
            $tecnicoResponsavel = $ordemServico->tecnico_responsavel_id === $user->id;

            if (! $osDisponivel && ! $tecnicoResponsavel) {
                return response()->json([
                    'message' => 'Acesso negado ao relatório solicitado.',
                ], 403);
            }
        }

        return $pdfService->buildPdf(
            $ordemServico,
            $user?->name ?? 'Sistema',
            $user?->role === 'administrador'
        );
    }
}
