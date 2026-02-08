<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Network Auctions (https://www.networkauctions.com/)
 * London-focused with nationwide lots.
 */
class NetworkAuctionsScraper extends BaseScraper
{
    protected int $auctionHouseId = 96;
    protected string $auctionHouseName = 'Network Auctions';
    protected string $baseUrl = 'https://www.networkauctions.com';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/lots/');

        $page->filter('.lot, .property-item, .catalogue-entry')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .lot-title')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.price, .guide-price, .guide')->first()->text('');
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
                    'external_url' => $link ? ($this->baseUrl . $link) : null,
                ];
            } catch (\Exception) {
                // Skip
            }
        });

        return $lots;
    }
}
