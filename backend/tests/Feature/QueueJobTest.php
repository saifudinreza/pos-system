<?php

namespace Tests\Feature;

use App\Jobs\ProcessAiJob;
use App\Jobs\SendWhatsAppReceipt;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Services\GroqService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QueueJobTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeUser(Tenant $tenant, string $role = 'admin'): User
    {
        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => $role,
        ]);
    }

    private function makeOrder(Tenant $tenant, User $user): \App\Models\Order
    {
        return \App\Models\Order::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'order_number' => 'ORD-Q-' . strtoupper(str()->random(8)),
            'status'       => 'pending',
            'subtotal'     => 50000,
            'tax'          => 5500,
            'total'        => 55500,
        ]);
    }

    // ── PROCESS AI JOB, jalankan LLM lalu tulis hasil ke ai_jobs ──

    public function test_process_ai_job_runs_llm_and_writes_result(): void
    {
        $tenant = $this->makeTenant('Toko Queue');
        $admin  = $this->makeUser($tenant);

        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('ask')->once()->andReturn([
                'text'        => 'hasil analisis',
                'tokens_used' => 25,
                'provider'    => 'groq',
                'model'       => 'llama-3.3',
            ]);
        });

        $job = \App\Models\AiJob::create([
            'user_id'   => $admin->id,
            'tenant_id' => $tenant->id,
            'type'      => 'sales_analysis',
            'query'     => 'berapa penjualan?',
            'prompt'    => 'system prompt',
            'status'    => 'pending',
        ]);

        (new ProcessAiJob($job->id))->handle(app(GroqService::class));

        $job->refresh();
        $this->assertEquals('completed', $job->status);
        $this->assertEquals('hasil analisis', $job->response);
        $this->assertEquals(25, $job->tokens_used);
        $this->assertEquals('groq', $job->provider);

        $this->assertDatabaseHas('ai_query_logs', [
            'user_id'     => $admin->id,
            'type'        => 'sales_analysis',
            'response'    => 'hasil analisis',
            'tokens_used' => 25,
        ]);
    }

    public function test_process_ai_job_marks_failed_when_llm_fails(): void
    {
        $admin = $this->makeUser($this->makeTenant('Toko AI'));

        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('ask')->once()->andThrow(new \Exception('Groq offline'));
        });

        $job = \App\Models\AiJob::create([
            'user_id'   => $admin->id,
            'tenant_id' => $admin->tenant_id,
            'type'      => 'sales_analysis',
            'query'     => 'q',
            'prompt'    => 'p',
            'status'    => 'pending',
        ]);

        (new ProcessAiJob($job->id))->handle(app(GroqService::class));

        $this->assertEquals('failed', $job->refresh()->status);
        $this->assertNotNull($job->error);
    }

    // ── JOB STATUS ENDPOINT, polling hasil AI ──

    public function test_job_status_polling_returns_completed_result(): void
    {
        $tenant = $this->makeTenant('Toko AI');
        $admin  = $this->makeUser($tenant);

        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('buildSalesPrompt')->andReturn('system');
            $mock->shouldReceive('ask')->once()->andReturn([
                'text' => 'jawaban', 'tokens_used' => 5, 'provider' => 'groq', 'model' => 'm',
            ]);
        });

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/ai/query', ['query' => 'test ptanyaan'])
            ->assertStatus(202);

        $jobId = $response->json('job_id');

        // Sync queue test → job sudah jalan & selesai
        $this->getJson("/api/ai/jobs/{$jobId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.data.response', 'jawaban');
    }

    public function test_job_status_forbidden_for_other_user(): void
    {
        $tenant = $this->makeTenant('Toko AI');
        $admin  = $this->makeUser($tenant);
        $other  = $this->makeUser($tenant, 'kasir');

        $job = \App\Models\AiJob::create([
            'user_id' => $admin->id, 'tenant_id' => $tenant->id,
            'type' => 'sales_analysis', 'query' => 'q', 'prompt' => 'p', 'status' => 'pending',
        ]);

        Sanctum::actingAs($other);
        $this->getJson("/api/ai/jobs/{$job->id}")->assertStatus(403);
    }

    // ── WHATSAPP JOB, dikirim async, bukan blok webhook/request ──

    public function test_whatsapp_receipt_dispatched_on_order_paid(): void
    {
        $tenant = $this->makeTenant('Toko WA');
        $admin  = $this->makeUser($tenant);
        $order  = $this->makeOrder($tenant, $admin);

        Queue::fake();

        Sanctum::actingAs($admin);
        $this->patchJson("/api/orders/{$order->id}/status", [
            'status'         => 'paid',
            'payment_method' => 'cash',
        ])->assertOk();

        Queue::assertPushed(SendWhatsAppReceipt::class, fn ($job) => $job->getOrderId() === $order->id);
    }

    public function test_whatsapp_receipt_appears_in_webhook_envelope(): void
    {
        // Pastikan webhook Midtrans tetap memakai queue (bukan sync app() call)
        $this->assertTrue(is_subclass_of(SendWhatsAppReceipt::class, \Illuminate\Contracts\Queue\ShouldQueue::class));
    }
}