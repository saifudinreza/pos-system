<?php

namespace App\Http\Controllers;

use App\Models\User;

/**
 * Base controller untuk semua controller API.
 *
 * Berisi helper pembaca plan efektif & limit read produk/kategori per plan.
 * Limit terpusat di sini supaya gating plan konsisten di semua controller
 * (free 50/15, pro & enterprise unlimited). Dipakai oleh ProductController,
 * CategoryController, dll.
 */
abstract class Controller
{
    /**
     * Determine subscription plan for the tenant.
     * Kasir doesn't own a subscription — use their tenant admin's plan instead.
     */
    protected function getEffectivePlan(User $user): string
    {
        // Admin/developer memakai plan di akunnya sendiri; kasir & customer
        // tidak punya subscription → ikut plan admin di tenant yang sama
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
        $limits = ['free' => 50, 'pro' => null, 'enterprise' => null];

        // array_key_exists, bukan ?? — karena null (unlimited) adalah nilai valid
        return array_key_exists($plan, $limits) ? $limits[$plan] : 50;
    }

    /** Returns read limit (int|null) for categories */
    protected function categoryReadLimits(string $plan): ?int
    {
        $limits = ['free' => 15, 'pro' => null, 'enterprise' => null];

        // array_key_exists, bukan ?? — karena null (unlimited) adalah nilai valid
        return array_key_exists($plan, $limits) ? $limits[$plan] : 15;
    }
}