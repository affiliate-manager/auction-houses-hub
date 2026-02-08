<?php

namespace App\Console\Commands;

use App\Jobs\ScrapeAuctionHouseJob;
use App\Services\Scrapers\ScraperRegistry;
use Illuminate\Console\Command;

class ScrapeLots extends Command
{
    protected $signature = 'lots:scrape
                            {--house= : Scrape a specific auction house by ID}
                            {--sync : Run synchronously instead of queuing}';

    protected $description = 'Scrape lot listings from registered auction house websites';

    public function handle(): int
    {
        $houseId = $this->option('house');
        $sync = $this->option('sync');

        if ($houseId) {
            // Scrape a single house
            if (!ScraperRegistry::has((int) $houseId)) {
                $this->error("No scraper registered for house ID: {$houseId}");
                return self::FAILURE;
            }

            $this->info("Scraping house #{$houseId}...");
            if ($sync) {
                (new ScrapeAuctionHouseJob((int) $houseId))->handle();
            } else {
                ScrapeAuctionHouseJob::dispatch((int) $houseId);
            }
            $this->info('Done.');
            return self::SUCCESS;
        }

        // Scrape all registered houses
        $houseIds = ScraperRegistry::houseIds();
        $this->info('Dispatching scrape jobs for ' . count($houseIds) . ' auction houses...');

        $bar = $this->output->createProgressBar(count($houseIds));
        $bar->start();

        foreach ($houseIds as $id) {
            if ($sync) {
                (new ScrapeAuctionHouseJob($id))->handle();
            } else {
                ScrapeAuctionHouseJob::dispatch($id)
                    ->delay(now()->addSeconds(array_search($id, $houseIds) * 10)); // Stagger by 10s
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All scrape jobs dispatched. Monitor progress in the admin panel.');

        return self::SUCCESS;
    }
}
