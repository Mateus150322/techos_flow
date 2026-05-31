<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ColaboradorOperacional extends Model
{
    use HasUuids;

    protected $table = 'colaboradores_operacionais';

    protected $fillable = [
        'name',
        'funcao',
        'valor_hora',
        'is_active',
    ];

    protected $attributes = [
        'funcao' => 'Auxiliar técnico',
        'is_active' => true,
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'valor_hora' => 'decimal:2',
    ];

    public function execucoesComoParticipante()
    {
        return $this->hasMany(ExecucaoFuncionario::class, 'colaborador_operacional_id');
    }
}
