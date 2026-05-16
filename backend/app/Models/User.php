<?php

namespace App\Models;

use App\Notifications\ResetPasswordLinkNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    protected $attributes = [
        'role' => 'atendente',
        'is_active' => true,
        'must_change_password' => false,
    ];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'must_change_password',
        'valor_hora',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'valor_hora' => 'decimal:2',
    ];

    public function ordensCriadas()
    {
        return $this->hasMany(OrdemServico::class, 'criada_por_id');
    }

    public function execucoesComoFuncionario()
    {
        return $this->hasMany(ExecucaoFuncionario::class, 'funcionario_id');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordLinkNotification($token));
    }
}
