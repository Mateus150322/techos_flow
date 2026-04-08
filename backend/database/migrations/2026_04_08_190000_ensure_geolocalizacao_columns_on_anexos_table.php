<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('anexos')) {
            return;
        }

        Schema::table('anexos', function (Blueprint $table) {
            if (!Schema::hasColumn('anexos', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('tipo');
            }

            if (!Schema::hasColumn('anexos', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            if (!Schema::hasColumn('anexos', 'precisao_metros')) {
                $table->decimal('precisao_metros', 8, 2)->nullable()->after('longitude');
            }

            if (!Schema::hasColumn('anexos', 'geolocalizacao_capturada_em')) {
                $table->timestamp('geolocalizacao_capturada_em')->nullable()->after('precisao_metros');
            }

            if (!Schema::hasColumn('anexos', 'endereco_capturado')) {
                $table->text('endereco_capturado')->nullable()->after('geolocalizacao_capturada_em');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('anexos')) {
            return;
        }

        Schema::table('anexos', function (Blueprint $table) {
            $columns = [
                'endereco_capturado',
                'geolocalizacao_capturada_em',
                'precisao_metros',
                'longitude',
                'latitude',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('anexos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
