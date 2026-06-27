<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrdemServico extends Model
{
    use HasUuids;

    protected $table = 'ordem_servicos';

    protected $fillable = [
        'numero',
        'tipo',
        'nome_cliente',
        'status',
        'prioridade',
        'data_abertura',
        'data_encerramento',
        'descricao',
        'observacoes',
        'motivo_nao_execucao',
        'endereco_id',
        'criada_por_id',
        'tecnico_responsavel_id',
        'aceite_client_operation_id',
        'encerramento_client_operation_id',
    ];

    protected $casts = [
        'data_abertura' => 'datetime',
        'data_encerramento' => 'datetime',
    ];

    public function endereco()
    {
        return $this->belongsTo(Endereco::class, 'endereco_id');
    }

    public function criadaPor()
    {
        return $this->belongsTo(User::class, 'criada_por_id');
    }

    public function execucoes()
    {
        return $this->hasMany(Execucao::class, 'os_id')->orderBy('data_inicio', 'desc');
    }

    public function anexos()
    {
        return $this->hasMany(Anexo::class, 'os_id');
    }

    public function eventos()
    {
        return $this->hasMany(OrdemServicoEvento::class, 'os_id')
            ->orderByDesc('created_at');
    }

    public function tecnicoResponsavel()
    {
        return $this->belongsTo(User::class, 'tecnico_responsavel_id');
    }
}
