<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\OrdemServico;

class Endereco extends Model
{
    use HasUuids;

    protected $table = 'enderecos';

    protected $fillable = [
        'rua',
        'numero',
        'bairro',
        'cidade',
        'estado',
        'cep',
        'latitude',
        'longitude'
    ];
    public function ordensServico()
    {
        return $this->hasMany(OrdemServico::class);
    }
}
