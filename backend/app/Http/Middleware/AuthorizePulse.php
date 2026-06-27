<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizePulse
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        $configuredUsername = (string) config('techos.pulse.username');
        $configuredPassword = (string) config('techos.pulse.password');
        $username = (string) $request->getUser();
        $password = (string) $request->getPassword();

        if (
            $configuredUsername !== ''
            && $configuredPassword !== ''
            && hash_equals($configuredUsername, $username)
            && hash_equals($configuredPassword, $password)
        ) {
            $request->attributes->set('pulse_authorized', true);

            return $next($request);
        }

        return response('Autenticacao necessaria.', 401, [
            'Cache-Control' => 'no-store',
            'WWW-Authenticate' => 'Basic realm="TechOS Flow Pulse", charset="UTF-8"',
        ]);
    }
}
