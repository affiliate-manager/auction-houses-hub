<?php

namespace App\Services\Enrichment;

use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class CrimeEnricher
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'base_uri' => 'https://data.police.uk/api/',
            'timeout' => 15,
            'connect_timeout' => 5,
        ]);
    }

    public function enrich(LotEnrichment $enrichment): array
    {
        $errors = [];

        if (!$enrichment->latitude || !$enrichment->longitude) {
            return ['crime' => 'No coordinates available'];
        }

        try {
            $date = now()->subMonth()->format('Y-m');
            $response = $this->http->get('crimes-street/all-crime', [
                'query' => [
                    'lat' => $enrichment->latitude,
                    'lng' => $enrichment->longitude,
                    'date' => $date,
                ],
            ]);

            $crimes = json_decode((string) $response->getBody(), true);

            if (!is_array($crimes)) {
                return ['crime' => 'Unexpected response format'];
            }

            $breakdown = [];
            foreach ($crimes as $crime) {
                $cat = $crime['category'] ?? 'other';
                $breakdown[$cat] = ($breakdown[$cat] ?? 0) + 1;
            }

            $enrichment->crime_total = count($crimes);
            $enrichment->crime_burglary = $breakdown['burglary'] ?? 0;
            $enrichment->crime_antisocial = $breakdown['anti-social-behaviour'] ?? 0;
            $enrichment->crime_violent = $breakdown['violent-crime'] ?? 0;
            $enrichment->crime_breakdown_json = $breakdown;

            Log::info("[Enrichment:Crime] ({$enrichment->latitude},{$enrichment->longitude}): {$enrichment->crime_total} crimes");
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, '503') || str_contains($msg, '429')) {
                $errors['crime'] = 'Police API rate limit or unavailable';
            } else {
                $errors['crime'] = $msg;
            }
            Log::warning("[Enrichment:Crime] Failed: {$msg}");
        }

        return $errors;
    }
}
