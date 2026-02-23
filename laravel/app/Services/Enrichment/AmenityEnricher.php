<?php

namespace App\Services\Enrichment;

use App\Models\LotEnrichment;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class AmenityEnricher
{
    private Client $http;

    public function __construct()
    {
        $this->http = new Client([
            'base_uri' => 'https://overpass-api.de/api/',
            'timeout' => 30,
            'connect_timeout' => 10,
        ]);
    }

    public function enrich(LotEnrichment $enrichment): array
    {
        $errors = [];

        if (!$enrichment->latitude || !$enrichment->longitude) {
            return ['amenities' => 'No coordinates available'];
        }

        try {
            $lat = $enrichment->latitude;
            $lng = $enrichment->longitude;

            $query = $this->buildOverpassQuery($lat, $lng);
            $response = $this->http->post('interpreter', [
                'form_params' => ['data' => $query],
            ]);

            $data = json_decode((string) $response->getBody(), true);
            $elements = $data['elements'] ?? [];

            $amenities = $this->categorizeAmenities($elements, $lat, $lng);

            $enrichment->nearby_stations_count = count($amenities['stations'] ?? []);
            $enrichment->nearby_schools_count = count($amenities['schools'] ?? []);
            $enrichment->nearby_supermarkets_count = count($amenities['supermarkets'] ?? []);
            $enrichment->nearby_amenities_json = [
                'stations' => array_slice($amenities['stations'] ?? [], 0, 5),
                'schools' => array_slice($amenities['schools'] ?? [], 0, 5),
                'supermarkets' => array_slice($amenities['supermarkets'] ?? [], 0, 5),
                'hospitals' => array_slice($amenities['hospitals'] ?? [], 0, 3),
                'parks' => array_slice($amenities['parks'] ?? [], 0, 3),
            ];

            Log::info("[Enrichment:Amenity] ({$lat},{$lng}): {$enrichment->nearby_stations_count} stations, {$enrichment->nearby_schools_count} schools, {$enrichment->nearby_supermarkets_count} shops");
        } catch (\Exception $e) {
            $errors['amenities'] = $e->getMessage();
            Log::warning("[Enrichment:Amenity] Failed: " . $e->getMessage());
        }

        return $errors;
    }

    private function buildOverpassQuery(float $lat, float $lng): string
    {
        $radius = 1500;
        return <<<OVERPASS
[out:json][timeout:25];
(
  node["railway"="station"](around:{$radius},{$lat},{$lng});
  node["railway"="halt"](around:{$radius},{$lat},{$lng});
  node["amenity"="school"](around:{$radius},{$lat},{$lng});
  way["amenity"="school"](around:{$radius},{$lat},{$lng});
  node["shop"="supermarket"](around:{$radius},{$lat},{$lng});
  way["shop"="supermarket"](around:{$radius},{$lat},{$lng});
  node["amenity"="hospital"](around:{$radius},{$lat},{$lng});
  way["amenity"="hospital"](around:{$radius},{$lat},{$lng});
  node["leisure"="park"](around:{$radius},{$lat},{$lng});
  way["leisure"="park"](around:{$radius},{$lat},{$lng});
);
out center tags;
OVERPASS;
    }

    private function categorizeAmenities(array $elements, float $originLat, float $originLng): array
    {
        $result = [
            'stations' => [],
            'schools' => [],
            'supermarkets' => [],
            'hospitals' => [],
            'parks' => [],
        ];

        foreach ($elements as $el) {
            $tags = $el['tags'] ?? [];
            $name = $tags['name'] ?? 'Unnamed';
            $elLat = $el['lat'] ?? $el['center']['lat'] ?? null;
            $elLng = $el['lon'] ?? $el['center']['lon'] ?? null;

            if (!$elLat || !$elLng) continue;

            $distance = $this->haversine($originLat, $originLng, $elLat, $elLng);
            $item = [
                'name' => $name,
                'distance_m' => $distance,
                'lat' => $elLat,
                'lng' => $elLng,
            ];

            if (isset($tags['railway']) && in_array($tags['railway'], ['station', 'halt'])) {
                $result['stations'][] = $item;
            } elseif (($tags['amenity'] ?? '') === 'school') {
                $result['schools'][] = $item;
            } elseif (($tags['shop'] ?? '') === 'supermarket') {
                $result['supermarkets'][] = $item;
            } elseif (($tags['amenity'] ?? '') === 'hospital') {
                $result['hospitals'][] = $item;
            } elseif (($tags['leisure'] ?? '') === 'park') {
                $result['parks'][] = $item;
            }
        }

        foreach ($result as &$list) {
            usort($list, fn($a, $b) => $a['distance_m'] <=> $b['distance_m']);
        }

        return $result;
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): int
    {
        $R = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return (int) round($R * $c);
    }
}
