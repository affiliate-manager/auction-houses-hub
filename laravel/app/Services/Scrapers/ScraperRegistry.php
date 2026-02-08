<?php

namespace App\Services\Scrapers;

/**
 * Maps auction_house_id to scraper class.
 * Add new scrapers here as they're implemented.
 */
class ScraperRegistry
{
    /**
     * Registry of active scrapers.
     * Key: auction_house_id (from data.js)
     * Value: Scraper class name
     */
    protected static array $scrapers = [
        5   => AllsopScraper::class,          // Allsop
        13  => AuctionHouseUKScraper::class,  // Auction House UK
        19  => BondWolfeScraper::class,        // Bond Wolfe
        36  => CliveEmsonScraper::class,       // Clive Emson
        39  => BarnardMarcusScraper::class,    // Countrywide/Barnard Marcus
        71  => IamSoldScraper::class,          // iam-sold
        73  => JohnPyeScraper::class,          // John Pye
        96  => NetworkAuctionsScraper::class,  // Network Auctions
        100 => PattinsonScraper::class,        // Pattinson
        999 => LotuScraper::class,             // Lotu.uk (Aggregator)
    ];

    /**
     * Get all registered scraper classes.
     */
    public static function all(): array
    {
        return static::$scrapers;
    }

    /**
     * Get scraper for a specific auction house.
     */
    public static function get(int $houseId): ?BaseScraper
    {
        $class = static::$scrapers[$houseId] ?? null;
        if ($class && class_exists($class)) {
            return new $class();
        }
        return null;
    }

    /**
     * Check if a scraper exists for a house.
     */
    public static function has(int $houseId): bool
    {
        return isset(static::$scrapers[$houseId]);
    }

    /**
     * Get all registered house IDs.
     */
    public static function houseIds(): array
    {
        return array_keys(static::$scrapers);
    }

    /**
     * Register a new scraper.
     */
    public static function register(int $houseId, string $scraperClass): void
    {
        static::$scrapers[$houseId] = $scraperClass;
    }
}
