<?php

namespace App\Services\Storage;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnexoStorageService
{
    public function configuredDisk(): string
    {
        return (string) config('filesystems.anexos_disk', config('filesystems.default', 'local'));
    }

    public function store(UploadedFile $arquivo, string $directory = 'anexos'): string
    {
        $disk = $this->configuredDisk();

        try {
            $this->ensureDirectoryExists($disk, $directory);
            $storedPath = $arquivo->store($directory, $disk);
        } catch (\Throwable $exception) {
            if (! $this->supportsLocalPath($disk)) {
                throw $exception;
            }

            $storedPath = $arquivo->storeAs('', $directory . '-' . $arquivo->hashName(), $disk);
        }

        if (! is_string($storedPath) || $storedPath === '') {
            throw new \RuntimeException('Nao foi possivel armazenar o anexo no disco configurado.');
        }

        return $storedPath;
    }

    private function ensureDirectoryExists(string $disk, string $directory): void
    {
        if (! $this->supportsLocalPath($disk)) {
            return;
        }

        try {
            $path = Storage::disk($disk)->path($directory);
        } catch (\Throwable) {
            return;
        }

        if (is_dir($path)) {
            return;
        }

        if (@mkdir($path, 0775, true) || is_dir($path)) {
            return;
        }

        usleep(100_000);

        if (! is_dir($path) && ! @mkdir($path, 0775, true) && ! is_dir($path)) {
            throw new \RuntimeException('Nao foi possivel preparar a pasta de anexos.');
        }
    }

    public function resolveDisk(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $preferred = $this->configuredDisk();
        $fallbacks = array_values(array_unique(array_filter([
            $preferred,
            'local',
            'public',
            's3',
        ])));

        foreach ($fallbacks as $disk) {
            if ($this->supportsLocalPath($disk)) {
                try {
                    $localPath = Storage::disk($disk)->path($path);

                    if (is_string($localPath) && is_file($localPath)) {
                        return $disk;
                    }
                } catch (\Throwable) {
                    // Continua para a validacao via adapter.
                }
            }

            if (Storage::disk($disk)->exists($path)) {
                return $disk;
            }
        }

        return null;
    }

    public function mimeType(string $path, ?string $disk = null): ?string
    {
        $resolvedDisk = $disk ?? $this->resolveDisk($path);

        if (! $resolvedDisk) {
            return null;
        }

        return Storage::disk($resolvedDisk)->mimeType($path);
    }

    public function get(string $path, ?string $disk = null): ?string
    {
        $resolvedDisk = $disk ?? $this->resolveDisk($path);

        if (! $resolvedDisk) {
            return null;
        }

        return Storage::disk($resolvedDisk)->get($path);
    }

    public function localPath(string $path, ?string $disk = null): ?string
    {
        $resolvedDisk = $disk ?? $this->resolveDisk($path);

        if (! $resolvedDisk || ! $this->supportsLocalPath($resolvedDisk)) {
            return null;
        }

        return Storage::disk($resolvedDisk)->path($path);
    }

    public function supportsLocalPath(string $disk): bool
    {
        return in_array($disk, ['local', 'public'], true);
    }

    public function streamResponse(
        string $path,
        string $mimeType,
        string $fileName,
        string $contentDisposition
    ): StreamedResponse {
        $disk = $this->resolveDisk($path);

        abort_unless($disk, 404);

        $stream = Storage::disk($disk)->readStream($path);

        abort_unless($stream !== false, 404);

        return response()->stream(
            function () use ($stream): void {
                fpassthru($stream);
                fclose($stream);
            },
            200,
            [
                'Content-Type' => $mimeType,
                'Content-Disposition' => $contentDisposition,
                'Cache-Control' => 'private, no-store, max-age=0',
                'Pragma' => 'no-cache',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }
}
