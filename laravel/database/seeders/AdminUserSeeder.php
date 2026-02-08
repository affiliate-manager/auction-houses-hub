<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('FILAMENT_ADMIN_EMAIL', 'admin@auction-hub.com')],
            [
                'name' => 'Admin',
                'password' => Hash::make(env('FILAMENT_ADMIN_PASSWORD', 'change-this')),
                'email_verified_at' => now(),
            ]
        );
    }
}
