<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escalas_plantoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('funcionario_id')->nullable();
            $table->uuid('colaborador_operacional_id')->nullable();
            $table->string('descricao', 150);
            $table->timestamp('data_inicio');
            $table->timestamp('data_fim');
            $table->boolean('ativo')->default(true);
            $table->text('observacao')->nullable();
            $table->timestamps();

            $table->foreign('funcionario_id')
                ->references('id')
                ->on('users');

            $table->foreign('colaborador_operacional_id')
                ->references('id')
                ->on('colaboradores_operacionais');

            $table->index(['funcionario_id', 'data_inicio', 'data_fim'], 'escalas_funcionario_periodo_index');
            $table->index(['colaborador_operacional_id', 'data_inicio', 'data_fim'], 'escalas_colaborador_periodo_index');
            $table->index(['ativo', 'data_inicio'], 'escalas_ativo_data_inicio_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escalas_plantoes');
    }
};
