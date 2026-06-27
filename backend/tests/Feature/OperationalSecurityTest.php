<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;
use ZipArchive;

class OperationalSecurityTest extends TestCase
{
    public function test_pulse_requires_configured_basic_authentication_outside_local_environment(): void
    {
        $this->app->detectEnvironment(fn (): string => 'production');
        config()->set('techos.pulse.username', 'monitoramento');
        config()->set('techos.pulse.password', 'senha-segura');

        $this->get('/pulse')
            ->assertUnauthorized()
            ->assertHeader('WWW-Authenticate');

        $this->withBasicAuth('monitoramento', 'senha-segura')
            ->get('/pulse')
            ->assertOk();
    }

    public function test_attachment_restore_rejects_path_traversal(): void
    {
        $directory = storage_path('framework/testing/restore-security');
        $archive = $directory.DIRECTORY_SEPARATOR.'malicious.zip';
        File::ensureDirectoryExists($directory);

        $zip = new ZipArchive;
        $zip->open($archive, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('../escape.txt', 'nao deve sair do diretorio');
        $zip->close();

        $this->artisan('techos:restore', [
            '--attachments' => $archive,
            '--force' => true,
        ])->assertExitCode(1);

        $this->assertFileDoesNotExist(storage_path('app/escape.txt'));
        File::deleteDirectory($directory);
    }
}
