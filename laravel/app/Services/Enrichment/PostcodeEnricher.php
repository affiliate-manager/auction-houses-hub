<?php

namespace App\Services\Enrichment;

use App\Models\Lot;
use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class PostcodeEnricher
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'base_uri' => 'https://api.postcodes.io/',
            'timeout' => 10,
            'connect_timeout' => 5,
        ]);
    }

    public function enrich(Lot $lot, LotEnrichment $enrichment): array
    {
        $errors = [];
        $postcode = trim($lot->postcode ?? '');

        if (empty($postcode)) {
            return ['postcode' => 'No postcode available'];
        }

        try {
            $response = $this->http->get('postcodes/' . urlencode($postcode));
            $data = json_decode((string) $response->getBody(), true);

            if (($data['status'] ?? 0) !== 200 || empty($data['result'])) {
                return ['postcode' => 'Invalid postcode or no data returned'];
            }

            $result = $data['result'];

            $enrichment->latitude = $result['latitude'] ?? null;
            $enrichment->longitude = $result['longitude'] ?? null;
            $enrichment->lsoa_code = $result['codes']['lsoa'] ?? $result['lsoa'] ?? null;
            $enrichment->admin_district = $result['admin_district'] ?? null;
            $enrichment->ward = $result['admin_ward'] ?? null;
            $enrichment->parliamentary_constituency = $result['parliamentary_constituency'] ?? null;

            $lot->latitude = $enrichment->latitude;
            $lot->longitude = $enrichment->longitude;
            $lot->save();

            Log::info("[Enrichment:Postcode] {$postcode}: lat={$enrichment->latitude}, lng={$enrichment->longitude}");
        } catch (\Exception $e) {
            $errors['postcode'] = $e->getMessage();
            Log::warning("[Enrichment:Postcode] Failed for {$postcode}: " . $e->getMessage());
        }

        return $errors;
    }
}
