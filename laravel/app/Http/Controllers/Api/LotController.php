<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lot;
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
     *   price_min, price_max, bedrooms_min,
     *   sort (date_asc, date_desc, price_asc, price_desc, newest),
     *   page, per_page (default 20, max 100)
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = 'lots:' . md5($request->getQueryString() ?? 'all');

        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($request) {
            $query = Lot::query();

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
            return $lot;
        });

        return response()->json($data);
    }
}
