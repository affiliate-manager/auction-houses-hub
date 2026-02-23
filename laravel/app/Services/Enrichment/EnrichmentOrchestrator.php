<?php

namespace App\Services\Enrichment;

use App\Models\Lot;
use App\Models\LotEnrichment;
use Illuminate\Support\Facades\Log;

class EnrichmentOrchestrator
{
    private PostcodeEnricher $postcode;
    private CrimeEnricher $crime;
    private FloodEnricher $flood;
    private EpcEnricher $epc;
    private LandRegistryEnricher $landRegistry;
    private AmenityEnricher $amenity;

    private int $delayBetweenLots = 1500;
    private int $delayBetweenApis = 600;

    public function __construct()
    {
        $this->postcode = new PostcodeEnricher();
        $this->crime = new CrimeEnricher();
        $this->flood = new FloodEnricher();
        $this->epc = new EpcEnricher();
        $this->landRegistry = new LandRegistryEnricher();
        $this->amenity = new AmenityEnricher();
    }

    /**
     * Enrich a single lot with all available API data.
     */
    public function enrichLot(Lot $lot): LotEnrichment
    {
        $enrichment = LotEnrichment::firstOrNew(['lot_id' => $lot->id]);
        $allErrors = [];

        // Step 1: Geocoding (required for location-based APIs)
        $errors = $this->postcode->enrich($lot, $enrichment);
        $allErrors = array_merge($allErrors, $errors);
        $this->rateDelay();

        // Step 2: Crime data (needs coordinates)
        $errors = $this->crime->enrich($enrichment);
        $allErrors = array_merge($allErrors, $errors);
        $this->rateDelay();

        // Step 3: Flood risk (needs coordinates)
        $errors = $this->flood->enrich($enrichment);
        $allErrors = array_merge($allErrors, $errors);
        $this->rateDelay();

        // Step 4: EPC data (needs postcode)
        $errors = $this->epc->enrich($lot, $enrichment);
        $allErrors = array_merge($allErrors, $errors);
        $this->rateDelay();

        // Step 5: Land Registry (needs postcode)
        $errors = $this->landRegistry->enrich($lot, $enrichment);
        $allErrors = array_merge($allErrors, $errors);
        $this->rateDelay();

        // Step 6: Nearby amenities (needs coordinates)
        $errors = $this->amenity->enrich($enrichment);
        $allErrors = array_merge($allErrors, $errors);

        $enrichment->enriched_at = now();
        $enrichment->enrichment_errors_json = empty($allErrors) ? null : $allErrors;
        $enrichment->save();

        return $enrichment;
    }

    /**
     * Enrich all lots that need enrichment.
     * Returns [total processed, success count, error count].
     */
    public function enrichAll(int $limit = 50, ?callable $onProgress = null): array
    {
        $lots = Lot::whereNotNull('postcode')
            ->where('postcode', '!=', '')
            ->whereDoesntHave('enrichment', function ($q) {
                $q->where('enriched_at', '>=', now()->subDays(30));
            })
            ->where('status', 'upcoming')
            ->orderBy('auction_date')
            ->limit($limit)
            ->get();

        $processed = 0;
        $success = 0;
        $failed = 0;

        foreach ($lots as $lot) {
            try {
                $enrichment = $this->enrichLot($lot);
                $hasErrors = !empty($enrichment->enrichment_errors_json);
                if ($hasErrors) {
                    $failed++;
                } else {
                    $success++;
                }
                $processed++;

                if ($onProgress) {
                    $onProgress($lot, $enrichment, $processed, $lots->count());
                }

                if ($processed < $lots->count()) {
                    usleep($this->delayBetweenLots * 1000);
                }
            } catch (\Exception $e) {
                $failed++;
                $processed++;
                Log::error("[Enrichment] Fatal error enriching lot #{$lot->id}: " . $e->getMessage());

                if ($onProgress) {
                    $onProgress($lot, null, $processed, $lots->count());
                }
            }
        }

        return [$processed, $success, $failed];
    }

    private function rateDelay(): void
    {
        usleep($this->delayBetweenApis * 1000);
    }
}
