<?php

namespace App\Services\Scrapers;

/**
 * Scraper for Auction House UK (https://www.auctionhouse.co.uk/)
 * National network with regional branches and a central catalogue.
 */
class AuctionHouseUKScraper extends BaseScraper
{
    protected int $auctionHouseId = 13;
    protected string $auctionHouseName = 'Auction House UK';
    protected string $baseUrl = 'https://www.auctionhouse.co.uk';

    protected function fetchLots(): array
    {
        $lots = [];
        $page = $this->getPage($this->baseUrl . '/search/results');

        $page->filter('.lot-item, .property-listing, .search-result-item')->each(function ($node) use (&$lots) {
            try {
                $title = $this->cleanText($node->filter('h2, h3, .lot-name, .property-name')->first()->text(''));
                if (empty($title)) return;

                $priceText = $node->filter('.guide-price, .price, [class*="price"]')->first()->text('');
                [$priceLow, $priceHigh] = $this->parsePriceRange($priceText);

                $address = $this->cleanText($node->filter('.address, .location')->first()->text(''));

                $dateText = $node->filter('.auction-date, .date, [class*="date"]')->first()->text('');
                $auctionDate = $this->parseDate($dateText);

                $lotNum = null;
                $lotText = $node->filter('.lot-number, [class*="lot-num"]')->first()->text('');
                if (preg_match('/lot\s*(\d+)/i', $lotText, $m)) {
                    $lotNum = (int) $m[1];
                }

                $link = $node->filter('a')->first()->attr('href');

                $lots[] = [
                    'title' => $title,
                    'address' => $address,
                    'postcode' => $this->extractPostcode($address),
                    'region' => $this->inferRegionFromAddress($address),
                    'property_type' => $this->inferPropertyType($title),
                    'lot_condition' => $this->inferCondition($title),
                    'bedrooms' => $this->inferBedrooms($title),
                    'guide_price_low' => $priceLow,
                    'guide_price_high' => $priceHigh,
                    'auction_date' => $auctionDate,
                    'lot_number' => $lotNum,
                    'external_url' => $link ? ($this->baseUrl . $link) : null,
                ];
            } catch (\Exception $e) {
                // Skip
            }
        });

        return $lots;
    }

    private function extractPostcode(string $text): ?string
    {
        if (preg_match('/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i', $text, $m)) {
            return strtoupper(trim($m[1]));
        }
        return null;
    }

    private function inferRegionFromAddress(string $address): string
    {
        $map = [
            'London' => ['london', 'croydon', 'bromley', 'greenwich', 'lambeth', 'southwark', 'hackney', 'islington', 'camden', 'westminster', 'kensington', 'hammersmith', 'wandsworth', 'lewisham', 'tower hamlets', 'newham', 'barking', 'redbridge', 'havering', 'bexley', 'enfield', 'barnet', 'haringey', 'waltham forest', 'ealing', 'hounslow', 'richmond', 'kingston', 'merton', 'sutton'],
            'North West' => ['manchester', 'liverpool', 'bolton', 'stockport', 'oldham', 'burnley', 'blackpool', 'preston', 'lancaster', 'chester', 'warrington', 'wigan'],
            'North East' => ['newcastle', 'sunderland', 'durham', 'middlesbrough', 'gateshead', 'darlington'],
            'Yorkshire' => ['leeds', 'sheffield', 'bradford', 'york', 'hull', 'barnsley', 'rotherham', 'doncaster', 'wakefield', 'huddersfield', 'halifax'],
            'West Midlands' => ['birmingham', 'coventry', 'wolverhampton', 'stoke', 'stafford', 'worcester', 'hereford', 'telford', 'walsall', 'dudley', 'solihull', 'smethwick'],
            'East Midlands' => ['nottingham', 'derby', 'leicester', 'northampton', 'lincoln'],
            'East Anglia' => ['norwich', 'cambridge', 'ipswich', 'bury st edmunds', 'colchester', 'peterborough'],
            'South East' => ['brighton', 'reading', 'oxford', 'southampton', 'portsmouth', 'canterbury', 'maidstone', 'guildford', 'folkestone', 'ashford', 'southend'],
            'South West' => ['bristol', 'bath', 'exeter', 'plymouth', 'bournemouth', 'taunton', 'gloucester', 'cheltenham', 'swindon'],
            'Wales' => ['cardiff', 'swansea', 'newport', 'wrexham', 'carmarthen', 'aberystwyth', 'llanelli', 'pontardawe'],
            'Scotland' => ['edinburgh', 'glasgow', 'aberdeen', 'dundee', 'inverness', 'perth', 'stirling'],
        ];

        $lower = strtolower($address);
        foreach ($map as $region => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($lower, $kw)) return $region;
            }
        }

        return 'South East';
    }
}
