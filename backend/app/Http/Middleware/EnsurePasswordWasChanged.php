<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePasswordWasChanged
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Nao autenticado.'], 401);
        }

        if ($user->must_change_password) {
            return response()->json([
                'message' => 'E necessario alterar a senha antes de continuar.',
            ], 403);
        }

        return $next($request);
    }
}
