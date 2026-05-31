<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Relatorios\OrdemServicoRelatorioService;
use App\Services\Relatorios\RelatorioExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Spatie\LaravelPdf\PdfBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RelatorioController extends Controller
{
    public function ordensServico(
        Request $request,
        OrdemServicoRelatorioService $relatorioService
    ): JsonResponse {
        $payload = $relatorioService->buildPayload($this->validatedFilters($request));

        return response()->json([
            'tipos' => $payload['tipos'],
            'tecnicos' => $payload['tecnicos'],
            'resumo' => $payload['resumo'],
            'resumoOperacional' => $payload['resumoOperacional'],
            'gargalosOperacionais' => $payload['gargalosOperacionais'],
            'filaOperacional' => $payload['filaOperacional'],
            'cargaTecnicos' => $payload['cargaTecnicos'],
            'metricasOperacionais' => $payload['metricasOperacionais'],
            'statusResumo' => $payload['statusResumo'],
            'produtividadeTecnicos' => $payload['produtividadeTecnicos'],
            'tiposMaisFrequentes' => $payload['tiposMaisFrequentes'],
            'resumoTiposStatus' => $payload['resumoTiposStatus'],
            'resumoTecnicosOperacional' => $payload['resumoTecnicosOperacional'],
            'reportDefinition' => $payload['reportDefinition'],
            'reportPagination' => $payload['reportPagination'],
            'atividadeRecente' => $payload['atividadeRecente'],
            'periodoDescricao' => $payload['periodoDescricao'],
            'filtrosDescricao' => $payload['filtrosDescricao'],
            'dataEmissao' => $payload['dataEmissao'],
        ]);
    }

    public function exportOrdensServico(
        Request $request,
        string $format,
        OrdemServicoRelatorioService $relatorioService,
        RelatorioExportService $exportService
    ): Response|StreamedResponse|PdfBuilder {
        $filters = $this->validatedFilters($request);

        if ($format === 'csv') {
            $definition = $relatorioService->describeReport($filters);

            return $exportService->streamCsv(
                $definition['title'],
                $definition['columns'],
                fn (callable $writeRow) => $relatorioService->streamCsvRows($filters, $writeRow)
            );
        }

        $previewPayload = $relatorioService->buildPayload($filters);
        $exportService->ensureExportWithinLimits($format, $previewPayload['reportPagination']['total']);

        $payload = $relatorioService->buildPayload($filters, true);

        if ($format === 'pdf') {
            return $exportService->buildPdf($payload, $request->user()?->name ?? 'Sistema');
        }

        $exported = $exportService->export($format, $payload, $request->user()?->name ?? 'Sistema');

        return response($exported['content'], 200, [
            'Content-Type' => $exported['contentType'],
            'Content-Disposition' => 'attachment; filename="' . $exported['fileName'] . '"',
        ]);
    }

    private function validatedFilters(Request $request): array
    {
        if ($request->input('tecnico_id') === 'todos') {
            $request->merge(['tecnico_id' => null]);
        }

        return $request->validate([
            'tipo_relatorio' => 'nullable|in:operacional,geral,status,produtividade,tipo,periodo',
            'status' => 'nullable|in:aberta,em_execucao,finalizada,nao_executada,cancelada,todos',
            'tipo' => 'nullable|string|max:255',
            'prioridade' => 'nullable|in:1,2,3,todas',
            'tecnico_id' => 'nullable|uuid',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date|after_or_equal:data_inicio',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);
    }
}
