<?php

namespace App\Services\Scrapers;

use App\Models\Lot;
use App\Models\ScrapeLog;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;

abstract class BaseScraper
{
    protected Client $http;
    protected int $auctionHouseId;
    protected string $auctionHouseName;
    protected string $baseUrl;

    public function __construct()
    {
        $this->http = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'en-GB,en;q=0.9',
            ],
            'verify' => false,
        ]);
    }

    /**
     * Main scrape entry point.
     * Returns a ScrapeLog record.
     */
    public function scrape(): ScrapeLog
    {
        $startTime = microtime(true);
        $log = new ScrapeLog([
            'auction_house_id' => $this->auctionHouseId,
            'status' => 'failed',
            'lots_found' => 0,
            'lots_new' => 0,
            'created_at' => now(),
        ]);

        try {
            $lots = $this->fetchLots();
            $log->lots_found = count($lots);

            $newCount = 0;
            foreach ($lots as $lotData) {
                $created = $this->upsertLot($lotData);
                if ($created) $newCount++;
            }

            $log->lots_new = $newCount;
            $log->status = count($lots) > 0 ? 'success' : 'partial';

            Log::info("[Scraper] {$this->auctionHouseName}: Found {$log->lots_found} lots, {$newCount} new");
        } catch (\Exception $e) {
            $log->status = 'failed';
            $log->error_message = substr($e->getMessage(), 0, 2000);
            Log::error("[Scraper] {$this->auctionHouseName} failed: " . $e->getMessage());
        }

        $log->duration_ms = (int) ((microtime(true) - $startTime) * 1000);
        $log->save();

        return $log;
    }

    /**
     * Fetch and parse lots from the auction house website.
     * Must return array of lot data arrays.
     */
    abstract protected function fetchLots(): array;

    /**
     * Fetch HTML from a URL and return a Crawler instance.
     */
    protected function getPage(string $url): Crawler
    {
        $response = $this->http->get($url);
        $html = (string) $response->getBody();
        return new Crawler($html);
    }

    /**
     * Fetch JSON from a URL.
     */
    protected function getJson(string $url): array
    {
        $response = $this->http->get($url, [
            'headers' => ['Accept' => 'application/json'],
        ]);
        return json_decode((string) $response->getBody(), true) ?: [];
    }

    /**
     * Insert or update a lot record.
     * Returns true if a new record was created.
     */
    protected function upsertLot(array $data): bool
    {
        // Build a unique key from auction_house_id + title + auction_date
        $existing = Lot::where('auction_house_id', $this->auctionHouseId)
            ->where('title', $data['title'] ?? '')
            ->where('auction_date', $data['auction_date'] ?? null)
            ->first();

        if ($existing) {
            // Update existing lot
            $existing->update(array_filter($data, fn ($v) => $v !== null));
            return false;
        }

        // Create new lot
        Lot::create(array_merge($data, [
            'auction_house_id' => $this->auctionHouseId,
            'status' => 'upcoming',
        ]));

        return true;
    }

    /**
     * Parse a price string like "£150,000" to integer.
     */
    protected function parsePrice(string $priceStr): ?int
    {
        $cleaned = preg_replace('/[^0-9]/', '', $priceStr);
        return $cleaned ? (int) $cleaned : null;
    }

    /**
     * Parse a guide price range like "£100,000 - £120,000".
     * Returns [low, high] or [low, null].
     */
    protected function parsePriceRange(string $str): array
    {
        // Try range format: £100,000 - £120,000
        if (preg_match('/£?([\d,]+)\s*[-–to]+\s*£?([\d,]+)/i', $str, $m)) {
            return [
                (int) str_replace(',', '', $m[1]),
                (int) str_replace(',', '', $m[2]),
            ];
        }

        // Single price: £100,000+
        $price = $this->parsePrice($str);
        return [$price, null];
    }

    /**
     * Parse a date string into Y-m-d format.
     */
    protected function parseDate(string $dateStr): ?string
    {
        try {
            $date = new \DateTime($dateStr);
            return $date->format('Y-m-d');
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Determine property type from title/description.
     */
    protected function inferPropertyType(string $text): string
    {
        $text = strtolower($text);

        if (preg_match('/\bland\b|plot|acre|site|development site/i', $text)) return 'land';
        if (preg_match('/\boffice|shop|retail|commercial|warehouse|industrial|unit\b/i', $text)) return 'commercial';
        if (preg_match('/mixed.?use|shop.+flat|with.+flat.+above/i', $text)) return 'mixed';

        return 'residential';
    }

    /**
     * Determine lot condition from title/description.
     */
    protected function inferCondition(string $text): string
    {
        $text = strtolower($text);

        if (preg_match('/refurb|renovation|needs work|tlc|updating|improvement/i', $text)) return 'refurbishment';
        if (preg_match('/development|planning|conversion|building plot|pp for/i', $text)) return 'development';
        if (preg_match('/modern|new build|recently|good order|ready/i', $text)) return 'modern';

        return 'mixed';
    }

    /**
     * Extract bedrooms from title/description.
     */
    protected function inferBedrooms(string $text): ?int
    {
        if (preg_match('/(\d+)\s*[-\s]?bed/i', $text, $m)) {
            return (int) $m[1];
        }
        if (preg_match('/studio/i', $text)) return 0;
        return null;
    }

    /**
     * Clean and trim text.
     */
    protected function cleanText(string $text): string
    {
        return trim(preg_replace('/\s+/', ' ', $text));
    }
}
