<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'storage' => $this->checkStorage(),
        ];
        $healthy = ! in_array(false, $checks, true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
        ], $healthy ? 200 : 503);
    }

    private function checkDatabase(): bool
    {
        try {
            DB::selectOne('SELECT 1');

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function checkStorage(): bool
    {
        $disk = (string) config('filesystems.anexos_disk', 'local');
        $path = 'health/'.Str::uuid().'.txt';

        try {
            if (! Storage::disk($disk)->put($path, 'ok')) {
                return false;
            }

            $exists = Storage::disk($disk)->exists($path);
            Storage::disk($disk)->delete($path);

            return $exists;
        } catch (Throwable) {
            return false;
        }
    }
}
