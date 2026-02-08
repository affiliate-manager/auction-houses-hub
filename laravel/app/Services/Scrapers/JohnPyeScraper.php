<?php

namespace App\Services\Scrapers;

/**
 * Scraper for John Pye Property (https://www.johnpyeproperty.co.uk/)
 */
class JohnPyeScraper extends BaseScraper
{
    protected int $auctionHouseId = 73;
    protected string $auctionHouseName = 'John Pye';
    protected string $baseUrl = 'https://www.johnpyeproperty.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/property-auctions/');

        $page->filter('.property-card, .lot-card, .auction-lot')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .property-name')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location')->first()->text(''));
                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
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
