<?php

use App\Http\Controllers\AnimeController;
use Illuminate\Support\Facades\Route;

// Dashboard and Search
Route::get('/', [AnimeController::class, 'index'])->name('anime.index');

// Player Page
Route::get('/watch/{id}/{episode?}', [AnimeController::class, 'watch'])->name('anime.watch');
