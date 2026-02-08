<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Execucao extends Model
{
    use HasUuids;

    protected $table = 'execucaoes';

    protected $fillable = [
        'os_id',
        'tecnico_id',
        'data_inicio',
        'data_fim',
        'observacao'
    ];

    public function ordemServico()
    {
        return $this->belongsTo(OrdemServico::class, 'os_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }
}
