<?php

use App\Http\Controllers\AnimeController;
use Illuminate\Support\Facades\Route;

// Homepage / Search
Route::get('/', [AnimeController::class, 'index'])->name('anime.index');

// Watch page
Route::get('/watch/{id}/{episode?}', [AnimeController::class, 'watch'])->name('anime.watch');
