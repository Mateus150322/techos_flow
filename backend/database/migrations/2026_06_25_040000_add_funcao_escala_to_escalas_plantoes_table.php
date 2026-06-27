<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escalas_plantoes', function (Blueprint $table) {
            $table->string('funcao_escala', 40)->default('mecanico')->after('descricao');
            $table->index(['funcao_escala', 'data_inicio'], 'escalas_funcao_data_inicio_index');
        });
    }

    public function down(): void
    {
        Schema::table('escalas_plantoes', function (Blueprint $table) {
            $table->dropIndex('escalas_funcao_data_inicio_index');
            $table->dropColumn('funcao_escala');
        });
    }
};
