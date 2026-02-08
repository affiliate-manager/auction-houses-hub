<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lot;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * GET /api/stats
     *
     * Returns aggregate statistics for the lot listings.
     */
    public function index(): JsonResponse
    {
        $stats = Cache::remember('lots:stats', now()->addMinutes(15), function () {
            $total = Lot::count();
            $upcoming = Lot::where('status', 'upcoming')->count();

            $byRegion = Lot::where('status', 'upcoming')
                ->select('region', DB::raw('COUNT(*) as count'))
                ->groupBy('region')
                ->orderByDesc('count')
                ->pluck('count', 'region');

            $byType = Lot::where('status', 'upcoming')
                ->select('property_type', DB::raw('COUNT(*) as count'))
                ->groupBy('property_type')
                ->orderByDesc('count')
                ->pluck('count', 'property_type');

            $byStatus = Lot::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');

            $avgGuidePrice = Lot::where('status', 'upcoming')
                ->whereNotNull('guide_price_low')
                ->avg('guide_price_low');

            $nextAuction = Lot::where('status', 'upcoming')
                ->where('auction_date', '>=', now()->toDateString())
                ->orderBy('auction_date')
                ->value('auction_date');

            return [
                'total_lots' => $total,
                'upcoming_lots' => $upcoming,
                'by_region' => $byRegion,
                'by_type' => $byType,
                'by_status' => $byStatus,
                'avg_guide_price' => $avgGuidePrice ? round($avgGuidePrice) : null,
                'next_auction_date' => $nextAuction,
                'last_updated' => now()->toIso8601String(),
            ];
        });

        return response()->json($stats);
    }
}
