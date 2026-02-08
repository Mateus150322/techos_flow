<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Endereco;
use App\Models\User;
use App\Models\Execucao;
use App\Models\Anexo;

class OrdemServico extends Model
{
    use HasUuids;

    protected $table = 'ordens_servico';

    protected $fillable = [
        'numero',
        'tipo',
        'status',
        'prioridade',
        'data_abertura',
        'data_encerramento',
        'descricao',
        'observacoes',
        'motivo_nao_execucao',
        'endereco_id',
        'criada_por_id'
    ];

    public function endereco()
    {
        return $this->belongsTo(Endereco::class, 'endereco_id');
    }

    public function criadaPOr()
    {
        return $this->belongsTo(User::class, 'criada_por_id');
    }

    public function execucoes()
    {
        return $this->hasMany(Execucao::class, 'os_id');
    }

    public function anexos()
    {
        return $this->hasMany(Anexo::class, 'os_id');
    }
}
    