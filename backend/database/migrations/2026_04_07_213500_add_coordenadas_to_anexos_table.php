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
            $table->decimal('latitude', 10, 7)->nullable()->after('tipo');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('precisao_metros', 8, 2)->nullable()->after('longitude');
            $table->timestamp('geolocalizacao_capturada_em')->nullable()->after('precisao_metros');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anexos', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'precisao_metros',
                'geolocalizacao_capturada_em',
            ]);
        });
    }
};
