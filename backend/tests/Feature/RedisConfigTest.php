<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RedisConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_redis_client_defaults_to_predis(): void
    {
        // Dockerfile tidak meng-install ekstensi phpredis → klien harus predis
        // (pure-PHP). Kalau default balik ke 'phpredis', koneksi Redis akan error.
        $this->assertSame('predis', config('database.redis.client'));
    }

    public function test_fallback_tanpa_redis_url(): void
    {
        // Tanpa REDIS_URL, aplikasi tidak boleh menunjuk Redis di mana pun.
        // Fallback aman: cache/queue/session tetap database/file.
        putenv('REDIS_URL=');
        $this->assertEmpty(env('REDIS_URL'));
        $this->assertNotSame('redis', config('cache.default'));
        $this->assertNotSame('redis', config('queue.default'));
    }
}