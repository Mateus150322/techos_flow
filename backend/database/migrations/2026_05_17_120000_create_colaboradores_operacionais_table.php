<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('colaboradores_operacionais', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('funcao')->default('Auxiliar técnico');
            $table->decimal('valor_hora', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'name'], 'colab_operacionais_active_name_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('colaboradores_operacionais');
    }
};
