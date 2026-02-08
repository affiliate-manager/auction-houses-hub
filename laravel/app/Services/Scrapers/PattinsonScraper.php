<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Pattinson (https://www.pattinson.co.uk/auction)
 * North East focused auctioneer.
 */
class PattinsonScraper extends BaseScraper
{
    protected int $auctionHouseId = 100;
    protected string $auctionHouseName = 'Pattinson';
    protected string $baseUrl = 'https://www.pattinson.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/auction');

        $page->filter('.property-card, .lot-item, .auction-lot')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .property-title')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location')->first()->text(''));
                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
                    'region' => 'North East',
                    'property_type' => $this->inferPropertyType($title),
                    'lot_condition' => $this->inferCondition($title),
                    'bedrooms' => $this->inferBedrooms($title),
                    'guide_price_low' => $priceLow,
                    'guide_price_high' => $priceHigh,
                    'external_url' => $link ? ($this->baseUrl . $link) : null,
                ];
            } catch (\Exception) {
                // Skip
            }
        });

        return $lots;
    }
}
