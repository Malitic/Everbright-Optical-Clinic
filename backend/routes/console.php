<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule automated database backups for data protection
// Runs daily at 2:00 AM to backup all data
Schedule::command('db:backup')->daily()->at('02:00');
