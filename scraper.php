<?php
/**
 * UK Property Auction Lots Scraper
 * 
 * Standalone PHP script that scrapes auction listings from Lotu.uk
 * and saves them as a JSON file for the frontend to consume.
 * 
 * Run via Cloudways Cron Job every 6 hours.
 * 
 * Usage: php scraper.php
 */

// === Configuration ===
define('BASE_URL', 'https://www.lotu.uk');
define('OUTPUT_FILE', __DIR__ . '/lots-data.json');
define('LOG_FILE', __DIR__ . '/scraper.log');
define('MAX_PAGES_PER_TYPE', 30);
define('PROPERTY_TYPES', ['house', 'flat', 'commercial', 'land']);
define('REQUEST_DELAY_MS', 600);   // Delay between requests (ms)
define('TYPE_DELAY_MS', 2000);     // Delay between property types (ms)
define('USER_AGENT', 'Mozilla/5.0 (compatible; AuctionHubBot/1.0; +https://lendlord.io)');

// === Region mapping ===
$REGION_MAP = [
    'london' => 'London', 'croydon' => 'London', 'bromley' => 'London',
    'hackney' => 'London', 'islington' => 'London', 'camden' => 'London',
    'westminster' => 'London', 'tower hamlets' => 'London', 'southwark' => 'London',
    'lambeth' => 'London', 'brixton' => 'London', 'lewisham' => 'London',
    'greenwich' => 'London', 'barnet' => 'London', 'ealing' => 'London',
    'hammersmith' => 'London', 'wandsworth' => 'London', 'hounslow' => 'London',
    'manchester' => 'North West', 'liverpool' => 'North West', 'bolton' => 'North West',
    'wigan' => 'North West', 'preston' => 'North West', 'blackpool' => 'North West',
    'oldham' => 'North West', 'rochdale' => 'North West', 'burnley' => 'North West',
    'blackburn' => 'North West', 'salford' => 'North West', 'warrington' => 'North West',
    'stockport' => 'North West', 'hyde' => 'North West', 'chester' => 'North West',
    'birmingham' => 'West Midlands', 'coventry' => 'West Midlands', 'wolverhampton' => 'West Midlands',
    'stoke' => 'West Midlands', 'dudley' => 'West Midlands', 'walsall' => 'West Midlands',
    'solihull' => 'West Midlands', 'west bromwich' => 'West Midlands',
    'leeds' => 'Yorkshire', 'sheffield' => 'Yorkshire', 'bradford' => 'Yorkshire',
    'hull' => 'Yorkshire', 'doncaster' => 'Yorkshire', 'huddersfield' => 'Yorkshire',
    'halifax' => 'Yorkshire', 'york' => 'Yorkshire', 'rotherham' => 'Yorkshire',
    'barnsley' => 'Yorkshire', 'wakefield' => 'Yorkshire', 'harrogate' => 'Yorkshire',
    'hillsborough' => 'Yorkshire', 'scarborough' => 'Yorkshire',
    'newcastle' => 'North East', 'sunderland' => 'North East', 'durham' => 'North East',
    'middlesbrough' => 'North East', 'redcar' => 'North East', 'south shields' => 'North East',
    'gateshead' => 'North East', 'hartlepool' => 'North East', 'darlington' => 'North East',
    'bristol' => 'South West', 'exeter' => 'South West', 'plymouth' => 'South West',
    'bath' => 'South West', 'gloucester' => 'South West', 'devon' => 'South West',
    'cornwall' => 'South West', 'somerset' => 'South West', 'taunton' => 'South West',
    'dorset' => 'South West', 'wiltshire' => 'South West', 'swindon' => 'South West',
    'cardiff' => 'Wales', 'swansea' => 'Wales', 'newport' => 'Wales',
    'wrexham' => 'Wales', 'welsh' => 'Wales', 'wales' => 'Wales',
    'penygroes' => 'Wales', 'llanelli' => 'Wales', 'rhyl' => 'Wales',
    'edinburgh' => 'Scotland', 'glasgow' => 'Scotland', 'dundee' => 'Scotland',
    'aberdeen' => 'Scotland', 'scotland' => 'Scotland', 'inverness' => 'Scotland',
    'cambridge' => 'East Anglia', 'norwich' => 'East Anglia', 'ipswich' => 'East Anglia',
    'norfolk' => 'East Anglia', 'suffolk' => 'East Anglia', 'peterborough' => 'East Anglia',
    'nottingham' => 'East Midlands', 'leicester' => 'East Midlands', 'derby' => 'East Midlands',
    'northampton' => 'East Midlands', 'lincoln' => 'East Midlands',
    'kent' => 'South East', 'surrey' => 'South East', 'sussex' => 'South East',
    'essex' => 'South East', 'hertford' => 'South East', 'brighton' => 'South East',
    'guildford' => 'South East', 'reading' => 'South East', 'oxford' => 'South East',
    'milton keynes' => 'South East', 'bedford' => 'South East', 'luton' => 'South East',
    'colchester' => 'South East', 'chelmsford' => 'South East', 'basildon' => 'South East',
    'maidstone' => 'South East', 'canterbury' => 'South East', 'dover' => 'South East',
    'portsmouth' => 'South East', 'southampton' => 'South East', 'winchester' => 'South East',
    'crawley' => 'South East', 'hastings' => 'South East',
];

