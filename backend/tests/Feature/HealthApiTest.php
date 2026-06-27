<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_valida_banco_e_storage(): void
    {
        Storage::fake('local');

        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database', true)
            ->assertJsonPath('checks.storage', true);
    }
}
