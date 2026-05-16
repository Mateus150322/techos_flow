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
        'escopo',
        'estado',
        'municipio',
        'ativo',
    ];

    protected $casts = [
        'data' => 'date',
        'ativo' => 'boolean',
    ];
}

