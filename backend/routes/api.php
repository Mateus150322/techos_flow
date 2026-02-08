<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'API ok']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('ordens-servico', [OrdemServicoController::class, 'store']);
});