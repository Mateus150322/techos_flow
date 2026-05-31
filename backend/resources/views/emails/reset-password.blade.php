<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de senha - {{ $appName }}</title>
</head>
<body style="margin:0; padding:0; background-color:#eef4fb; font-family:Arial, Helvetica, sans-serif; color:#17324d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef4fb; margin:0; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(15, 41, 75, 0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg, #0f4c81 0%, #0b3a63 100%); padding:28px 32px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="width:72px; vertical-align:middle;">
                                        <img src="{{ $logoUrl }}" alt="{{ $appName }}" width="56" height="56" style="display:block; width:56px; height:56px; border-radius:14px; background-color:#ffffff; padding:6px;">
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <div style="font-size:28px; line-height:1.1; font-weight:700; color:#ffffff;">{{ $appName }}</div>
                                        <div style="margin-top:6px; font-size:14px; line-height:1.5; color:#d9e9f8;">Recuperação segura de acesso à sua conta</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                                {{ $recipientName }},
                            </p>
                            <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                                Recebemos uma solicitação para redefinir a senha da sua conta no <strong>{{ $appName }}</strong>.
                            </p>
                            <p style="margin:0 0 24px; font-size:16px; line-height:1.7;">
                                Para continuar, clique no botão abaixo e escolha uma nova senha.
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                                <tr>
                                    <td align="center" bgcolor="#0f4c81" style="border-radius:12px;">
                                        <a href="{{ $resetUrl }}" style="display:inline-block; padding:14px 24px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none;">
                                            Redefinir senha
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px; border-collapse:separate; border-spacing:0; background-color:#f6f9fd; border:1px solid #d7e4f2; border-radius:14px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <div style="font-size:14px; font-weight:700; color:#0f4c81; margin-bottom:6px;">Importante</div>
                                        <div style="font-size:14px; line-height:1.7; color:#35516d;">
                                            Este link expira em <strong>{{ $expire }} minutos</strong>.
                                        </div>
                                        <div style="font-size:14px; line-height:1.7; color:#35516d; margin-top:6px;">
                                            Se você não fez essa solicitação, pode ignorar este e-mail com segurança.
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 8px; font-size:13px; line-height:1.7; color:#5b6f84;">
                                Caso o botão não funcione, copie e cole este link no navegador:
                            </p>
                            <p style="margin:0; font-size:13px; line-height:1.7; word-break:break-all; color:#0f4c81;">
                                <a href="{{ $resetUrl }}" style="color:#0f4c81; text-decoration:none;">{{ $resetUrl }}</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 32px; background-color:#f8fbff; border-top:1px solid #e3edf7;">
                            <p style="margin:0; font-size:12px; line-height:1.7; color:#6d8095;">
                                E-mail automático do {{ $appName }}. Não responda esta mensagem.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
