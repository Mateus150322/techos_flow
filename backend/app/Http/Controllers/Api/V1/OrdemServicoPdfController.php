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

        if ($user->role !== 'administrador') {
            return response()->json([
                'message' => 'Acesso negado ao relatório solicitado.',
            ], 403);
        }

        return $pdfService->buildPdf(
            $ordemServico,
            $user?->name ?? 'Sistema',
            true
        );
    }
}
