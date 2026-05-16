<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feriados', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nome', 150);
            $table->date('data');
            $table->enum('escopo', ['nacional', 'estadual', 'municipal'])->default('estadual');
            $table->string('estado', 2)->nullable();
            $table->string('municipio', 120)->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->index(['data', 'ativo']);
            $table->index(['escopo', 'estado', 'municipio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feriados');
    }
};

