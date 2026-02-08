<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('auction_house_id');
            $table->string('external_url', 500)->nullable();
            $table->string('title', 500);
            $table->string('address', 500)->nullable();
            $table->string('postcode', 10)->nullable();
            $table->string('region', 100)->nullable();
            $table->enum('property_type', ['residential', 'commercial', 'land', 'mixed'])->default('residential');
            $table->enum('lot_condition', ['modern', 'refurbishment', 'development', 'mixed'])->default('mixed');
            $table->unsignedTinyInteger('bedrooms')->nullable();
            $table->unsignedInteger('guide_price_low')->nullable();
            $table->unsignedInteger('guide_price_high')->nullable();
            $table->date('auction_date')->nullable();
            $table->unsignedSmallInteger('lot_number')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->enum('status', ['upcoming', 'live', 'sold', 'withdrawn', 'unsold'])->default('upcoming');
            $table->unsignedInteger('sale_price')->nullable();
            $table->timestamps();

            $table->index('auction_date');
            $table->index('region');
            $table->index('status');
            $table->index('property_type');
            $table->index('auction_house_id');
            $table->index(['status', 'auction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lots');
    }
};
