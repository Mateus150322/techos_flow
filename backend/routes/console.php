<?php

use App\Models\Anexo;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('anexos:revisar-retencao {--days=365} {--limit=50}', function () {
    $days = max((int) $this->option('days'), 1);
    $limit = max((int) $this->option('limit'), 1);
    $cutoff = now()->subDays($days);

    $query = Anexo::query()
        ->with([
            'ordemServico:id,numero,status',
            'submetidoPor:id,name',
        ])
        ->where(function ($builder) use ($cutoff) {
            $builder
                ->whereNotNull('criado_em')
                ->where('criado_em', '<=', $cutoff)
                ->orWhere(function ($fallback) use ($cutoff) {
                    $fallback
                        ->whereNull('criado_em')
                        ->where('created_at', '<=', $cutoff);
                });
        })
        ->orderBy('criado_em')
        ->orderBy('created_at');

    $total = (clone $query)->count();

    $this->info("Revisão de retenção de anexos");
    $this->line("Janela analisada: {$days} dias");
    $this->line("Data limite: {$cutoff->format('d/m/Y')}");
    $this->line("Anexos elegíveis para revisão: {$total}");

    if ($total === 0) {
        $this->comment('Nenhum anexo antigo encontrado para revisão.');

        return self::SUCCESS;
    }

    $anexos = $query
        ->limit($limit)
        ->get()
        ->map(function (Anexo $anexo) {
            $enviadoEm = $anexo->criado_em ?? $anexo->created_at;

            return [
                'anexo' => $anexo->id,
                'os' => $anexo->ordemServico?->numero ?? '-',
                'tipo' => $anexo->tipo ?? 'arquivo',
                'enviado_em' => optional($enviadoEm)?->format('d/m/Y') ?? '-',
                'status_os' => $anexo->ordemServico?->status ?? '-',
                'submetido_por' => $anexo->submetidoPor?->name ?? '-',
                'geo' => $anexo->latitude !== null && $anexo->longitude !== null ? 'sim' : 'não',
            ];
        })
        ->all();

    $this->table(
        ['Anexo', 'OS', 'Tipo', 'Enviado em', 'Status OS', 'Submetido por', 'Geo'],
        $anexos
    );

    if ($total > $limit) {
        $restantes = $total - $limit;
        $this->comment("Exibindo {$limit} de {$total} anexos. Restam {$restantes} para revisão.");
    }

    $this->line(
        'Recomendação: revisar necessidade operacional, administrativa e de auditoria antes de qualquer descarte.'
    );

    return self::SUCCESS;
})->purpose('Lista anexos antigos para revisão manual de retenção');
