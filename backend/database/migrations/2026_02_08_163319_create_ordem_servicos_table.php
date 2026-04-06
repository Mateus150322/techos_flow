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

            // Número da OS
            $table->string('numero')->unique(); // AAAA-NNNNNN

            // Tipo do serviço (ex: Vazamento, Entupimento)
            $table->string('tipo');

            // Nome do cliente (OS aberta pelo atendente)
            $table->string('nome_cliente')->nullable();

            // Status da OS
            $table->enum('status', [
                'aberta',
                'em_execucao',
                'finalizada',
                'nao_executada',
                'cancelada'
            ])->default('aberta');

            // 1 Alta | 2 Média | 3 Baixa
            $table->smallInteger('prioridade')->default(2);

            // Datas
            $table->timestamp('data_abertura')->useCurrent();
            $table->timestamp('data_encerramento')->nullable();

            // Descrição do atendimento
            $table->text('descricao');

            // Observações internas
            $table->text('observacoes')->nullable();

            // Motivo quando não executada
            $table->text('motivo_nao_execucao')->nullable();

            // 🔥 RELACIONAMENTOS
            $table->uuid('endereco_id');
            $table->uuid('criada_por_id');

            // 👉 NOVO CAMPO (TÉCNICO RESPONSÁVEL)
            $table->uuid('tecnico_responsavel_id')->nullable();

            $table->timestamps();

            // 🔗 FOREIGN KEYS
            $table->foreign('endereco_id')
                ->references('id')
                ->on('enderecos')
                ->cascadeOnDelete();

            $table->foreign('criada_por_id')
                ->references('id')
                ->on('users');

            $table->foreign('tecnico_responsavel_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            // ⚡ ÍNDICES
            $table->index(['status', 'tipo', 'data_abertura']);
            $table->index('endereco_id');
            $table->index('criada_por_id');
            $table->index('tecnico_responsavel_id');
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