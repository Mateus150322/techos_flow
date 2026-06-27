<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrdemServicoEvento extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $table = 'ordem_servico_eventos';

    protected $fillable = [
        'os_id',
        'usuario_id',
        'evento',
        'descricao',
        'dados_anteriores',
        'dados_novos',
        'client_operation_id',
    ];

    protected $casts = [
        'dados_anteriores' => 'array',
        'dados_novos' => 'array',
        'created_at' => 'datetime',
    ];

    protected $appends = [
        'acao',
        'data',
    ];

    public function ordemServico()
    {
        return $this->belongsTo(OrdemServico::class, 'os_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function getAcaoAttribute(): string
    {
        return match ($this->evento) {
            'os_criada' => 'OS criada',
            'os_aceita' => 'OS aceita',
            'execucao_iniciada' => 'Execução iniciada',
            'execucao_finalizada' => 'Execução finalizada',
            'os_nao_executada' => 'OS não executada',
            'anexo_enviado' => 'Evidência adicionada',
            'localizacao_atualizada' => 'Localização atualizada',
            default => str_replace('_', ' ', ucfirst($this->evento)),
        };
    }

    public function getDataAttribute(): ?string
    {
        return $this->created_at?->toISOString();
    }
}
