<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordLinkNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $email = urlencode((string) $notifiable->getEmailForPasswordReset());
        $token = urlencode($this->token);
        $expire = (int) config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60);
        $resetUrl = "{$frontendUrl}/redefinir-senha?token={$token}&email={$email}";

        return (new MailMessage)
            ->subject('Redefinição de senha - TechOS Flow')
            ->greeting('Olá!')
            ->line('Recebemos uma solicitação para redefinir a senha da sua conta no TechOS Flow.')
            ->action('Redefinir senha', $resetUrl)
            ->line("Este link expira em {$expire} minutos.")
            ->line('Se você não solicitou a redefinição, pode ignorar este e-mail com segurança.');
    }
}
