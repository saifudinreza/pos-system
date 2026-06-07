<?php

namespace App\Http\Controllers;

use App\Models\User;

abstract class Controller
{
    /**
     * Determine subscription plan for the tenant.
     * Kasir doesn't own a subscription — use their tenant admin's plan instead.
     */
    protected function getEffectivePlan(User $user): string
    {
        if (in_array($user->role, ['admin', 'developer'])) {
            return $user->subscription_plan ?? 'free';
        }

        $admin = User::where('tenant_id', $user->tenant_id)
            ->where('role', 'admin')
            ->first();

        return $admin?->subscription_plan ?? 'free';
    }

    /** Returns [readLimit (int|null), limits array] for products */
    protected function productReadLimits(string $plan): ?int
    {
        return ['free' => 5, 'pro' => 30, 'enterprise' => null][$plan] ?? 5;
    }

    /** Returns read limit (int|null) for categories */
    protected function categoryReadLimits(string $plan): ?int
    {
        return ['free' => 3, 'pro' => 10, 'enterprise' => null][$plan] ?? 3;
    }
}
