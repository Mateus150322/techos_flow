<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExecucaoFuncionario extends Model
{
    use HasUuids;

    protected $table = 'execucao_funcionarios';

    protected $fillable = [
        'execucao_id',
        'funcionario_id',
        'colaborador_operacional_id',
        'data_inicio',
        'data_fim',
        'minutos_trabalhados',
        'minutos_normais',
        'minutos_extras_50',
        'minutos_extras_100',
        'aprovacao_status',
        'aprovado_por_id',
        'aprovado_em',
        'aprovacao_observacao',
    ];

    protected $casts = [
        'data_inicio' => 'datetime',
        'data_fim' => 'datetime',
        'aprovado_em' => 'datetime',
    ];

    public function execucao()
    {
        return $this->belongsTo(Execucao::class, 'execucao_id');
    }

    public function funcionario()
    {
        return $this->belongsTo(User::class, 'funcionario_id');
    }

    public function colaboradorOperacional()
    {
        return $this->belongsTo(ColaboradorOperacional::class, 'colaborador_operacional_id');
    }

    public function aprovador()
    {
        return $this->belongsTo(User::class, 'aprovado_por_id');
    }

    public function participanteId(): ?string
    {
        return $this->funcionario_id ?: $this->colaborador_operacional_id;
    }

    public function participanteNome(): string
    {
        return $this->funcionario?->name
            ?? $this->colaboradorOperacional?->name
            ?? 'Participante';
    }

    public function participanteTipoVinculo(): string
    {
        return $this->funcionario_id ? 'usuario' : 'colaborador_operacional';
    }

    public function participanteCategoria(): string
    {
        if ($this->funcionario) {
            return $this->funcionario->role;
        }

        return 'auxiliar_tecnico';
    }

    public function participanteFuncao(): string
    {
        if ($this->funcionario) {
            return match ($this->funcionario->role) {
                'administrador' => 'Administrador',
                'tecnico' => 'Técnico',
                default => 'Usuário',
            };
        }

        return $this->colaboradorOperacional?->funcao ?: 'Auxiliar técnico';
    }

    public function participanteValorHora(): float
    {
        return (float) (
            $this->funcionario?->valor_hora
            ?? $this->colaboradorOperacional?->valor_hora
            ?? 0
        );
    }
}
