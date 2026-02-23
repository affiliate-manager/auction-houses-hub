<?php

namespace App\Services\Enrichment;

use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class FloodEnricher
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'timeout' => 10,
            'connect_timeout' => 5,
        ]);
    }

    public function enrich(LotEnrichment $enrichment): array
    {
        $errors = [];

        if (!$enrichment->latitude || !$enrichment->longitude) {
            return ['flood' => 'No coordinates available'];
        }

        try {
            $response = $this->http->get('https://environment.data.gov.uk/flood-monitoring/id/floods', [
                'query' => [
                    'lat' => $enrichment->latitude,
                    'long' => $enrichment->longitude,
                    'dist' => 3,
                ],
            ]);

            $data = json_decode((string) $response->getBody(), true);
            $items = $data['items'] ?? [];
            $warningCount = count($items);

            $enrichment->flood_warnings_nearby = min($warningCount, 255);

            if ($warningCount === 0) {
                $enrichment->flood_risk_level = 'low';
                $enrichment->flood_risk_zone = 'Zone 1';
            } else {
                $severityLevels = array_map(fn($i) => $i['severityLevel'] ?? 4, $items);
                $worstSeverity = min($severityLevels);

                if ($worstSeverity <= 1) {
                    $enrichment->flood_risk_level = 'high';
                    $enrichment->flood_risk_zone = 'Zone 3';
                } elseif ($worstSeverity <= 2) {
                    $enrichment->flood_risk_level = 'medium';
                    $enrichment->flood_risk_zone = 'Zone 2';
                } else {
                    $enrichment->flood_risk_level = 'low';
                    $enrichment->flood_risk_zone = 'Zone 1';
                }
            }

            Log::info("[Enrichment:Flood] ({$enrichment->latitude},{$enrichment->longitude}): {$enrichment->flood_risk_level}, {$warningCount} warnings");
        } catch (\Exception $e) {
            $errors['flood'] = $e->getMessage();
            Log::warning("[Enrichment:Flood] Failed: " . $e->getMessage());
        }

        return $errors;
    }
}
