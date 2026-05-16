<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('execucao_funcionarios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('execucao_id');
            $table->uuid('funcionario_id');
            $table->timestamp('data_inicio');
            $table->timestamp('data_fim');
            $table->integer('minutos_trabalhados')->default(0);
            $table->integer('minutos_normais')->default(0);
            $table->integer('minutos_extras_50')->default(0);
            $table->integer('minutos_extras_100')->default(0);
            $table->timestamps();

            $table->foreign('execucao_id')
                ->references('id')
                ->on('execucoes')
                ->cascadeOnDelete();

            $table->foreign('funcionario_id')
                ->references('id')
                ->on('users');

            $table->unique(['execucao_id', 'funcionario_id'], 'execucao_funcionarios_execucao_funcionario_unique');
            $table->index(['funcionario_id', 'data_inicio'], 'execucao_funcionarios_funcionario_data_inicio_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('execucao_funcionarios');
    }
};

