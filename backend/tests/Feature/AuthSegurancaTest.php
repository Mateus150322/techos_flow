<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSegurancaTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_revoga_tokens_anteriores_e_retorna_expiracao(): void
    {
        $user = $this->criarUsuario('tecnico');
        $user->createToken('token-antigo');

        $response = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'user',
                'token',
                'token_expires_at',
            ]);

        $user->refresh();

        $this->assertCount(1, $user->tokens);
        $this->assertNotNull($response->json('token_expires_at'));
    }

    public function test_login_aplica_limite_de_tentativas(): void
    {
        $user = $this->criarUsuario('tecnico');

        foreach (range(1, 5) as $attempt) {
            $response = $this->postJson('/api/v1/login', [
                'email' => $user->email,
                'password' => 'senha-errada',
            ]);

            $response->assertStatus(401);
        }

        $blocked = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'senha-errada',
        ]);

        $blocked->assertStatus(429);
    }

    private function criarUsuario(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role) . ' Teste',
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }
}
