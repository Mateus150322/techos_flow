<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feriados', function (Blueprint $table) {
            $table->string('tipo', 30)->default('feriado')->after('data');
            $table->unsignedSmallInteger('percentual_hora_extra')->default(100)->after('municipio');
            $table->boolean('recorrente')->default(false)->after('percentual_hora_extra');
            $table->text('observacao')->nullable()->after('recorrente');

            $table->index(['tipo', 'data', 'ativo'], 'feriados_tipo_data_ativo_index');
        });
    }

    public function down(): void
    {
        Schema::table('feriados', function (Blueprint $table) {
            $table->dropIndex('feriados_tipo_data_ativo_index');
            $table->dropColumn([
                'tipo',
                'percentual_hora_extra',
                'recorrente',
                'observacao',
            ]);
        });
    }
};
