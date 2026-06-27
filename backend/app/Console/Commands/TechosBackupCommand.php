<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Symfony\Component\Process\Process;
use ZipArchive;

class TechosBackupCommand extends Command
{
    protected $signature = 'techos:backup
        {--database-only : Gera somente o backup do PostgreSQL}
        {--files-only : Gera somente o backup dos anexos}
        {--keep= : Sobrescreve a retenção configurada em dias}';

    protected $description = 'Gera backup do PostgreSQL e dos anexos privados do TechOS Flow';

    public function handle(): int
    {
        $backupPath = (string) config('techos.backup.path');
        File::ensureDirectoryExists($backupPath);

        $timestamp = now()->format('Ymd_His');
        $databaseOnly = (bool) $this->option('database-only');
        $filesOnly = (bool) $this->option('files-only');

        if ($databaseOnly && $filesOnly) {
            $this->error('Use apenas uma das opções --database-only ou --files-only.');

            return self::INVALID;
        }

        if (! $filesOnly && ! $this->backupDatabase($backupPath, $timestamp)) {
            return self::FAILURE;
        }

        if (! $databaseOnly && ! $this->backupAttachments($backupPath, $timestamp)) {
            return self::FAILURE;
        }

        $this->removeExpiredBackups($backupPath);
        $this->info("Backup concluído em {$backupPath}.");

        return self::SUCCESS;
    }

    private function backupDatabase(string $backupPath, string $timestamp): bool
    {
        if (config('database.default') !== 'pgsql') {
            $this->warn('Backup do banco ignorado: a conexão padrão não é PostgreSQL.');

            return true;
        }

        $connection = config('database.connections.pgsql');
        $file = $backupPath.DIRECTORY_SEPARATOR."techos_database_{$timestamp}.dump";
        $process = new Process([
            $this->resolvePostgresBinary('pg_dump'),
            '--format=custom',
            '--no-owner',
            '--no-privileges',
            '--host='.(string) $connection['host'],
            '--port='.(string) $connection['port'],
            '--username='.(string) $connection['username'],
            '--file='.$file,
            (string) $connection['database'],
        ], null, [
            'PGPASSWORD' => (string) ($connection['password'] ?? ''),
        ]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Falha no pg_dump: '.trim($process->getErrorOutput()));
            File::delete($file);

            return false;
        }

        $this->line('Banco: '.basename($file));

        return true;
    }

    private function backupAttachments(string $backupPath, string $timestamp): bool
    {
        if (! class_exists(ZipArchive::class)) {
            $this->error('A extensão ZIP do PHP é necessária para copiar os anexos.');

            return false;
        }

        $source = storage_path('app/private');
        $file = $backupPath.DIRECTORY_SEPARATOR."techos_anexos_{$timestamp}.zip";
        $zip = new ZipArchive;

        if ($zip->open($file, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $this->error('Não foi possível criar o arquivo ZIP de anexos.');

            return false;
        }

        if (File::isDirectory($source)) {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS)
            );

            foreach ($files as $item) {
                if ($item->isFile()) {
                    $relativePath = str_replace('\\', '/', substr($item->getPathname(), strlen($source) + 1));
                    $zip->addFile($item->getPathname(), $relativePath);
                }
            }
        }

        $zip->close();
        $this->line('Anexos: '.basename($file));

        return true;
    }

    private function removeExpiredBackups(string $backupPath): void
    {
        $retentionDays = max(
            1,
            (int) ($this->option('keep') ?? config('techos.backup.retention_days', 30))
        );
        $cutoff = Carbon::now()->subDays($retentionDays)->getTimestamp();

        foreach (File::files($backupPath) as $file) {
            if (
                str_starts_with($file->getFilename(), 'techos_')
                && $file->getMTime() < $cutoff
            ) {
                File::delete($file->getPathname());
            }
        }
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
