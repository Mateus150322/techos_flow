<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordem_servico_eventos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('os_id');
            $table->uuid('usuario_id')->nullable();
            $table->string('evento', 80);
            $table->string('descricao', 500)->nullable();
            $table->json('dados_anteriores')->nullable();
            $table->json('dados_novos')->nullable();
            $table->uuid('client_operation_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('os_id')
                ->references('id')
                ->on('ordem_servicos')
                ->cascadeOnDelete();
            $table->foreign('usuario_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['os_id', 'created_at'], 'os_eventos_os_created_at_index');
            $table->index(['usuario_id', 'created_at'], 'os_eventos_usuario_created_at_index');
            $table->unique(
                ['evento', 'client_operation_id'],
                'os_eventos_evento_client_operation_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordem_servico_eventos');
    }
};
