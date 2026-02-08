<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Bond Wolfe (https://www.bondwolfe.com/)
 * Birmingham-based auctioneer, strong in West Midlands.
 */
class BondWolfeScraper extends BaseScraper
{
    protected int $auctionHouseId = 19;
    protected string $auctionHouseName = 'Bond Wolfe';
    protected string $baseUrl = 'https://www.bondwolfe.com';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/auction-lots/');

        $page->filter('.lot-card, .property-item, article.lot')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .lot-title')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location')->first()->text(''));
                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
                    'region' => 'West Midlands',
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