// === Auction house domain-to-ID mapping ===
$HOUSE_MAP = [
    'eigpropertyauctions' => 44, 'allsop' => 5, 'auctionhouse.co.uk' => 13,
    'bondwolfe' => 19, 'cliveemson' => 36, 'barnardmarcus' => 39,
    'iamsold' => 71, 'johnpye' => 73, 'networkauctions' => 96,
    'pattinson' => 100, 'futurepropertyauctions' => 53, 'acuitus' => 1,
    'savills' => 86, 'sdl' => 89, 'edwardmellor' => 43,
    'bidx1' => 0, 'alto3' => 0,
];

// ============================================================
// Main
// ============================================================
function main() {
    logMsg("=== Scraper started ===");
    
    $allLots = [];
    $stats = ['total' => 0, 'by_type' => []];
    
    foreach (PROPERTY_TYPES as $type) {
        logMsg("Scraping type: {$type}");
        $lots = scrapeType($type);
        $stats['by_type'][$type] = count($lots);
        $allLots = array_merge($allLots, $lots);
        logMsg("  Found " . count($lots) . " lots for {$type}");
        usleep(TYPE_DELAY_MS * 1000);
    }
    
    // Deduplicate by external_url
    $unique = [];
    $seen = [];
    foreach ($allLots as $lot) {
        $key = $lot['external_url'] ?? $lot['title'];
        if (!isset($seen[$key])) {
            $seen[$key] = true;
            $unique[] = $lot;
        }
    }
    
    $stats['total'] = count($unique);
    $stats['scraped_at'] = date('c');
    $stats['next_scrape'] = date('c', time() + 6 * 3600);
    
    // Sort by auction date (soonest first), then by price
    usort($unique, function($a, $b) {
        $dateA = $a['auction_date'] ?? '9999-12-31';
        $dateB = $b['auction_date'] ?? '9999-12-31';
        if ($dateA !== $dateB) return strcmp($dateA, $dateB);
        return ($a['guide_price'] ?? 0) - ($b['guide_price'] ?? 0);
    });
    
    // Filter out past auctions
    $today = date('Y-m-d');
    $upcoming = array_values(array_filter($unique, function($lot) use ($today) {
        return !isset($lot['auction_date']) || $lot['auction_date'] >= $today;
    }));
    
    // Build output
    $output = [
        'lots' => $upcoming,
        'stats' => $stats,
        'generated_at' => date('c'),
    ];
    
    // Write JSON
    $json = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        logMsg("ERROR: JSON encoding failed: " . json_last_error_msg());
        exit(1);
    }
    
    $bytes = file_put_contents(OUTPUT_FILE, $json);
    if ($bytes === false) {
        logMsg("ERROR: Failed to write " . OUTPUT_FILE);
        exit(1);
    }
    
    logMsg("Wrote {$bytes} bytes to " . OUTPUT_FILE);
    logMsg("Total: {$stats['total']} upcoming lots (house: {$stats['by_type']['house']}, flat: {$stats['by_type']['flat']}, commercial: {$stats['by_type']['commercial']}, land: {$stats['by_type']['land']})");
    logMsg("=== Scraper finished ===\n");
    
    // Print summary for cron log
    echo "OK: {$stats['total']} lots scraped at " . date('Y-m-d H:i:s') . "\n";
}

