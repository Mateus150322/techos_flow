<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordem_servicos', function (Blueprint $table) {
            $table->index('prioridade', 'ordem_servicos_prioridade_index');
            $table->index('data_abertura', 'ordem_servicos_data_abertura_index');
            $table->index(['status', 'data_abertura'], 'ordem_servicos_status_data_abertura_index');
            $table->index(
                ['tecnico_responsavel_id', 'status', 'data_abertura'],
                'ordem_servicos_tecnico_status_data_abertura_index'
            );
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'is_active'], 'users_role_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::table('ordem_servicos', function (Blueprint $table) {
            $table->dropIndex('ordem_servicos_prioridade_index');
            $table->dropIndex('ordem_servicos_data_abertura_index');
            $table->dropIndex('ordem_servicos_status_data_abertura_index');
            $table->dropIndex('ordem_servicos_tecnico_status_data_abertura_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_is_active_index');
        });
    }
};
