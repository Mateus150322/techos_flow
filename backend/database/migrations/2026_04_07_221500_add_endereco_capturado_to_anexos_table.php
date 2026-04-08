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
        Schema::table('anexos', function (Blueprint $table) {
            if (!Schema::hasColumn('anexos', 'endereco_capturado')) {
                $table->text('endereco_capturado')->nullable()->after('geolocalizacao_capturada_em');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anexos', function (Blueprint $table) {
            if (Schema::hasColumn('anexos', 'endereco_capturado')) {
                $table->dropColumn('endereco_capturado');
            }
        });
    }
};
