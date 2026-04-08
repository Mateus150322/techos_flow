<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('anexos')) {
            return;
        }

        foreach (
            DB::table('anexos')
                ->select('caminho')
                ->whereNotNull('caminho')
                ->orderBy('id')
                ->cursor() as $anexo
        ) {
            $path = (string) $anexo->caminho;

            if ($path === '' || ! Storage::disk('public')->exists($path)) {
                continue;
            }

            if (! Storage::disk('local')->exists($path)) {
                Storage::disk('local')->put($path, Storage::disk('public')->get($path));
            }

            Storage::disk('public')->delete($path);
        }
    }

    public function down(): void
    {
        //
    }
};
