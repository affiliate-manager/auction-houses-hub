<?php

namespace App\Console\Commands;

use App\Services\Enrichment\EnrichmentOrchestrator;
use Illuminate\Console\Command;

class EnrichLots extends Command
{
    protected $signature = 'lots:enrich
        {--limit=50 : Maximum number of lots to enrich per run}
        {--lot= : Enrich a specific lot by ID}';

    protected $description = 'Enrich auction lots with data from free public APIs (Postcodes.io, Police.uk, EA Flood, EPC, Land Registry, OSM)';

    public function handle(): int
    {
        $orchestrator = new EnrichmentOrchestrator();

        if ($lotId = $this->option('lot')) {
            return $this->enrichSingleLot($orchestrator, (int) $lotId);
        }

        return $this->enrichBatch($orchestrator);
    }

    private function enrichSingleLot(EnrichmentOrchestrator $orchestrator, int $lotId): int
    {
        $lot = \App\Models\Lot::find($lotId);

        if (!$lot) {
            $this->error("Lot #{$lotId} not found.");
            return self::FAILURE;
        }

        if (!$lot->postcode) {
            $this->error("Lot #{$lotId} has no postcode -- cannot enrich.");
            return self::FAILURE;
        }

        $this->info("Enriching lot #{$lotId}: {$lot->title}");
        $this->info("Postcode: {$lot->postcode}");
        $this->newLine();

        $enrichment = $orchestrator->enrichLot($lot);

        $this->table(
            ['Field', 'Value'],
            $this->enrichmentSummary($enrichment)
        );

        if (!empty($enrichment->enrichment_errors_json)) {
            $this->warn('Some enrichment sources had errors:');
            foreach ($enrichment->enrichment_errors_json as $source => $msg) {
                $this->line("  - {$source}: {$msg}");
            }
        }

        $this->info('Done.');
        return self::SUCCESS;
    }

    private function enrichBatch(EnrichmentOrchestrator $orchestrator): int
    {
        $limit = (int) $this->option('limit');
        $this->info("Enriching up to {$limit} lots with public API data...");
        $this->newLine();

        $startTime = microtime(true);

        [$processed, $success, $failed] = $orchestrator->enrichAll(
            $limit,
            function ($lot, $enrichment, $current, $total) {
                $status = $enrichment ? ($enrichment->enrichment_errors_json ? 'partial' : 'ok') : 'FAILED';
                $this->line("  [{$current}/{$total}] Lot #{$lot->id} ({$lot->postcode}): {$status}");
            }
        );

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->newLine();
        $this->info("Completed in {$elapsed}s: {$processed} processed, {$success} fully enriched, {$failed} with errors.");

        return $failed > 0 && $success === 0 ? self::FAILURE : self::SUCCESS;
    }

    private function enrichmentSummary($e): array
    {
        return array_filter([
            ['Lat/Lng', $e->latitude ? "{$e->latitude}, {$e->longitude}" : '-'],
            ['District', $e->admin_district ?? '-'],
            ['Ward', $e->ward ?? '-'],
            ['EPC Rating', $e->epc_rating ?? '-'],
            ['EPC Score', $e->epc_score_current ? "{$e->epc_score_current} / {$e->epc_score_potential}" : '-'],
            ['Floor Area', $e->floor_area_sqm ? "{$e->floor_area_sqm} sqm" : '-'],
            ['Built Form', $e->built_form ?? '-'],
            ['Heating', $e->heating_type ?? '-'],
            ['Crime Total', $e->crime_total !== null ? "{$e->crime_total} ({$e->crime_level})" : '-'],
            ['Flood Risk', $e->flood_risk_level ? "{$e->flood_risk_level} ({$e->flood_risk_zone})" : '-'],
            ['LR Avg Price', $e->land_reg_avg_price ? '£' . number_format($e->land_reg_avg_price) : '-'],
            ['LR Last Sale', $e->land_reg_last_sale_price ? '£' . number_format($e->land_reg_last_sale_price) . " ({$e->land_reg_last_sale_date})" : '-'],
            ['Stations', "{$e->nearby_stations_count}"],
            ['Schools', "{$e->nearby_schools_count}"],
            ['Supermarkets', "{$e->nearby_supermarkets_count}"],
        ]);
    }
}
