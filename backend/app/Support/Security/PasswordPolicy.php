<?php

namespace App\Support\Security;

use Closure;

class PasswordPolicy
{
    public const MIN_LENGTH = 8;

    public const MAX_LENGTH = 72;

    /**
     * @return array<int, mixed>
     */
    public static function rules(
        bool $required,
        bool $confirmed = false,
        ?string $differentFromField = null,
        ?string $name = null,
        ?string $email = null,
    ): array {
        return array_values(array_filter([
            $required ? 'required' : 'nullable',
            'string',
            'min:' . self::MIN_LENGTH,
            'max:' . self::MAX_LENGTH,
            $differentFromField ? 'different:' . $differentFromField : null,
            self::validator($name, $email),
            $confirmed ? 'confirmed' : null,
        ]));
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $field = 'password', string $label = 'senha'): array
    {
        $labelComArtigo = $label === 'nova senha' ? 'A nova senha' : 'A senha';

        return [
            "{$field}.required" => $label === 'nova senha' ? 'Informe a nova senha.' : 'Informe a senha.',
            "{$field}.confirmed" => $label === 'nova senha'
                ? 'A confirmação da nova senha não confere.'
                : 'A confirmação da senha não confere.',
            "{$field}.min" => "{$labelComArtigo} deve ter pelo menos " . self::MIN_LENGTH . ' caracteres.',
            "{$field}.max" => "{$labelComArtigo} deve ter no máximo " . self::MAX_LENGTH . ' caracteres.',
            "{$field}.different" => "{$labelComArtigo} deve ser diferente da senha atual.",
        ];
    }

    private static function validator(?string $name = null, ?string $email = null): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($name, $email): void {
            $password = (string) $value;

            if (! preg_match('/[A-Z]/', $password)) {
                $fail('A senha deve conter pelo menos uma letra maiúscula.');
            }

            if (! preg_match('/[a-z]/', $password)) {
                $fail('A senha deve conter pelo menos uma letra minúscula.');
            }

            if (! preg_match('/[0-9]/', $password)) {
                $fail('A senha deve conter pelo menos um número.');
            }

            if (! preg_match('/[^A-Za-z0-9]/', $password)) {
                $fail('A senha deve conter pelo menos um caractere especial.');
            }

            if (preg_match('/\s/u', $password)) {
                $fail('A senha não pode conter espaços.');
            }

            if (self::containsCommonSequence($password)) {
                $fail('A senha não pode conter sequências ou termos comuns, como 1234, abcd, qwer, senha, password ou admin.');
            }

            if (self::containsPersonalData($password, $name, $email)) {
                $fail('A senha não pode conter partes do nome ou do e-mail do usuário.');
            }
        };
    }

    private static function containsCommonSequence(string $password): bool
    {
        $normalized = mb_strtolower($password);

        foreach (['1234', 'abcd', 'qwer', 'senha', 'password', 'admin'] as $term) {
            if (str_contains($normalized, $term)) {
                return true;
            }
        }

        return false;
    }

    private static function containsPersonalData(string $password, ?string $name, ?string $email): bool
    {
        $normalized = mb_strtolower($password);
        $tokens = array_merge(
            self::extractTokens($name),
            self::extractTokens($email ? strtok($email, '@') ?: '' : null),
        );

        foreach ($tokens as $token) {
            if (mb_strlen($token) >= 3 && str_contains($normalized, $token)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, string>
     */
    private static function extractTokens(?string $value): array
    {
        if (! $value) {
            return [];
        }

        $normalized = mb_strtolower($value);
        $parts = preg_split('/[^a-z0-9]+/i', $normalized) ?: [];

        return array_values(array_filter($parts));
    }
}
