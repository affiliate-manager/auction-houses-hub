<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotEnrichment extends Model
{
    protected $fillable = [
        'lot_id',
        'latitude',
        'longitude',
        'lsoa_code',
        'admin_district',
        'ward',
        'parliamentary_constituency',
        'epc_rating',
        'epc_score_current',
        'epc_score_potential',
        'floor_area_sqm',
        'built_form',
        'heating_type',
        'wall_description',
        'roof_description',
        'crime_total',
        'crime_burglary',
        'crime_antisocial',
        'crime_violent',
        'crime_breakdown_json',
        'flood_risk_zone',
        'flood_risk_level',
        'flood_warnings_nearby',
        'land_reg_avg_price',
        'land_reg_last_sale_price',
        'land_reg_last_sale_date',
        'land_reg_transactions_json',
        'nearby_stations_count',
        'nearby_schools_count',
        'nearby_supermarkets_count',
        'nearby_amenities_json',
        'enriched_at',
        'enrichment_errors_json',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'epc_score_current' => 'integer',
        'epc_score_potential' => 'integer',
        'floor_area_sqm' => 'float',
        'crime_total' => 'integer',
        'crime_burglary' => 'integer',
        'crime_antisocial' => 'integer',
        'crime_violent' => 'integer',
        'crime_breakdown_json' => 'array',
        'flood_warnings_nearby' => 'integer',
        'land_reg_avg_price' => 'integer',
        'land_reg_last_sale_price' => 'integer',
        'land_reg_last_sale_date' => 'date:Y-m-d',
        'land_reg_transactions_json' => 'array',
        'nearby_stations_count' => 'integer',
        'nearby_schools_count' => 'integer',
        'nearby_supermarkets_count' => 'integer',
        'nearby_amenities_json' => 'array',
        'enriched_at' => 'datetime',
        'enrichment_errors_json' => 'array',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function getFloorAreaSqftAttribute(): ?float
    {
        return $this->floor_area_sqm ? round($this->floor_area_sqm * 10.764, 0) : null;
    }

    public function getCrimeLevelAttribute(): string
    {
        if ($this->crime_total === null) return 'unknown';
        if ($this->crime_total <= 30) return 'low';
        if ($this->crime_total <= 80) return 'medium';
        return 'high';
    }

    public function getFloodLevelLabelAttribute(): string
    {
        return match ($this->flood_risk_level) {
            'low' => 'Low',
            'medium' => 'Medium',
            'high' => 'High',
            'very_low' => 'Very Low',
            default => 'Unknown',
        };
    }

    public function isFullyEnriched(): bool
    {
        return $this->enriched_at !== null
            && $this->latitude !== null
            && $this->epc_rating !== null
            && $this->crime_total !== null
            && $this->flood_risk_level !== null;
    }

    public function isPartiallyEnriched(): bool
    {
        return $this->enriched_at !== null && !$this->isFullyEnriched();
    }
}
