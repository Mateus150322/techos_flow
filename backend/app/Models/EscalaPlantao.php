<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EscalaPlantao extends Model
{
    use HasUuids;

    protected $table = 'escalas_plantoes';

    protected $fillable = [
        'funcionario_id',
        'colaborador_operacional_id',
        'descricao',
        'funcao_escala',
        'data_inicio',
        'data_fim',
        'ativo',
        'observacao',
    ];

    protected $casts = [
        'data_inicio' => 'datetime',
        'data_fim' => 'datetime',
        'ativo' => 'boolean',
    ];

    public function funcionario()
    {
        return $this->belongsTo(User::class, 'funcionario_id');
    }

    public function colaboradorOperacional()
    {
        return $this->belongsTo(ColaboradorOperacional::class, 'colaborador_operacional_id');
    }

    public function participanteId(): ?string
    {
        return $this->funcionario_id ?: $this->colaborador_operacional_id;
    }

    public function participanteTipoVinculo(): string
    {
        return $this->funcionario_id ? 'usuario' : 'colaborador_operacional';
    }

    public function participanteNome(): string
    {
        return $this->funcionario?->name
            ?? $this->colaboradorOperacional?->name
            ?? 'Participante';
    }
}
