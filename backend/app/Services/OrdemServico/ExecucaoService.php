<?php

namespace App\Services\OrdemServico;

use App\Models\Execucao;
use Illuminate\Support\Facades\DB;

class ExecucaoService
{
    public function registrarExecucao(array $data): Execucao
    {
        return DB::transaction(function () use ($data) {

            $execucao = Execucao::create($data);

            // Se for a primeira execução da OS, muda status automaticamente
            $total = Execucao::where('os_id', $data['os_id'])->count();

            if ($total === 1) {
                DB::table('ordem_servicos')
                    ->where('id', $data['os_id'])
                    ->update([
                        'status' => 'EM_EXECUCAO',
                        'updated_at' => now(),
                    ]);
            }

            return $execucao;
        });
    }
}
