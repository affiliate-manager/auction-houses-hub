<?php

namespace App\Services\Enrichment;

use App\Models\Lot;
use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class EpcEnricher
{
    private Client $http;
    private ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.epc.api_key');
        $this->http = new Client([
            'base_uri' => 'https://epc.opendatacommunities.org/api/v1/',
            'timeout' => 10,
            'connect_timeout' => 5,
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => $this->apiKey ? 'Basic ' . base64_encode($this->apiKey . ':') : '',
            ],
        ]);
    }

    public function enrich(Lot $lot, LotEnrichment $enrichment): array
    {
        $errors = [];
        $postcode = trim($lot->postcode ?? '');

        if (empty($postcode)) {
            return ['epc' => 'No postcode available'];
        }

        if (empty($this->apiKey)) {
            return ['epc' => 'EPC API key not configured (set EPC_API_KEY in .env)'];
        }

        try {
            $query = ['postcode' => $postcode, 'size' => 25];

            $addressParts = $this->extractAddressNumber($lot->address ?? '');
            if ($addressParts) {
                $query['address'] = $addressParts;
            }

            $response = $this->http->get('domestic/search', ['query' => $query]);
            $data = json_decode((string) $response->getBody(), true);
            $rows = $data['rows'] ?? [];

            if (empty($rows)) {
                return ['epc' => 'No EPC records found for this postcode'];
            }

            $best = $this->findBestMatch($lot, $rows);

            if ($best) {
                $enrichment->epc_rating = strtoupper($best['current-energy-rating'] ?? '');
                $enrichment->epc_score_current = (int) ($best['current-energy-efficiency'] ?? 0) ?: null;
                $enrichment->epc_score_potential = (int) ($best['potential-energy-efficiency'] ?? 0) ?: null;
                $enrichment->floor_area_sqm = (float) ($best['total-floor-area'] ?? 0) ?: null;
                $enrichment->built_form = $best['built-form'] ?? null;
                $enrichment->heating_type = $best['mainheat-description'] ?? null;
                $enrichment->wall_description = $best['walls-description'] ?? null;
                $enrichment->roof_description = $best['roof-description'] ?? null;

                Log::info("[Enrichment:EPC] {$postcode}: {$enrichment->epc_rating}, {$enrichment->floor_area_sqm}sqm");
            } else {
                $first = $rows[0];
                $enrichment->epc_rating = strtoupper($first['current-energy-rating'] ?? '');
                $enrichment->epc_score_current = (int) ($first['current-energy-efficiency'] ?? 0) ?: null;
                $enrichment->epc_score_potential = (int) ($first['potential-energy-efficiency'] ?? 0) ?: null;
                $enrichment->floor_area_sqm = (float) ($first['total-floor-area'] ?? 0) ?: null;
                $enrichment->built_form = $first['built-form'] ?? null;
                $enrichment->heating_type = $first['mainheat-description'] ?? null;

                Log::info("[Enrichment:EPC] {$postcode}: used first result (no exact match), rating {$enrichment->epc_rating}");
            }
        } catch (\Exception $e) {
            $errors['epc'] = $e->getMessage();
            Log::warning("[Enrichment:EPC] Failed for {$postcode}: " . $e->getMessage());
        }

        return $errors;
    }

    private function findBestMatch(Lot $lot, array $rows): ?array
    {
        $lotAddress = strtolower($lot->address ?? '');
        $lotNumber = $this->extractAddressNumber($lotAddress);

        foreach ($rows as $row) {
            $epcAddress = strtolower($row['address'] ?? '');
            if ($lotNumber && str_contains($epcAddress, strtolower($lotNumber))) {
                return $row;
            }
            if ($lotAddress && str_contains($epcAddress, $lotAddress)) {
                return $row;
            }
        }

        return null;
    }

    private function extractAddressNumber(string $address): ?string
    {
        if (preg_match('/^(\d+[a-z]?)\b/i', trim($address), $m)) {
            return $m[1];
        }
        return null;
    }
}
