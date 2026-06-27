<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->string('aprovacao_status', 20)->default('pendente')->after('minutos_extras_100');
            $table->uuid('aprovado_por_id')->nullable()->after('aprovacao_status');
            $table->timestamp('aprovado_em')->nullable()->after('aprovado_por_id');
            $table->text('aprovacao_observacao')->nullable()->after('aprovado_em');

            $table->foreign('aprovado_por_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['aprovacao_status', 'data_inicio'], 'exec_func_aprovacao_status_data_index');
        });

        if (DB::getDriverName() === 'sqlite') {
            $this->restoreSqliteIntegrityTriggers();
        }
    }

    public function down(): void
    {
        Schema::table('execucao_funcionarios', function (Blueprint $table) {
            $table->dropIndex('exec_func_aprovacao_status_data_index');
            $table->dropForeign(['aprovado_por_id']);
            $table->dropColumn([
                'aprovacao_status',
                'aprovado_por_id',
                'aprovado_em',
                'aprovacao_observacao',
            ]);
        });
    }

    private function restoreSqliteIntegrityTriggers(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS execucao_funcionarios_integridade_insert_check');
        DB::statement('DROP TRIGGER IF EXISTS execucao_funcionarios_integridade_update_check');

        DB::statement(
            "CREATE TRIGGER execucao_funcionarios_integridade_insert_check
             BEFORE INSERT ON execucao_funcionarios
             FOR EACH ROW
             WHEN NEW.data_fim < NEW.data_inicio
                OR ((NEW.funcionario_id IS NULL) = (NEW.colaborador_operacional_id IS NULL))
             BEGIN
                 SELECT RAISE(ABORT, 'periodo ou vinculo de participante invalido');
             END"
        );
        DB::statement(
            "CREATE TRIGGER execucao_funcionarios_integridade_update_check
             BEFORE UPDATE OF data_inicio, data_fim, funcionario_id, colaborador_operacional_id
             ON execucao_funcionarios
             FOR EACH ROW
             WHEN NEW.data_fim < NEW.data_inicio
                OR ((NEW.funcionario_id IS NULL) = (NEW.colaborador_operacional_id IS NULL))
             BEGIN
                 SELECT RAISE(ABORT, 'periodo ou vinculo de participante invalido');
             END"
        );
    }
};
