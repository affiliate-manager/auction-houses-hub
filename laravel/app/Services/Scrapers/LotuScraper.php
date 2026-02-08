<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Log;

/**
 * Scraper for Lotu.uk - UK property auction aggregator.
 * Lotu.uk collects listings from auction houses across the UK.
 * Pagination: /search?pa={page}&pt={type}
 * Types: house, flat, commercial, land
 */
class LotuScraper extends BaseScraper
{
    protected int $auctionHouseId = 999; // Special ID for aggregator
    protected string $auctionHouseName = 'Lotu.uk (Aggregator)';
    protected string $baseUrl = 'https://www.lotu.uk';

    /**
     * Property types to scrape.
     */
    protected array $propertyTypes = ['house', 'flat', 'commercial', 'land'];

    /**
     * Max pages per property type (safety limit).
     */
    protected int $maxPagesPerType = 30;

    protected function fetchLots(): array
    {
        $allLots = [];

        foreach ($this->propertyTypes as $type) {
            $typeLots = $this->scrapeType($type);
            $allLots = array_merge($allLots, $typeLots);
            Log::info("[LotuScraper] Type '{$type}': found " . count($typeLots) . " lots");

            // Be polite - pause between types
            sleep(2);
        }

        return $allLots;
    }

    /**
     * Scrape all pages for a given property type.
     */
    private function scrapeType(string $type): array
    {
        $lots = [];

        for ($page = 0; $page < $this->maxPagesPerType; $page++) {
            $url = "{$this->baseUrl}/search?pa={$page}&pt={$type}";

            try {
                $crawler = $this->getPage($url);
            } catch (\Exception $e) {
                Log::warning("[LotuScraper] Failed to fetch page {$page} for type {$type}: " . $e->getMessage());
                break;
            }

            $pageLots = $this->parsePage($crawler, $type);

            if (empty($pageLots)) {
                // No more lots on this page - stop pagination
                break;
            }

            $lots = array_merge($lots, $pageLots);

            // Be polite - pause between pages
            usleep(500000); // 0.5 seconds
        }

        return $lots;
    }

    /**
     * Parse a single search results page.
     */
    private function parsePage($crawler, string $type): array
    {
        $lots = [];

        // Each listing is wrapped in an element containing the auction details
        // Lotu.uk uses Next.js SSR, listings have structured content with:
        // - property type badge, tenure badge
        // - image
        // - h2 title (inside a link)
        // - description
        // - "Auction Date" + date
        // - "Guide Price" + price
        // - "View auction details" link

        // Try to find listing blocks - they contain links to /auctions/{id}/{slug}
        $crawler->filter('a[href*="/auctions/"]')->each(function ($node) use (&$lots, $type) {
            try {
                $href = $node->attr('href');

                // Skip non-listing links (e.g. pagination, article links)
                if (!$href || !preg_match('#^/auctions/\d+/#', $href)) return;

                // Get the parent container text to extract all fields
                $text = $node->text('');
                if (empty($text)) return;

                // Extract title from h2
                $title = '';
                try {
                    $h2 = $node->filter('h2');
                    if ($h2->count()) {
                        $title = $this->cleanText($h2->first()->text(''));
                    }
                } catch (\Exception $e) {}

                if (empty($title)) return;

                // Avoid duplicate entries (same href)
                foreach ($lots as $existing) {
                    if (($existing['external_url'] ?? '') === $this->baseUrl . $href) return;
                }

                // Extract guide price
                $guidePrice = null;
                if (preg_match('/(?:Guide Price|Price)[:\s]*£([\d,]+)/i', $text, $m)) {
                    $guidePrice = (int) str_replace(',', '', $m[1]);
                }

                // Extract auction date
                $auctionDate = null;
                if (preg_match('/Auction Date[:\s]*(\d{1,2}\s+\w+\s+\d{4})/i', $text, $m)) {
                    $auctionDate = $this->parseDate($m[1]);
                }

                // Extract image URL
                $imageUrl = null;
                try {
                    $img = $node->filter('img');
                    if ($img->count()) {
                        $imageUrl = $img->first()->attr('src');
                    }
                } catch (\Exception $e) {}

                // Detect tenure from text
                $tenure = 'unknown';
                if (preg_match('/\bfreehold\b/i', $text)) $tenure = 'freehold';
                elseif (preg_match('/\bleasehold\b/i', $text)) $tenure = 'leasehold';

                // Try to detect auction house from image URL or description
                $houseId = $this->inferAuctionHouseId($text, $imageUrl);

                // Map lotu type to our enum
                $propertyType = $this->mapPropertyType($type);

                $lots[] = [
                    'auction_house_id' => $houseId,
                    'title' => $title,
                    'address' => $this->extractAddress($title, $text),
                    'region' => $this->inferRegionFromText($text),
                    'property_type' => $propertyType,
                    'lot_condition' => $this->inferCondition($title . ' ' . $text),
                    'bedrooms' => $this->inferBedrooms($title . ' ' . $text),
                    'guide_price_low' => $guidePrice,
                    'guide_price_high' => null,
                    'auction_date' => $auctionDate,
                    'image_url' => $imageUrl,
                    'external_url' => $this->baseUrl . $href,
                ];
            } catch (\Exception $e) {
                // Skip unparseable listings
            }
        });

        return $lots;
    }

