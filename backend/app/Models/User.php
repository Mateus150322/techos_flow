<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    /**
     * Indica que a chave primária é do tipo string (UUID)
     */
    protected $keyType = 'string';

    /**
     * Indica que a chave primária NÃO é auto-incremento
     */
    public $incrementing = false;

    /**
     * Campos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // atendente | tecnico | administrador
    ];

    /**
     * Campos que devem ser ocultados nas respostas JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts automáticos
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Relacionamentos
     */

    // Um usuário pode criar várias ordens de serviço
    public function ordensCriadas()
    {
        return $this->hasMany(OrdemServico::class, 'criada_por_id');
    }
}
