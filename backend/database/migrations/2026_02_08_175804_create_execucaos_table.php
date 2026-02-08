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
        Schema::create('execucaos', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('os_id');
            $table->uuid('tecnico_id');

            $table->timestamp('data_inicio');
            $table->timestamp('data_fim')->nullable();
            $table->text('observacao')->nullable();

            $table->timestamps();

            $table->foreign('os_id')->references('id')->on('ordem_servicos')->cascadeOnDelete();
            $table->foreign('tecnico_id')->references('id')->on('users');
            
            $table->index(['os_id', 'tecnico_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('execucaos');
    }
};
