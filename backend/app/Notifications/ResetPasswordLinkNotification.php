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
        $appUrl = rtrim((string) config('app.url', $frontendUrl), '/');
        $email = urlencode((string) $notifiable->getEmailForPasswordReset());
        $token = urlencode($this->token);
        $expire = (int) config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60);
        $resetUrl = "{$frontendUrl}/redefinir-senha?token={$token}&email={$email}";
        $logoUrl = "{$appUrl}/techos-icon.png";
        $recipientName = trim((string) ($notifiable->name ?? ''));

        return (new MailMessage)
            ->subject('Redefinição de senha - TechOS Flow')
            ->view('emails.reset-password', [
                'appName' => (string) config('app.name', 'TechOS Flow'),
                'logoUrl' => $logoUrl,
                'recipientName' => $recipientName !== '' ? $recipientName : 'Olá',
                'resetUrl' => $resetUrl,
                'expire' => $expire,
            ]);
    }
}