// ============================================================
// Scrape all pages for a property type
// ============================================================
function scrapeType(string $type): array {
    $lots = [];
    
    for ($page = 0; $page < MAX_PAGES_PER_TYPE; $page++) {
        $url = BASE_URL . "/search?pa={$page}&pt={$type}";
        
        $html = fetchPage($url);
        if ($html === false) {
            logMsg("  Failed to fetch page {$page} for {$type}, stopping.");
            break;
        }
        
        $pageLots = parsePage($html, $type);
        
        if (empty($pageLots)) {
            // No more lots on this page
            break;
        }
        
        $lots = array_merge($lots, $pageLots);
        logMsg("  Page {$page}: " . count($pageLots) . " lots (total: " . count($lots) . ")");
        
        usleep(REQUEST_DELAY_MS * 1000);
    }
    
    return $lots;
}

// ============================================================
// Fetch a page via cURL
// ============================================================
function fetchPage(string $url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => USER_AGENT,
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml',
            'Accept-Language: en-GB,en;q=0.9',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || $httpCode !== 200) {
        logMsg("  HTTP error: code={$httpCode}, error={$error}");
        return false;
    }
    
    return $response;
}

// ============================================================
// Parse HTML page and extract lot listings
// ============================================================
function parsePage(string $html, string $type): array {
    $lots = [];
    
    // Use DOMDocument to parse HTML
    $doc = new DOMDocument();
    @$doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
    $xpath = new DOMXPath($doc);
    
    // Find all links to /auctions/{id}/{slug}
    $links = $xpath->query('//a[contains(@href, "/auctions/")]');
    
    $seenUrls = [];
    
    foreach ($links as $link) {
        $href = $link->getAttribute('href');
        
        // Only process listing links: /auctions/{number}/{slug}
        if (!preg_match('#^/auctions/\d+/.+#', $href)) continue;
        
        $fullUrl = BASE_URL . $href;
        
        // Skip duplicates on same page
        if (isset($seenUrls[$fullUrl])) continue;
        $seenUrls[$fullUrl] = true;
        
        // Get the full text content of the link container
        $text = trim($link->textContent);
        if (empty($text)) continue;
        
        // Extract title from h2
        $title = '';
        $h2s = $xpath->query('.//h2', $link);
        if ($h2s->length > 0) {
            $title = trim($h2s->item(0)->textContent);
        }
        if (empty($title)) continue;
        
        // Extract image URL
        $imageUrl = null;
        $imgs = $xpath->query('.//img', $link);
        if ($imgs->length > 0) {
            $imageUrl = $imgs->item(0)->getAttribute('src');
            // Also check srcset for better images
            $srcset = $imgs->item(0)->getAttribute('srcset');
            if ($srcset && !$imageUrl) {
                // Get first URL from srcset
                if (preg_match('/^(\S+)/', $srcset, $m)) {
                    $imageUrl = $m[1];
                }
            }
        }
        
        // Extract guide price
        $guidePrice = null;
        if (preg_match('/(?:Guide Price|Price)\s*£([\d,]+)/i', $text, $m)) {
            $guidePrice = (int)str_replace(',', '', $m[1]);
        }
        
        // Extract auction date
        $auctionDate = null;
        if (preg_match('/Auction Date\s*(\d{1,2}\s+\w+\s+\d{4})/i', $text, $m)) {
            $auctionDate = parseAuctionDate($m[1]);
        }
        
        // Detect tenure
        $tenure = null;
        if (preg_match('/\bfreehold\b/i', $text)) $tenure = 'freehold';
        elseif (preg_match('/\bleasehold\b/i', $text)) $tenure = 'leasehold';
        
        // Detect bedrooms from title
        $bedrooms = null;
        if (preg_match('/(\d+)\s*(?:bed|bedroom)/i', $title . ' ' . $text, $m)) {
            $bedrooms = (int)$m[1];
        }
        
        // Map property type
        $propertyType = mapPropertyType($type);
        
        // Infer region
        $region = inferRegion($title . ' ' . $text);
        
        // Infer auction house from image URL
        $houseId = inferAuctionHouseId($text, $imageUrl);
        
        // Infer condition
        $condition = inferCondition($title . ' ' . $text);
        
        // Extract address (from title)
        $address = extractAddress($title, $text);
        
        $lots[] = [
            'title' => $title,
            'address' => $address,
            'region' => $region,
            'property_type' => $propertyType,
            'guide_price' => $guidePrice,
            'auction_date' => $auctionDate,
            'bedrooms' => $bedrooms,
            'tenure' => $tenure,
            'condition' => $condition,
            'image_url' => $imageUrl,
            'external_url' => $fullUrl,
            'auction_house_id' => $houseId,
        ];
    }
    
    return $lots;
}

