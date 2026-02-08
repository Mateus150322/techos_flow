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
        Schema::create('anexos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('os_id');
            $table->string('caminho', 300);
            $table->string('tipo', 50); // Ex: 'foto', 'video', ' pdf'
            $table->uuid('submetido_por_id');

            $table->timestamp('criado_em')->useCurrent();

            $table->timestamps();

            $table->foreign('os_id')->references('id')->on('ordem_servicos')->cascadeOnDelete();
            $table->foreign('submetido_por_id')->references('id')->on('users');

                $table->index(['os_id', 'tipo']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anexos');
    }
};
