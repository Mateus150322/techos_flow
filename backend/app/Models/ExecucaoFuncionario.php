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
        'data_inicio',
        'data_fim',
        'minutos_trabalhados',
        'minutos_normais',
        'minutos_extras_50',
        'minutos_extras_100',
    ];

    protected $casts = [
        'data_inicio' => 'datetime',
        'data_fim' => 'datetime',
    ];

    public function execucao()
    {
        return $this->belongsTo(Execucao::class, 'execucao_id');
    }

    public function funcionario()
    {
        return $this->belongsTo(User::class, 'funcionario_id');
    }
}

