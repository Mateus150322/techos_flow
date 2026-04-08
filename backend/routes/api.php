<?php

use App\Http\Controllers\Api\V1\AnexoController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ExecucaoController;
use App\Http\Controllers\Api\V1\OrdemServicoController;
use App\Http\Controllers\Api\V1\RelatorioController;
use App\Http\Controllers\Api\V1\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/health', fn () => response()->json(['status' => 'API ok']));

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::middleware('active')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/me/alterar-senha', [AuthController::class, 'changePassword']);

            Route::middleware('password.changed')->group(function () {
                Route::middleware('role:atendente,tecnico,administrador')->group(function () {
                    Route::post('/ordens-servico', [OrdemServicoController::class, 'store']);
                });

                Route::middleware('role:administrador')->group(function () {
                    Route::get('/relatorios/ordens-servico', [RelatorioController::class, 'ordensServico']);
                    Route::get('/relatorios/ordens-servico/exportar/{format}', [RelatorioController::class, 'exportOrdensServico']);
                    Route::get('/usuarios', [UsuarioController::class, 'index']);
                    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
                    Route::post('/usuarios', [UsuarioController::class, 'store']);
                    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
                });

                Route::middleware('role:tecnico')->group(function () {
                    Route::post('/ordens-servico/{id}/iniciar', [ExecucaoController::class, 'store']);
                    Route::post('/ordens-servico/{id}/execucoes/finalizar', [ExecucaoController::class, 'finalizar']);
                    Route::post('/ordens-servico/{id}/nao-executada', [OrdemServicoController::class, 'marcarNaoExecutada']);
                    Route::post('/ordens-servico/{id}/anexos', [AnexoController::class, 'store']);
                    Route::post('/ordens-servico/{id}/aceitar', [OrdemServicoController::class, 'aceitar']);
                });

                Route::get('/ordens-servico', [OrdemServicoController::class, 'index']);
                Route::get('/ordens-servico/{id}', [OrdemServicoController::class, 'show']);
            });
        });
    });
});
