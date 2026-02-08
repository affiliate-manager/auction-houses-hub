<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Barnard Marcus / Countrywide Property Auctions
 * (https://www.barnardmarcusauctions.co.uk/)
 */
class BarnardMarcusScraper extends BaseScraper
{
    protected int $auctionHouseId = 39;
    protected string $auctionHouseName = 'Barnard Marcus';
    protected string $baseUrl = 'https://www.barnardmarcusauctions.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/lots/current');

        $page->filter('.lot-card, .property-card, .listing-item')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .title')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location')->first()->text(''));
                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
                    'region' => 'London',
                    'property_type' => $this->inferPropertyType($title),
                    'lot_condition' => $this->inferCondition($title),
                    'bedrooms' => $this->inferBedrooms($title),
                    'guide_price_low' => $priceLow,
                    'guide_price_high' => $priceHigh,
                    'external_url' => $link ?: null,
                ];
            } catch (\Exception) {
                // Skip
            }
        });

        return $lots;
    }
}
