<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

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

        return response()->json([
            'plan'         => $user->subscription_plan,
            'subscription' => $active ? $this->formatSubscription($active) : null,
        ]);
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