// ============================================================
// Helper functions
// ============================================================

function parseAuctionDate(string $dateStr): ?string {
    $months = [
        'jan' => '01', 'feb' => '02', 'mar' => '03', 'apr' => '04',
        'may' => '05', 'jun' => '06', 'jul' => '07', 'aug' => '08',
        'sep' => '09', 'oct' => '10', 'nov' => '11', 'dec' => '12',
    ];
    
    if (preg_match('/(\d{1,2})\s+(\w{3})\w*\s+(\d{4})/', $dateStr, $m)) {
        $month = $months[strtolower(substr($m[2], 0, 3))] ?? null;
        if ($month) {
            return sprintf('%s-%s-%02d', $m[3], $month, (int)$m[1]);
        }
    }
    
    // Try strtotime as fallback
    $ts = strtotime($dateStr);
    if ($ts) return date('Y-m-d', $ts);
    
    return null;
}

function mapPropertyType(string $lotuType): string {
    return match($lotuType) {
        'house', 'flat' => 'residential',
        'commercial' => 'commercial',
        'land' => 'land',
        default => 'residential',
    };
}

function inferRegion(string $text): string {
    global $REGION_MAP;
    $lower = strtolower($text);
    
    foreach ($REGION_MAP as $keyword => $region) {
        if (strpos($lower, $keyword) !== false) {
            return $region;
        }
    }
    return 'National';
}

function inferAuctionHouseId(string $text, ?string $imageUrl): int {
    global $HOUSE_MAP;
    $check = strtolower(($imageUrl ?? '') . ' ' . $text);
    
    foreach ($HOUSE_MAP as $domain => $id) {
        if ($id > 0 && strpos($check, $domain) !== false) {
            return $id;
        }
    }
    return 999; // Unmatched / aggregator
}

function inferCondition(string $text): string {
    $lower = strtolower($text);
    if (preg_match('/\b(derelict|dilapidated|uninhabitable|shell)\b/', $lower)) return 'development';
    if (preg_match('/\b(refurb|renovation|modernis|requires? (?:updating|improvement|work)|fixer|doer.?upper)\b/', $lower)) return 'refurbishment';
    if (preg_match('/\b(new build|newly built|brand new)\b/', $lower)) return 'modern';
    if (preg_match('/\b(well.?presented|recently (?:renovated|refurbished|updated)|modern|move.?in)\b/', $lower)) return 'modern';
    return 'refurbishment'; // Most auction lots need some work
}

function extractAddress(string $title, string $text): string {
    // Look for " in {Location}" pattern in title
    if (preg_match('/\bin\s+([A-Z][a-zA-Z\s,]+)$/u', $title, $m)) {
        return trim($m[1]);
    }
    // Look for place names after commas
    if (preg_match('/,\s*([A-Z][a-zA-Z\s]+)$/u', $title, $m)) {
        return trim($m[1]);
    }
    return $title;
}

function logMsg(string $msg): void {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . "\n";
    file_put_contents(LOG_FILE, $line, FILE_APPEND);
    // Also print to stdout for cron logs
    echo $line;
}

// Run
main();
