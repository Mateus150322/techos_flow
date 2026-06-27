<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Execucao extends Model
{
    use HasUuids;

    protected $table = 'execucoes';

    protected $fillable = [
        'os_id',
        'tecnico_id',
        'data_inicio',
        'data_fim',
        'observacao',
        'diagnostico',
        'procedimento',
        'material_utilizado',
        'client_operation_id',
        'finalizacao_client_operation_id',
    ];

    protected $casts = [
        'data_inicio' => 'datetime',
        'data_fim' => 'datetime',
    ];

    public function ordemServico()
    {
        return $this->belongsTo(OrdemServico::class, 'os_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function execucaoFuncionarios()
    {
        return $this->hasMany(ExecucaoFuncionario::class, 'execucao_id');
    }
}
