<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\OrdemServicoController;

Route::prefix('v1')->group(function () {

    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/health', fn () => response()->json(['status' => 'API ok']));

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Atendente e Admin podem abrir OS
        Route::middleware('role:atendente,administrador')->group(function () {
            Route::post('/ordens-servico', [OrdemServicoController::class, 'store']);
        });

        
    });
});
