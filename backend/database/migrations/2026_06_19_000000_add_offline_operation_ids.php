<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordem_servicos', function (Blueprint $table) {
            $table->uuid('aceite_client_operation_id')->nullable()->unique();
            $table->uuid('encerramento_client_operation_id')->nullable()->unique();
        });

        Schema::table('execucoes', function (Blueprint $table) {
            $table->uuid('client_operation_id')->nullable()->unique();
            $table->uuid('finalizacao_client_operation_id')->nullable()->unique();
        });

        Schema::table('anexos', function (Blueprint $table) {
            $table->uuid('client_operation_id')->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('anexos', function (Blueprint $table) {
            $table->dropUnique(['client_operation_id']);
            $table->dropColumn('client_operation_id');
        });

        Schema::table('execucoes', function (Blueprint $table) {
            $table->dropUnique(['client_operation_id']);
            $table->dropUnique(['finalizacao_client_operation_id']);
            $table->dropColumn([
                'client_operation_id',
                'finalizacao_client_operation_id',
            ]);
        });

        Schema::table('ordem_servicos', function (Blueprint $table) {
            $table->dropUnique(['aceite_client_operation_id']);
            $table->dropUnique(['encerramento_client_operation_id']);
            $table->dropColumn([
                'aceite_client_operation_id',
                'encerramento_client_operation_id',
            ]);
        });
    }
};
