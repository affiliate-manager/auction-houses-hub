<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lot extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_house_id',
        'external_url',
        'title',
        'address',
        'postcode',
        'region',
        'property_type',
        'lot_condition',
        'bedrooms',
        'guide_price_low',
        'guide_price_high',
        'auction_date',
        'lot_number',
        'image_url',
        'status',
        'sale_price',
    ];

    protected $casts = [
        'auction_house_id' => 'integer',
        'bedrooms' => 'integer',
        'guide_price_low' => 'integer',
        'guide_price_high' => 'integer',
        'lot_number' => 'integer',
        'sale_price' => 'integer',
        'auction_date' => 'date:Y-m-d',
    ];

    /**
     * Get formatted guide price range.
     */
    public function getGuidePriceFormattedAttribute(): string
    {
        if (!$this->guide_price_low) {
            return 'POA';
        }

        $low = number_format($this->guide_price_low);

        if ($this->guide_price_high && $this->guide_price_high !== $this->guide_price_low) {
            $high = number_format($this->guide_price_high);
            return "£{$low} - £{$high}";
        }

        return "£{$low}+";
    }

    /**
     * Get days until auction.
     */
    public function getDaysUntilAuctionAttribute(): ?int
    {
        if (!$this->auction_date) {
            return null;
        }

        return max(0, now()->startOfDay()->diffInDays($this->auction_date, false));
    }

    /**
     * Scope: only upcoming lots.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'upcoming')
                     ->where('auction_date', '>=', now()->toDateString());
    }

    /**
     * Scope: lots by region.
     */
    public function scopeInRegion($query, string $region)
    {
        return $query->where('region', $region);
    }
}
