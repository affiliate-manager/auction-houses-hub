<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Clive Emson (https://www.cliveemson.co.uk/)
 * 8 regional auctions per year across Southern England.
 */
class CliveEmsonScraper extends BaseScraper
{
    protected int $auctionHouseId = 36;
    protected string $auctionHouseName = 'Clive Emson';
    protected string $baseUrl = 'https://www.cliveemson.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/current-lots/');

        $page->filter('.lot, .lot-item, .catalogue-lot')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .lot-title, .lot-address')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.guide, .guide-price, .price')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $title,
                    'region' => 'South East',
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
