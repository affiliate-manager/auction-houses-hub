<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lot;
use App\Models\LotEnrichment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LotController extends Controller
{
    /**
     * GET /api/lots
     *
     * Query params:
     *   region, property_type, condition, house_id, status,
     *   price_min, price_max, bedrooms_min, include_enrichment,
     *   sort (date_asc, date_desc, price_asc, price_desc, newest),
     *   page, per_page (default 20, max 100)
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = 'lots:' . md5($request->getQueryString() ?? 'all');

        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($request) {
            $query = Lot::query();

            if ($request->boolean('include_enrichment')) {
                $query->with('enrichment');
            }

            // Filters
            if ($region = $request->input('region')) {
                $query->where('region', $region);
            }

            if ($type = $request->input('property_type')) {
                $query->where('property_type', $type);
            }

            if ($condition = $request->input('condition')) {
                $query->where('lot_condition', $condition);
            }

            if ($houseId = $request->input('house_id')) {
                $query->where('auction_house_id', (int) $houseId);
            }

            if ($status = $request->input('status')) {
                $query->where('status', $status);
            } else {
                // Default: show only upcoming lots
                $query->where('status', 'upcoming');
            }

            if ($priceMin = $request->input('price_min')) {
                $query->where('guide_price_low', '>=', (int) $priceMin);
            }

            if ($priceMax = $request->input('price_max')) {
                $query->where(function ($q) use ($priceMax) {
                    $q->where('guide_price_high', '<=', (int) $priceMax)
                      ->orWhere(function ($q2) use ($priceMax) {
                          $q2->whereNull('guide_price_high')
                             ->where('guide_price_low', '<=', (int) $priceMax);
                      });
                });
            }

            if ($bedroomsMin = $request->input('bedrooms_min')) {
                $query->where('bedrooms', '>=', (int) $bedroomsMin);
            }

            // Search by title or address
            if ($search = $request->input('q')) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                      ->orWhere('address', 'LIKE', "%{$search}%")
                      ->orWhere('postcode', 'LIKE', "%{$search}%");
                });
            }

            // Sorting
            $sort = $request->input('sort', 'date_asc');
            match ($sort) {
                'date_desc' => $query->orderByDesc('auction_date'),
                'price_asc' => $query->orderBy('guide_price_low'),
                'price_desc' => $query->orderByDesc('guide_price_low'),
                'newest' => $query->orderByDesc('created_at'),
                default => $query->orderBy('auction_date'),
            };

            // Pagination
            $perPage = min((int) $request->input('per_page', 20), 100);

            return $query->paginate($perPage);
        });

        return response()->json($data);
    }

    /**
     * GET /api/lots/{lot}
     */
    public function show(Lot $lot): JsonResponse
    {
        $cacheKey = 'lot:' . $lot->id;

        $data = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($lot) {
            $lot->load('enrichment');
            return $lot;
        });

        return response()->json($data);
    }

    /**
     * GET /api/lots/{lot}/enrichment
     */
    public function enrichment(Lot $lot): JsonResponse
    {
        $cacheKey = 'lot_enrichment:' . $lot->id;

        $data = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($lot) {
            $enrichment = $lot->enrichment;

            if (!$enrichment) {
                return ['status' => 'not_enriched', 'data' => null];
            }

            $status = 'enriched';
            if (!empty($enrichment->enrichment_errors_json)) {
                $status = 'partial';
            }

            return [
                'status' => $status,
                'enriched_at' => $enrichment->enriched_at?->toIso8601String(),
                'data' => [
                    'location' => [
                        'latitude' => $enrichment->latitude,
                        'longitude' => $enrichment->longitude,
                        'admin_district' => $enrichment->admin_district,
                        'ward' => $enrichment->ward,
                        'constituency' => $enrichment->parliamentary_constituency,
                    ],
                    'epc' => [
                        'rating' => $enrichment->epc_rating,
                        'score_current' => $enrichment->epc_score_current,
                        'score_potential' => $enrichment->epc_score_potential,
                        'floor_area_sqm' => $enrichment->floor_area_sqm,
                        'floor_area_sqft' => $enrichment->floor_area_sqft,
                        'built_form' => $enrichment->built_form,
                        'heating_type' => $enrichment->heating_type,
                        'wall_description' => $enrichment->wall_description,
                        'roof_description' => $enrichment->roof_description,
                    ],
                    'crime' => [
                        'total' => $enrichment->crime_total,
                        'level' => $enrichment->crime_level,
                        'burglary' => $enrichment->crime_burglary,
                        'antisocial' => $enrichment->crime_antisocial,
                        'violent' => $enrichment->crime_violent,
                        'breakdown' => $enrichment->crime_breakdown_json,
                    ],
                    'flood' => [
                        'risk_zone' => $enrichment->flood_risk_zone,
                        'risk_level' => $enrichment->flood_risk_level,
                        'level_label' => $enrichment->flood_level_label,
                        'warnings_nearby' => $enrichment->flood_warnings_nearby,
                    ],
                    'land_registry' => [
                        'avg_price' => $enrichment->land_reg_avg_price,
                        'last_sale_price' => $enrichment->land_reg_last_sale_price,
                        'last_sale_date' => $enrichment->land_reg_last_sale_date?->format('Y-m-d'),
                        'transactions' => $enrichment->land_reg_transactions_json,
                    ],
                    'amenities' => [
                        'stations_count' => $enrichment->nearby_stations_count,
                        'schools_count' => $enrichment->nearby_schools_count,
                        'supermarkets_count' => $enrichment->nearby_supermarkets_count,
                        'details' => $enrichment->nearby_amenities_json,
                    ],
                ],
            ];
        });

        return response()->json($data);
    }
}
