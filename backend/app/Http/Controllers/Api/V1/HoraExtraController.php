<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\HorasExtras\HoraExtraExportService;
use App\Services\HorasExtras\RelatorioHoraExtraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Spatie\LaravelPdf\PdfBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HoraExtraController extends Controller
{
    public function index(
        Request $request,
        RelatorioHoraExtraService $relatorioHoraExtraService
    ): JsonResponse {
        $payload = $relatorioHoraExtraService->build($this->validatedFilters($request));

        return response()->json([
            'resumo' => [
                ...$payload['resumo'],
                'total_horas_extras_50' => $this->formatarMinutos($payload['resumo']['total_horas_extras_50_minutos']),
                'total_horas_extras_100' => $this->formatarMinutos($payload['resumo']['total_horas_extras_100_minutos']),
                'total_extras' => $this->formatarMinutos($payload['resumo']['total_extras_minutos']),
                'total_horas_pagas' => $this->formatarMinutos($payload['resumo']['total_horas_pagas_minutos']),
                'total_horas_convertidas_folga' => $this->formatarMinutos($payload['resumo']['total_horas_convertidas_folga_minutos']),
                'saldo_total_banco' => $this->formatarMinutos($payload['resumo']['saldo_total_banco_minutos']),
            ],
            'indicadores' => [
                'top_funcionarios' => collect($payload['indicadores']['top_funcionarios'])
                    ->map(fn (array $item) => [
                        ...$item,
                        'total_extras' => $this->formatarMinutos($item['total_extras_minutos']),
                    ])
                    ->values()
                    ->all(),
            ],
            'funcionarios' => $payload['funcionarios'],
            'rows' => collect($payload['rows'])
                ->map(fn (array $row) => [
                    ...$row,
                    'horas_extras_50' => $this->formatarMinutos($row['horas_extras_50_minutos']),
                    'horas_extras_100' => $this->formatarMinutos($row['horas_extras_100_minutos']),
                    'total_extras' => $this->formatarMinutos($row['total_extras_minutos']),
                    'horas_pagas' => $this->formatarMinutos($row['horas_pagas_minutos']),
                    'horas_convertidas_folga' => $this->formatarMinutos($row['horas_convertidas_folga_minutos']),
                    'saldo_banco' => $this->formatarMinutos($row['saldo_banco_minutos']),
                ])
                ->values()
                ->all(),
            'pagination' => $payload['pagination'],
            'periodo_descricao' => $payload['periodo_descricao'],
            'data_emissao' => $payload['data_emissao'],
        ]);
    }

    public function export(
        Request $request,
        string $format,
        RelatorioHoraExtraService $relatorioHoraExtraService,
        HoraExtraExportService $horaExtraExportService
    ): Response|StreamedResponse|PdfBuilder {
        $filters = $this->validatedFilters($request);
        $payload = $relatorioHoraExtraService->buildExportPayload($filters);

        if ($format === 'csv') {
            return $horaExtraExportService->streamCsv($payload);
        }

        $horaExtraExportService->ensureExportWithinLimits($format, count($payload['rows']));

        if ($format === 'pdf') {
            return $horaExtraExportService->buildPdf(
                $payload,
                $request->user()?->name ?? 'Sistema'
            );
        }

        $exported = $horaExtraExportService->export(
            $format,
            $payload,
            $request->user()?->name ?? 'Sistema'
        );

        return response($exported['content'], 200, [
            'Content-Type' => $exported['contentType'],
            'Content-Disposition' => 'attachment; filename="' . $exported['fileName'] . '"',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedFilters(Request $request): array
    {
        $data = $request->validate([
            'funcionario_id' => ['nullable', 'uuid', 'exists:users,id'],
            'data_inicio' => ['nullable', 'date'],
            'data_fim' => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'mes' => ['nullable', 'integer', 'between:1,12'],
            'ano' => ['nullable', 'integer', 'between:2000,2100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if ((isset($data['mes']) && !isset($data['ano'])) || (!isset($data['mes']) && isset($data['ano']))) {
            abort(422, 'Informe mês e ano em conjunto para consultar a competência mensal.');
        }

        return $data;
    }

    private function formatarMinutos(int $minutos): string
    {
        $horas = intdiv($minutos, 60);
        $resto = $minutos % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }
}
