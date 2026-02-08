<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrapeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'auction_house_id',
        'status',
        'lots_found',
        'lots_new',
        'duration_ms',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'auction_house_id' => 'integer',
        'lots_found' => 'integer',
        'lots_new' => 'integer',
        'duration_ms' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Scope: failed scrapes.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope: recent (last 24 hours).
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDay());
    }
}
