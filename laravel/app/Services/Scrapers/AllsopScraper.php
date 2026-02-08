<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Allsop (https://www.allsop.co.uk/auctions/)
 * Allsop typically lists auctions with lot catalogues.
 */
class AllsopScraper extends BaseScraper
{
    protected int $auctionHouseId = 5;
    protected string $auctionHouseName = 'Allsop';
    protected string $baseUrl = 'https://www.allsop.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/auctions/residential/');

        // Find auction listing links
        $page->filter('.auction-lot, .lot-card, .property-card, [class*="lot"]')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .lot-title, .property-title')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price, [class*="price"]')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location, [class*="address"]')->first()->text(''));
                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
                    'region' => $this->inferRegion($address),
                    'property_type' => $this->inferPropertyType($title . ' ' . $address),
                    'lot_condition' => $this->inferCondition($title),
                    'bedrooms' => $this->inferBedrooms($title),
                    'guide_price_low' => $priceLow,
                    'guide_price_high' => $priceHigh,
                    'external_url' => $link ? $this->baseUrl . $link : null,
                ];
            } catch (\Exception $e) {
                // Skip unparseable lots
            }
        });

        return $lots;
    }

    private function inferRegion(string $address): string
    {
        $address = strtolower($address);
        $regionMap = [
            'london' => 'London', 'croydon' => 'London', 'bromley' => 'London',
            'manchester' => 'North West', 'liverpool' => 'North West',
            'birmingham' => 'West Midlands', 'coventry' => 'West Midlands',
            'leeds' => 'Yorkshire', 'sheffield' => 'Yorkshire',
            'newcastle' => 'North East', 'sunderland' => 'North East',
            'bristol' => 'South West', 'exeter' => 'South West',
            'cardiff' => 'Wales', 'swansea' => 'Wales',
            'edinburgh' => 'Scotland', 'glasgow' => 'Scotland',
            'cambridge' => 'East Anglia', 'norwich' => 'East Anglia',
            'nottingham' => 'East Midlands', 'leicester' => 'East Midlands',
        ];

        foreach ($regionMap as $keyword => $region) {
            if (str_contains($address, $keyword)) return $region;
        }

        return 'South East';
    }
}
