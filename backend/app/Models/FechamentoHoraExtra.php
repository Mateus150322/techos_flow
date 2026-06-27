<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FechamentoHoraExtra extends Model
{
    use HasUuids;

    protected $table = 'fechamentos_horas_extras';

    protected $fillable = [
        'competencia',
        'fechado_por_id',
        'fechado_em',
        'observacao',
    ];

    protected $casts = [
        'competencia' => 'date',
        'fechado_em' => 'datetime',
    ];

    public function fechadoPor()
    {
        return $this->belongsTo(User::class, 'fechado_por_id');
    }
}
