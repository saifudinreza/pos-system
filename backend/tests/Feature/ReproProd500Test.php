<?php

namespace Tests\Feature;

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReproProd500Test extends TestCase
{
    public function test_repro_production_500s(): void
    {
        $user = User::where('email', 'donojomi@gmail.com')->first()
            ?? User::first();
        $this->assertNotNull($user, 'Butuh user di DB');
        Sanctum::actingAs($user);

        foreach ([
            '/api/ai/usage-today',
            '/api/insights',
            '/api/reports/forecast',
            '/api/orders?per_page=10&sort=created_at&order=desc',
            '/api/customers',
        ] as $path) {
            $response = $this->getJson($path);
            echo $path . ' → ' . $response->getStatusCode() . PHP_EOL;
            if ($response->getStatusCode() !== 200) {
                echo substr($response->getContent() ?? '', 0, 500) . PHP_EOL;
            }
        }
    }
}