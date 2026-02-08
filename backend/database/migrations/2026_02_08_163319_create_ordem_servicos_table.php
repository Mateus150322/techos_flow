<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ordem_servicos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('numero')->unique(); // AAAA-NNNNNN
            $table->string('tipo');
            $table->enum('status', ['aberta', 'em_execucao', 'finalizada', 'nao_executada', 'cancelada'])->default('aberta');
            
            $table->smallInteger('prioridade')->default(2); // 1: Alta, 2: Média, 3: Baixa
            
            $table->timestamp('data_abertura')->useCurrent();
            $table->timestamp('data_encerramento')->nullable();
            
            $table->text('descricao');
            $table->text('observacoes')->nullable();
            $table->text('motivo_nao_execucao')->nullable();

            $table->uuid('endereco_id');
            $table->uuid('criada_por_id');

            $table->timestamps();

            $table->foreign('endereco_id')->references('id')->on('enderecos');
            $table->foreign('criada_por_id')->references('id')->on('users');

            $table->index(['status', 'tipo', 'data_abertura']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ordem_servicos');
    }
};
