<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Anexo extends Model
{
    use HasUuids;

    protected $table = 'anexos';

    protected $fillable = [
        'os_id',
        'caminho',
        'tipo',
        'submetido_por_id',
        'criado_em',
    ];

    public $timestamps = true;

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->caminho);
    }

    public function ordemServico()
    {
        return $this->belongsTo(OrdemServico::class, 'os_id');
    }

    public function submetidoPor()
    {
        return $this->belongsTo(User::class, 'submetido_por_id');
    }
}