    /**
     * Map Lotu.uk property type to our enum.
     */
    private function mapPropertyType(string $lotuType): string
    {
        return match ($lotuType) {
            'house' => 'residential',
            'flat' => 'residential',
            'commercial' => 'commercial',
            'land' => 'land',
            default => 'residential',
        };
    }

    /**
     * Try to extract an address from the title or description.
     */
    private function extractAddress(string $title, string $text): string
    {
        // Many lotu.uk titles include location info like "in Bath", "in South Shields"
        if (preg_match('/(?:in|at|,)\s+([A-Z][a-zA-Z\s,]+)$/u', $title, $m)) {
            return trim($m[1]);
        }
        return $title;
    }

    /**
     * Try to infer region from the full text content.
     */
    private function inferRegionFromText(string $text): string
    {
        $text = strtolower($text);
        $regionMap = [
            'london' => 'London', 'croydon' => 'London', 'bromley' => 'London',
            'hackney' => 'London', 'islington' => 'London', 'camden' => 'London',
            'westminster' => 'London', 'tower hamlets' => 'London', 'southwark' => 'London',
            'manchester' => 'North West', 'liverpool' => 'North West', 'bolton' => 'North West',
            'wigan' => 'North West', 'preston' => 'North West', 'blackpool' => 'North West',
            'birmingham' => 'West Midlands', 'coventry' => 'West Midlands', 'wolverhampton' => 'West Midlands',
            'stoke' => 'West Midlands', 'dudley' => 'West Midlands',
            'leeds' => 'Yorkshire', 'sheffield' => 'Yorkshire', 'bradford' => 'Yorkshire',
            'hull' => 'Yorkshire', 'doncaster' => 'Yorkshire', 'huddersfield' => 'Yorkshire',
            'halifax' => 'Yorkshire', 'york' => 'Yorkshire',
            'newcastle' => 'North East', 'sunderland' => 'North East', 'durham' => 'North East',
            'middlesbrough' => 'North East', 'redcar' => 'North East', 'south shields' => 'North East',
            'bristol' => 'South West', 'exeter' => 'South West', 'plymouth' => 'South West',
            'bath' => 'South West', 'gloucester' => 'South West', 'devon' => 'South West',
            'cornwall' => 'South West', 'somerset' => 'South West',
            'cardiff' => 'Wales', 'swansea' => 'Wales', 'newport' => 'Wales',
            'wrexham' => 'Wales', 'welsh' => 'Wales', 'wales' => 'Wales',
            'edinburgh' => 'Scotland', 'glasgow' => 'Scotland', 'dundee' => 'Scotland',
            'aberdeen' => 'Scotland', 'scotland' => 'Scotland',
            'cambridge' => 'East Anglia', 'norwich' => 'East Anglia', 'ipswich' => 'East Anglia',
            'norfolk' => 'East Anglia', 'suffolk' => 'East Anglia',
            'nottingham' => 'East Midlands', 'leicester' => 'East Midlands', 'derby' => 'East Midlands',
            'northampton' => 'East Midlands', 'lincoln' => 'East Midlands',
            'kent' => 'South East', 'surrey' => 'South East', 'sussex' => 'South East',
            'essex' => 'South East', 'hertford' => 'South East', 'brighton' => 'South East',
            'guildford' => 'South East', 'reading' => 'South East', 'oxford' => 'South East',
        ];

        foreach ($regionMap as $keyword => $region) {
            if (str_contains($text, $keyword)) return $region;
        }

        return 'National';
    }

    /**
     * Override upsertLot to use per-lot auction_house_id (aggregator has multiple houses).
     */
    protected function upsertLot(array $data): bool
    {
        $houseId = $data['auction_house_id'] ?? $this->auctionHouseId;

        $existing = \App\Models\Lot::where('auction_house_id', $houseId)
            ->where('title', $data['title'] ?? '')
            ->where('auction_date', $data['auction_date'] ?? null)
            ->first();

        if ($existing) {
            $existing->update(array_filter($data, fn ($v) => $v !== null));
            return false;
        }

        \App\Models\Lot::create(array_merge($data, [
            'auction_house_id' => $houseId,
            'status' => 'upcoming',
        ]));

        return true;
    }

    /**
     * Try to match the listing to one of our 100 auction houses by image URL domain or text.
     */
    private function inferAuctionHouseId(string $text, ?string $imageUrl): int
    {
        // Check image URL for known auction house domains
        $domainMap = [
            'allsop.co.uk' => 5,
            'auctionhouse.co.uk' => 13,
            'bondwolfe' => 19,
            'cliveemson' => 36,
            'barnardmarcus' => 39,
            'iamsold' => 71,
            'johnpye' => 73,
            'networkauctions' => 96,
            'pattinson' => 100,
            'futurepropertyauctions' => 53,
            'acuitus' => 1,
            'strettons' => 0,
            'eigpropertyauctions' => 0,
            'savills' => 0,
            'mchugo' => 0,
        ];

        $checkStr = strtolower(($imageUrl ?? '') . ' ' . $text);

        foreach ($domainMap as $domain => $id) {
            if ($id > 0 && str_contains($checkStr, $domain)) {
                return $id;
            }
        }

        // Default: use 999 (aggregator / unmatched)
        return 999;
    }
}
