<?php

namespace App\Jobs;

use App\Services\Scrapers\ScraperRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScrapeAuctionHouseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public int $auctionHouseId
    ) {}

    public function handle(): void
    {
        $scraper = ScraperRegistry::get($this->auctionHouseId);

        if (!$scraper) {
            Log::warning("[ScrapeJob] No scraper for house #{$this->auctionHouseId}");
            return;
        }

        Log::info("[ScrapeJob] Starting scrape for house #{$this->auctionHouseId}");
        $log = $scraper->scrape();
        Log::info("[ScrapeJob] Completed house #{$this->auctionHouseId}: {$log->status} ({$log->lots_found} lots, {$log->lots_new} new)");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("[ScrapeJob] Failed house #{$this->auctionHouseId}: " . $exception->getMessage());
    }
}
