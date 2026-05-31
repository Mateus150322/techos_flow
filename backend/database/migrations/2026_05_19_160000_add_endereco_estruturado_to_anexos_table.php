<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('anexos')) {
            return;
        }

        Schema::table('anexos', function (Blueprint $table) {
            if (! Schema::hasColumn('anexos', 'rua_capturada')) {
                $table->string('rua_capturada')->nullable()->after('geolocalizacao_capturada_em');
            }

            if (! Schema::hasColumn('anexos', 'bairro_capturado')) {
                $table->string('bairro_capturado')->nullable()->after('rua_capturada');
            }

            if (! Schema::hasColumn('anexos', 'cidade_capturada')) {
                $table->string('cidade_capturada')->nullable()->after('bairro_capturado');
            }

            if (! Schema::hasColumn('anexos', 'estado_capturado')) {
                $table->string('estado_capturado', 120)->nullable()->after('cidade_capturada');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('anexos')) {
            return;
        }

        Schema::table('anexos', function (Blueprint $table) {
            $columns = [
                'estado_capturado',
                'cidade_capturada',
                'bairro_capturado',
                'rua_capturada',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('anexos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
