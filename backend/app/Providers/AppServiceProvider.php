<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('viewPulse', function (?User $user = null): bool {
            return app()->environment('local')
                || request()->attributes->getBoolean('pulse_authorized')
                || $user?->role === 'administrador';
        });

        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower((string) $request->input('email', 'guest'));

            return [
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
            ];
        });

        if (config('techos.backup.enabled')) {
            Schedule::command('techos:backup')
                ->dailyAt((string) config('techos.backup.schedule', '02:00'))
                ->withoutOverlapping()
                ->onOneServer();
        }
    }
}
