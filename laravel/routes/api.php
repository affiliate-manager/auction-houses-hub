<?php

use App\Http\Controllers\Api\LotController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically.
| Responses are JSON, cached in Redis for 5 minutes.
|
*/

Route::prefix('lots')->group(function () {
    Route::get('/', [LotController::class, 'index']);        // GET /api/lots
    Route::get('/{lot}', [LotController::class, 'show']);    // GET /api/lots/{id}
});

Route::get('/stats', [StatsController::class, 'index']);     // GET /api/stats
