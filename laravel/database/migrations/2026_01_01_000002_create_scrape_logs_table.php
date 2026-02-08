<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scrape_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('auction_house_id');
            $table->enum('status', ['success', 'partial', 'failed']);
            $table->unsignedInteger('lots_found')->default(0);
            $table->unsignedInteger('lots_new')->default(0);
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['auction_house_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scrape_logs');
    }
};
