<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fechamentos_horas_extras', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('competencia')->unique();
            $table->uuid('fechado_por_id');
            $table->timestamp('fechado_em');
            $table->text('observacao')->nullable();
            $table->timestamps();

            $table->foreign('fechado_por_id')
                ->references('id')
                ->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fechamentos_horas_extras');
    }
};
