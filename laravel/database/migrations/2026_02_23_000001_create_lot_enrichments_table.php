<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lot_enrichments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->unique()->constrained('lots')->cascadeOnDelete();

            // Geocoding (Postcodes.io)
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('lsoa_code', 20)->nullable();
            $table->string('admin_district', 100)->nullable();
            $table->string('ward', 100)->nullable();
            $table->string('parliamentary_constituency', 150)->nullable();

            // EPC data
            $table->char('epc_rating', 1)->nullable();
            $table->unsignedTinyInteger('epc_score_current')->nullable();
            $table->unsignedTinyInteger('epc_score_potential')->nullable();
            $table->decimal('floor_area_sqm', 8, 1)->nullable();
            $table->string('built_form', 50)->nullable();
            $table->string('heating_type', 100)->nullable();
            $table->string('wall_description', 150)->nullable();
            $table->string('roof_description', 150)->nullable();

            // Crime data (Police.uk)
            $table->unsignedInteger('crime_total')->nullable();
            $table->unsignedInteger('crime_burglary')->nullable();
            $table->unsignedInteger('crime_antisocial')->nullable();
            $table->unsignedInteger('crime_violent')->nullable();
            $table->json('crime_breakdown_json')->nullable();

            // Flood risk (Environment Agency)
            $table->string('flood_risk_zone', 20)->nullable();
            $table->string('flood_risk_level', 20)->nullable();
            $table->unsignedTinyInteger('flood_warnings_nearby')->default(0);

            // Land Registry
            $table->unsignedInteger('land_reg_avg_price')->nullable();
            $table->unsignedInteger('land_reg_last_sale_price')->nullable();
            $table->date('land_reg_last_sale_date')->nullable();
            $table->json('land_reg_transactions_json')->nullable();

            // Nearby amenities (Overpass/OSM)
            $table->unsignedTinyInteger('nearby_stations_count')->default(0);
            $table->unsignedTinyInteger('nearby_schools_count')->default(0);
            $table->unsignedTinyInteger('nearby_supermarkets_count')->default(0);
            $table->json('nearby_amenities_json')->nullable();

            // Meta
            $table->timestamp('enriched_at')->nullable();
            $table->json('enrichment_errors_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lot_enrichments');
    }
};
