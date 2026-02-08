<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes (Scheduler)
|--------------------------------------------------------------------------
|
| Define scheduled tasks here. Run `php artisan schedule:run` via cron.
| On Cloudways, set cron: * * * * * php /path/artisan schedule:run
|
*/

// Scrape auction lots daily at 6 AM UK time
Schedule::command('lots:scrape')
    ->dailyAt('06:00')
    ->timezone('Europe/London')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scraper.log'));

// Scrape Lotu.uk aggregator every 6 hours (covers all auction houses)
Schedule::command('lots:scrape --house=999 --sync')
    ->everySixHours()
    ->timezone('Europe/London')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/lotu-scraper.log'));

// Mark past auctions as completed
Schedule::command('lots:update-status')
    ->dailyAt('00:30')
    ->timezone('Europe/London');
