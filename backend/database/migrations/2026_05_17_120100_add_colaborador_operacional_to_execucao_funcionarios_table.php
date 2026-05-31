<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->uuid('colaborador_operacional_id')
                ->nullable()
                ->after('funcionario_id');
        });

        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->uuid('funcionario_id')->nullable()->change();

            $table->foreign('colaborador_operacional_id', 'exec_func_colaborador_foreign')
                ->references('id')
                ->on('colaboradores_operacionais');

            $table->unique(
                ['execucao_id', 'colaborador_operacional_id'],
                'exec_func_execucao_colaborador_unique'
            );
            $table->index(
                ['colaborador_operacional_id', 'data_inicio'],
                'exec_func_colaborador_data_inicio_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->dropUnique('exec_func_execucao_colaborador_unique');
            $table->dropIndex('exec_func_colaborador_data_inicio_index');
            $table->dropForeign('exec_func_colaborador_foreign');
            $table->dropColumn('colaborador_operacional_id');
        });

        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->uuid('funcionario_id')->nullable(false)->change();
        });
    }
};
