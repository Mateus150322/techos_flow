<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Endereco;
use App\Models\OrdemServico;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 👤 Usuário administrador
        $admin = User::create([
            'id' => Str::uuid(),
            'name' => 'Mateus',
            'email' => 'mateus@teste.com',
            'password' => bcrypt('123456'),
            'role' => 'administrador'
        ]);

        // 📍 Endereço
        $endereco = Endereco::create([
            'id' => Str::uuid(),
            'rua' => 'Rua Rui Barbosa',
            'numero' => '123',
            'bairro' => 'Centro',
            'cidade' => 'Rio Branco',
            'estado' => 'AC',
            'cep' => '69900100',
            'latitude' => -9.9728673,
            'longitude' => -67.8109541,
        ]);

        // 🧾 Ordem de Serviço teste
        OrdemServico::create([
            'id' => Str::uuid(),
            'numero' => '2026-000001',
            'tipo' => 'Vazamento',
            'status' => 'aberta',
            'prioridade' => 1,
            'descricao' => 'OS criada automaticamente pelo seeder.',
            'endereco_id' => $endereco->id,
            'criada_por_id' => $admin->id,
        ]);
    }
}
