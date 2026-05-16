<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'valor_hora')) {
            Schema::table('users', function (Blueprint $table) {
                $table->decimal('valor_hora', 10, 2)->nullable()->after('must_change_password');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'valor_hora')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('valor_hora');
            });
        }
    }
};

