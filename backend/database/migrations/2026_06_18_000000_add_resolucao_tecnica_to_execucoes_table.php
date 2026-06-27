<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('execucoes', function (Blueprint $table) {
            $table->text('diagnostico')->nullable()->after('observacao');
            $table->text('procedimento')->nullable()->after('diagnostico');
            $table->text('material_utilizado')->nullable()->after('procedimento');
        });
    }

    public function down(): void
    {
        Schema::table('execucoes', function (Blueprint $table) {
            $table->dropColumn([
                'diagnostico',
                'procedimento',
                'material_utilizado',
            ]);
        });
    }
};
