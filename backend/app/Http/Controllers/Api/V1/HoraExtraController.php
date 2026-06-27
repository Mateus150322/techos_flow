<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FechamentoHoraExtra;
use App\Services\HorasExtras\FechamentoHoraExtraService;
use App\Services\HorasExtras\HoraExtraAprovacaoService;
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
                'total_feriados' => $this->formatarMinutos($payload['resumo']['total_minutos_feriados']),
                'total_pontos_facultativos' => $this->formatarMinutos($payload['resumo']['total_minutos_pontos_facultativos']),
                'total_fins_semana' => $this->formatarMinutos($payload['resumo']['total_minutos_fins_semana']),
                'total_plantao' => $this->formatarMinutos($payload['resumo']['total_minutos_plantao']),
            ],
            'aprovacao' => $payload['aprovacao'],
            'fechamento' => $payload['fechamento'],
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
                    'horas_feriados' => $this->formatarMinutos($row['minutos_feriados']),
                    'horas_pontos_facultativos' => $this->formatarMinutos($row['minutos_pontos_facultativos']),
                    'horas_fins_semana' => $this->formatarMinutos($row['minutos_fins_semana']),
                    'horas_plantao' => $this->formatarMinutos($row['minutos_plantao']),
                ])
                ->values()
                ->all(),
            'pagination' => $payload['pagination'],
            'periodo_descricao' => $payload['periodo_descricao'],
            'data_emissao' => $payload['data_emissao'],
        ]);
    }

    public function aprovar(
        Request $request,
        HoraExtraAprovacaoService $horaExtraAprovacaoService
    ): JsonResponse {
        $this->normalizarMes($request);

        $data = $request->validate([
            'status' => ['required', 'string', 'in:pendente,aprovada,reprovada'],
            'observacao' => ['nullable', 'string', 'max:1000'],
            'funcionario_id' => ['nullable', 'uuid'],
            'participante_id' => ['nullable', 'uuid'],
            'data_inicio' => ['nullable', 'date'],
            'data_fim' => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'mes' => ['nullable', 'integer', 'between:1,12'],
            'ano' => ['nullable', 'integer', 'between:2000,2100'],
        ]);

        $payload = $horaExtraAprovacaoService->atualizarStatus(
            $data,
            $data['status'],
            $request->user(),
            $data['observacao'] ?? null
        );

        return response()->json($payload);
    }

    public function fecharCompetencia(
        Request $request,
        FechamentoHoraExtraService $fechamentoHoraExtraService
    ): JsonResponse {
        $this->normalizarMes($request);

        $data = $request->validate([
            'mes' => ['required', 'integer', 'between:1,12'],
            'ano' => ['required', 'integer', 'between:2000,2100'],
            'observacao' => ['nullable', 'string', 'max:1000'],
        ]);

        $fechamento = $fechamentoHoraExtraService->fechar(
            (int) $data['ano'],
            (int) $data['mes'],
            $request->user(),
            $data['observacao'] ?? null
        );

        return response()->json([
            'id' => $fechamento->id,
            'status' => 'fechada',
            'competencia' => $fechamento->competencia?->format('Y-m'),
            'fechado_em' => $fechamento->fechado_em?->toISOString(),
            'fechado_por' => $fechamento->fechadoPor?->name,
            'observacao' => $fechamento->observacao,
        ], 201);
    }

    public function reabrirCompetencia(
        FechamentoHoraExtra $fechamento,
        FechamentoHoraExtraService $fechamentoHoraExtraService
    ): JsonResponse {
        $fechamentoHoraExtraService->reabrir($fechamento);

        return response()->json([
            'message' => 'Competencia reaberta para ajustes.',
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
        $this->normalizarMes($request);

        $data = $request->validate([
            'funcionario_id' => ['nullable', 'uuid'],
            'participante_id' => ['nullable', 'uuid'],
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

    private function normalizarMes(Request $request): void
    {
        $mes = $request->input('mes');

        if (is_string($mes) && preg_match('/^\d{1,2}$/', $mes)) {
            $request->merge(['mes' => (int) $mes]);
        }
    }

    private function formatarMinutos(int $minutos): string
    {
        $horas = intdiv($minutos, 60);
        $resto = $minutos % 60;

        return sprintf('%dh%02d', $horas, $resto);
    }
}
