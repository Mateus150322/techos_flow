<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use ZipArchive;

class TechosRestoreCommand extends Command
{
    protected $signature = 'techos:restore
        {--database= : Arquivo .dump gerado pelo techos:backup}
        {--attachments= : Arquivo .zip gerado pelo techos:backup}
        {--force : Confirma a restauração sem interação}';

    protected $description = 'Restaura banco e anexos a partir de um backup do TechOS Flow';

    public function handle(): int
    {
        $databaseFile = $this->resolveBackupFile($this->option('database'), 'dump');
        $attachmentsFile = $this->resolveBackupFile($this->option('attachments'), 'zip');

        if (! $databaseFile && ! $attachmentsFile) {
            $this->error('Informe --database, --attachments ou ambos.');

            return self::INVALID;
        }

        if (
            ! $this->option('force')
            && ! $this->confirm('A restauração sobrescreverá dados existentes. Deseja continuar?')
        ) {
            return self::SUCCESS;
        }

        if ($databaseFile && ! $this->restoreDatabase($databaseFile)) {
            return self::FAILURE;
        }

        if ($attachmentsFile && ! $this->restoreAttachments($attachmentsFile)) {
            return self::FAILURE;
        }

        $this->info('Restauração concluída.');

        return self::SUCCESS;
    }

    private function resolveBackupFile(mixed $value, string $extension): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $candidate = $this->isAbsolutePath($value)
            ? $value
            : rtrim((string) config('techos.backup.path'), DIRECTORY_SEPARATOR)
                .DIRECTORY_SEPARATOR.$value;

        if (! File::isFile($candidate) || strtolower(pathinfo($candidate, PATHINFO_EXTENSION)) !== $extension) {
            $this->error("Backup inválido: {$candidate}");

            return null;
        }

        return $candidate;
    }

    private function isAbsolutePath(string $path): bool
    {
        return preg_match('/^(?:[A-Za-z]:[\\\\\/]|[\\\\\/]{1,2})/', $path) === 1;
    }

    private function restoreDatabase(string $file): bool
    {
        if (config('database.default') !== 'pgsql') {
            $this->error('A restauração do banco exige uma conexão PostgreSQL.');

            return false;
        }

        $connection = config('database.connections.pgsql');
        $process = new Process([
            $this->resolvePostgresBinary('pg_restore'),
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges',
            '--host='.(string) $connection['host'],
            '--port='.(string) $connection['port'],
            '--username='.(string) $connection['username'],
            '--dbname='.(string) $connection['database'],
            $file,
        ], null, [
            'PGPASSWORD' => (string) ($connection['password'] ?? ''),
        ]);
        $process->setTimeout(900);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Falha no pg_restore: '.trim($process->getErrorOutput()));

            return false;
        }

        return true;
    }

    private function restoreAttachments(string $file): bool
    {
        if (! class_exists(ZipArchive::class)) {
            $this->error('A extensão ZIP do PHP é necessária para restaurar anexos.');

            return false;
        }

        $zip = new ZipArchive;

        if ($zip->open($file) !== true) {
            $this->error('Não foi possível abrir o backup de anexos.');

            return false;
        }

        if (! $this->archiveIsSafe($zip)) {
            $zip->close();
            $this->error('O backup de anexos contém caminhos ou links inválidos.');

            return false;
        }

        $restoreId = (string) Str::uuid();
        $staging = storage_path("app/.restore/{$restoreId}");
        $destination = storage_path('app/private');
        $previous = storage_path("app/.restore/private_previous_{$restoreId}");
        File::ensureDirectoryExists($staging);

        $extracted = $zip->extractTo($staging);
        $zip->close();

        if (! $extracted) {
            File::deleteDirectory($staging);

            return false;
        }

        File::ensureDirectoryExists(dirname($destination));

        if (File::isDirectory($destination) && ! File::moveDirectory($destination, $previous)) {
            File::deleteDirectory($staging);

            return false;
        }

        if (! File::moveDirectory($staging, $destination)) {
            if (File::isDirectory($previous)) {
                File::moveDirectory($previous, $destination);
            }

            return false;
        }

        File::deleteDirectory($previous);

        return true;
    }

    private function archiveIsSafe(ZipArchive $zip): bool
    {
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (! is_string($name)) {
                return false;
            }

            $normalized = str_replace('\\', '/', $name);
            $segments = explode('/', $normalized);

            if (
                str_contains($normalized, "\0")
                || str_starts_with($normalized, '/')
                || preg_match('/^[A-Za-z]:\//', $normalized) === 1
                || in_array('..', $segments, true)
            ) {
                return false;
            }

            $operatingSystem = 0;
            $attributes = 0;

            if (
                $zip->getExternalAttributesIndex($index, $operatingSystem, $attributes)
                && (($attributes >> 16) & 0xF000) === 0xA000
            ) {
                return false;
            }
        }

        return true;
    }

    private function resolvePostgresBinary(string $binary): string
    {
        $configured = config("techos.backup.{$binary}_path");

        if (is_string($configured) && File::isFile($configured)) {
            return $configured;
        }

        if (DIRECTORY_SEPARATOR === '\\') {
            $matches = glob("C:\\Program Files\\PostgreSQL\\*\\bin\\{$binary}.exe") ?: [];
            natsort($matches);
            $detected = end($matches);

            if (is_string($detected)) {
                return $detected;
            }
        }

        return $binary;
    }
}
