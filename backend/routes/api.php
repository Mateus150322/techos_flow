<?php

use App\Http\Controllers\Api\V1\AnexoController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarioCorporativoController;
use App\Http\Controllers\Api\V1\ColaboradorOperacionalController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\EscalaPlantaoController;
use App\Http\Controllers\Api\V1\ExecucaoController;
use App\Http\Controllers\Api\V1\FuncionarioController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\HoraExtraController;
use App\Http\Controllers\Api\V1\OrdemServicoController;
use App\Http\Controllers\Api\V1\OrdemServicoPdfController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\RelatorioController;
use App\Http\Controllers\Api\V1\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/esqueci-senha', [PasswordResetController::class, 'sendResetLink'])->middleware('throttle:6,1');
    Route::post('/redefinir-senha', [PasswordResetController::class, 'reset'])->middleware('throttle:6,1');
    Route::get('/health', HealthController::class);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::middleware('active')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/me/alterar-senha', [AuthController::class, 'changePassword']);

            Route::middleware('password.changed')->group(function () {
                Route::middleware('role:atendente,tecnico')->group(function () {
                    Route::post('/ordens-servico', [OrdemServicoController::class, 'store']);
                });

                Route::middleware('role:administrador')->group(function () {
                    Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
                    Route::get('/relatorios/ordens-servico', [RelatorioController::class, 'ordensServico']);
                    Route::get('/relatorios/ordens-servico/exportar/{format}', [RelatorioController::class, 'exportOrdensServico']);
                    Route::get('/relatorios/horas-extras', [HoraExtraController::class, 'index']);
                    Route::post('/relatorios/horas-extras/aprovacoes', [HoraExtraController::class, 'aprovar']);
                    Route::post('/relatorios/horas-extras/fechamentos', [HoraExtraController::class, 'fecharCompetencia']);
                    Route::delete('/relatorios/horas-extras/fechamentos/{fechamento}', [HoraExtraController::class, 'reabrirCompetencia']);
                    Route::get('/relatorios/horas-extras/exportar/{format}', [HoraExtraController::class, 'export']);
                    Route::get('/calendario-corporativo', [CalendarioCorporativoController::class, 'index']);
                    Route::post('/calendario-corporativo', [CalendarioCorporativoController::class, 'store']);
                    Route::put('/calendario-corporativo/{calendarioCorporativo}', [CalendarioCorporativoController::class, 'update']);
                    Route::delete('/calendario-corporativo/{calendarioCorporativo}', [CalendarioCorporativoController::class, 'destroy']);
                    Route::get('/escalas-plantoes', [EscalaPlantaoController::class, 'index']);
                    Route::post('/escalas-plantoes', [EscalaPlantaoController::class, 'store']);
                    Route::put('/escalas-plantoes/{escalaPlantao}', [EscalaPlantaoController::class, 'update']);
                    Route::delete('/escalas-plantoes/{escalaPlantao}', [EscalaPlantaoController::class, 'destroy']);
                    Route::get('/usuarios', [UsuarioController::class, 'index']);
                    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
                    Route::post('/usuarios', [UsuarioController::class, 'store']);
                    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
                    Route::get('/colaboradores-operacionais', [ColaboradorOperacionalController::class, 'index']);
                    Route::post('/colaboradores-operacionais', [ColaboradorOperacionalController::class, 'store']);
                    Route::put('/colaboradores-operacionais/{id}', [ColaboradorOperacionalController::class, 'update']);
                });

                Route::middleware('role:tecnico')->group(function () {
                    Route::get('/dashboard/tecnico', [DashboardController::class, 'tecnico']);
                    Route::post('/ordens-servico/{id}/iniciar', [ExecucaoController::class, 'store']);
                    Route::post('/ordens-servico/{id}/execucoes/finalizar', [ExecucaoController::class, 'finalizar']);
                    Route::post('/ordens-servico/{id}/nao-executada', [OrdemServicoController::class, 'marcarNaoExecutada']);
                    Route::post('/ordens-servico/{id}/anexos', [AnexoController::class, 'store']);
                    Route::post('/ordens-servico/{id}/aceitar', [OrdemServicoController::class, 'aceitar']);
                });

                Route::middleware('role:tecnico,administrador')->group(function () {
                    Route::get('/funcionarios', [FuncionarioController::class, 'index']);
                });

                Route::middleware('role:atendente')->group(function () {
                    Route::get('/dashboard/atendente', [DashboardController::class, 'atendente']);
                });

                Route::get('/ordens-servico/opcoes-filtro', [OrdemServicoController::class, 'filterOptions']);
                Route::get('/ordens-servico/resumo', [OrdemServicoController::class, 'summary']);
                Route::get('/ordens-servico', [OrdemServicoController::class, 'index']);
                Route::get('/ordens-servico/{id}', [OrdemServicoController::class, 'show']);
                Route::get('/ordens-servico/{id}/relatorio/pdf', [OrdemServicoPdfController::class, 'show']);
                Route::get('/anexos/{id}/arquivo', [AnexoController::class, 'show']);
            });
        });
    });
});
