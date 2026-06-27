<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Feriado extends Model
{
    use HasUuids;

    protected $fillable = [
        'nome',
        'data',
        'tipo',
        'escopo',
        'estado',
        'municipio',
        'percentual_hora_extra',
        'recorrente',
        'observacao',
        'ativo',
    ];

    protected $casts = [
        'data' => 'date',
        'percentual_hora_extra' => 'integer',
        'recorrente' => 'boolean',
        'ativo' => 'boolean',
    ];
}
