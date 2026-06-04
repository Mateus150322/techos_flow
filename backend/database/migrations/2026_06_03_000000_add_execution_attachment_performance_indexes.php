<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('execucoes', function (Blueprint $table) {
            $table->index(['os_id', 'data_inicio'], 'execucoes_os_data_inicio_index');
            $table->index(['os_id', 'data_fim'], 'execucoes_os_data_fim_index');
        });

        Schema::table('anexos', function (Blueprint $table) {
            $table->index(['os_id', 'criado_em'], 'anexos_os_criado_em_index');
        });
    }

    public function down(): void
    {
        Schema::table('anexos', function (Blueprint $table) {
            $table->dropIndex('anexos_os_criado_em_index');
        });

        Schema::table('execucoes', function (Blueprint $table) {
            $table->dropIndex('execucoes_os_data_inicio_index');
            $table->dropIndex('execucoes_os_data_fim_index');
        });
    }
};
