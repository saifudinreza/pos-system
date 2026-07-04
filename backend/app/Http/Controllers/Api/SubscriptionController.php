<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use Midtrans\Transaction;

class SubscriptionController extends Controller
{
    const PRICES = [
        'pro'        => ['monthly' => 250000, 'yearly' => 200000],
        'enterprise' => ['monthly' => 799000, 'yearly' => 649000],
    ];

    public function __construct()
    {
        Config::$serverKey    = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;
    }

    // GET /api/subscription — status langganan user yang login
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $active = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('created_at')
            ->first();

        $pending = Subscription::where('user_id', $user->id)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'plan'         => $user->subscription_plan,
            'subscription' => $active ? $this->formatSubscription($active) : null,
            'pending'      => $pending ? $this->formatSubscription($pending) : null,
        ]);
    }

    // POST /api/subscription/cancel-pending — user batalkan transaksi pending miliknya sendiri
    public function cancelPending(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = Subscription::where('user_id', $user->id)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->first();

        if (! $subscription) {
            return response()->json(['message' => 'Tidak ada transaksi pending untuk dibatalkan.'], 404);
        }

        // Batalkan juga di sisi Midtrans supaya VA/instruksi bayar yang sudah
        // diterbitkan langsung nonaktif (user tidak bisa transfer lagi setelah ini).
        try {
            Transaction::cancel($subscription->midtrans_order_id);
        } catch (\Exception $e) {
            // Transaksi mungkin belum sempat berstatus "pending" di sisi Midtrans
            // (misal user tutup popup sebelum pilih metode bayar) — aman dilanjutkan.
            Log::warning('Midtrans cancel gagal, lanjut batalkan lokal: ' . $e->getMessage());
        }

        $subscription->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Transaksi berhasil dibatalkan.']);
    }

    // POST /api/subscription/initiate — buat transaksi Midtrans untuk upgrade
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan'         => ['required', 'in:pro,enterprise'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
            'name'         => ['required', 'string', 'max:255'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'address'      => ['nullable', 'string', 'max:500'],
        ]);

        $user   = $request->user();
        $plan   = $validated['plan'];
        $cycle  = $validated['billing_cycle'];
        $amount = self::PRICES[$plan][$cycle];

        // Batalkan subscription pending yang lama untuk user ini
        Subscription::where('user_id', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $midtransOrderId = 'SUB-' . strtoupper($plan) . '-' . $user->id . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $validated['name'],
                'email'      => $user->email,
                'phone'      => $validated['phone'] ?? $user->phone ?? '-',
            ],
            'item_details' => [[
                'id'       => 'SUB-' . strtoupper($plan),
                'price'    => $amount,
                'quantity' => 1,
                'name'     => 'KasirAI ' . ucfirst($plan) . ' (' . ucfirst($cycle) . ')',
            ]],
        ];

        $snapToken = Snap::getSnapToken($params);

        $subscription = Subscription::create([
            'user_id'          => $user->id,
            'plan'             => $plan,
            'billing_cycle'    => $cycle,
            'amount'           => $amount,
            'status'           => 'pending',
            'midtrans_order_id' => $midtransOrderId,
            'snap_token'       => $snapToken,
        ]);

        return response()->json([
            'message'    => 'Pembayaran siap. Lanjutkan via Midtrans.',
            'snap_token' => $snapToken,
            'order_id'   => $midtransOrderId,
            'amount'     => $amount,
            'plan'       => $plan,
        ], 201);
    }

    // POST /api/webhook/midtrans-subscription — webhook Midtrans untuk subscription
    public function webhook(Request $request): JsonResponse
    {
        try {
            $notification  = new Notification();
            $orderId       = $notification->order_id;
            $txStatus      = $notification->transaction_status;
            $paymentType   = $notification->payment_type;
            $fraudStatus   = $notification->fraud_status;

            // Hanya proses jika ini subscription order (prefix SUB-)
            if (! str_starts_with($orderId, 'SUB-')) {
                return response()->json(['message' => 'OK'], 200);
            }

            $subscription = Subscription::where('midtrans_order_id', $orderId)->first();
            if (! $subscription) {
                return response()->json(['message' => 'OK'], 200);
            }

            DB::transaction(function () use ($subscription, $txStatus, $paymentType, $fraudStatus, $notification) {
                if ($txStatus === 'capture') {
                    $status = $fraudStatus === 'accept' ? 'active' : 'cancelled';
                } elseif ($txStatus === 'settlement') {
                    $status = 'active';
                } elseif (in_array($txStatus, ['cancel', 'deny', 'expire'])) {
                    $status = 'cancelled';
                } else {
                    $status = 'pending';
                }

                $expiresAt = null;
                if ($status === 'active') {
                    $expiresAt = $subscription->billing_cycle === 'yearly'
                        ? now()->addYear()
                        : now()->addMonth();
                }

                $subscription->update([
                    'status'              => $status,
                    'payment_method'      => $paymentType,
                    'paid_at'             => $status === 'active' ? now() : null,
                    'expires_at'          => $expiresAt,
                    'midtrans_response'   => $notification->getResponse(),
                ]);

                if ($status === 'active') {
                    // Upgrade subscription plan DAN role jadi admin
                    $subscription->user->update([
                        'subscription_plan' => $subscription->plan,
                        'role'              => 'admin',
                    ]);
                    Log::info('Subscription activated: user_id=' . $subscription->user_id . ' plan=' . $subscription->plan . ' → role upgraded to admin');
                }
            });

            return response()->json(['message' => 'OK'], 200);
        } catch (\Exception $e) {
            Log::error('Subscription webhook error: ' . $e->getMessage());
            return response()->json(['message' => 'Error'], 500);
        }
    }

    // GET /api/dev/subscriptions — semua tenant & status langganan (developer only)
    public function devIndex(): JsonResponse
    {
        $developer = User::withoutGlobalScopes()->where('role', 'developer')->first();

        $users = User::withoutGlobalScopes()
            ->where('role', 'admin')
            ->with(['subscriptions' => fn($q) => $q->orderByDesc('created_at')])
            ->get()
            ->map(function ($user) {
                $activeSub = $user->subscriptions->where('status', 'active')->first();
                $latestSub = $user->subscriptions->first();

                if (!$user->is_active) {
                    $status = 'suspended';
                } elseif ($activeSub) {
                    $status = 'active';
                } elseif ($latestSub) {
                    $status = 'expired';
                } else {
                    $status = 'free';
                }

                return [
                    'id'           => $user->id,
                    'user_name'    => $user->name,
                    'user_email'   => $user->email,
                    'plan'         => $user->subscription_plan ?? 'free',
                    'status'       => $status,
                    'started_at'   => $activeSub?->paid_at?->format('Y-m-d')
                                   ?? $activeSub?->created_at?->format('Y-m-d')
                                   ?? $user->created_at->format('Y-m-d'),
                    'expires_at'   => $activeSub?->expires_at?->format('Y-m-d'),
                    'is_trial'     => false,
                    'is_developer' => false,
                    'is_active'    => $user->is_active,
                ];
            });

        $devEntry = $developer ? [[
            'id'           => $developer->id,
            'user_name'    => $developer->name . ' (Developer)',
            'user_email'   => $developer->email,
            'plan'         => 'enterprise',
            'status'       => 'active',
            'started_at'   => '2025-01-01',
            'expires_at'   => null,
            'is_trial'     => false,
            'is_developer' => true,
            'is_active'    => true,
        ]] : [];

        $all = array_merge($devEntry, $users->toArray());

        return response()->json([
            'data'  => $all,
            'stats' => [
                'total'      => count($all),
                'active'     => collect($all)->where('status', 'active')->count(),
                'free'       => collect($all)->where('plan', 'free')->count(),
                'pro'        => collect($all)->where('plan', 'pro')->count(),
                'enterprise' => collect($all)->where('plan', 'enterprise')->count(),
            ],
        ]);
    }

    // PATCH /api/dev/subscriptions/{userId}/plan
    public function devUpdatePlan(int $userId): JsonResponse
    {
        $validated = request()->validate(['plan' => ['required', 'in:free,pro,enterprise']]);
        $user = User::withoutGlobalScopes()->findOrFail($userId);

        if ($user->role === 'developer') {
            return response()->json(['message' => 'Developer account tidak bisa diubah.'], 422);
        }

        $user->update(['subscription_plan' => $validated['plan']]);

        if ($validated['plan'] === 'free') {
            Subscription::where('user_id', $userId)->where('status', 'active')
                ->update(['status' => 'expired', 'expires_at' => now()]);
        }

        return response()->json(['message' => 'Plan berhasil diubah.', 'plan' => $validated['plan']]);
    }

    // PATCH /api/dev/subscriptions/{userId}/toggle — suspend / aktifkan akun
    public function devToggleStatus(int $userId): JsonResponse
    {
        $user = User::withoutGlobalScopes()->findOrFail($userId);

        if ($user->role === 'developer') {
            return response()->json(['message' => 'Developer account tidak bisa diubah.'], 422);
        }

        $newActive = !$user->is_active;
        $user->update(['is_active' => $newActive]);

        if (!$newActive) {
            Subscription::where('user_id', $userId)->where('status', 'active')
                ->update(['status' => 'suspended']);
        } else {
            Subscription::where('user_id', $userId)->where('status', 'suspended')
                ->update(['status' => 'active']);
        }

        return response()->json([
            'message' => $newActive ? 'Akun diaktifkan.' : 'Akun ditangguhkan.',
            'status'  => $newActive ? 'active' : 'suspended',
        ]);
    }

    private function formatSubscription(Subscription $s): array
    {
        return [
            'id'           => $s->id,
            'plan'         => $s->plan,
            'billing_cycle' => $s->billing_cycle,
            'amount'       => $s->amount,
            'status'       => $s->status,
            'paid_at'      => $s->paid_at?->format('d M Y'),
            'expires_at'   => $s->expires_at?->format('d M Y'),
        ];
    }
}

