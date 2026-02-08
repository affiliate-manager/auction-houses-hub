<?php

namespace App\Console\Commands;

use App\Models\Lot;
use Illuminate\Console\Command;

class UpdateLotStatus extends Command
{
    protected $signature = 'lots:update-status';

    protected $description = 'Mark past auction lots as unsold if no sale price recorded';

    public function handle(): int
    {
        // Lots with auction_date in the past and still "upcoming" -> "unsold"
        $updated = Lot::where('status', 'upcoming')
            ->where('auction_date', '<', now()->toDateString())
            ->update(['status' => 'unsold']);

        $this->info("Updated {$updated} lots to 'unsold' status.");

        return self::SUCCESS;
    }
}
