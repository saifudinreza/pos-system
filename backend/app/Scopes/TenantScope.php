<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * Global scope multi-tenant, filter otomatis semua query model tenant-aware
 * berdasarkan tenant_id user yang sedang login.
 *
 * Dipakai via static::addGlobalScope(new TenantScope) di model yang
 * bersangkutan (User, Product, Order, Shift, dst). Kolom di-qualify dengan
 * nama tabel (mis. "products.tenant_id") supaya tidak ambigu saat query
 * memakai join antar tabel.
 */
class TenantScope implements Scope
{
    /**
     * Terapkan filter WHERE tenant_id pada builder query.
     *
     * - Tanpa user login → tidak ada filter (dipakai di konteks non-HTTP,
     *   mis. queue worker/job, yang memang sengaja tidak menyentuh data tenant).
     * - User login & punya tenant → hanya data tenant-nya.
     * - Developer (tenant_id = null) → tidak difilter, bisa lihat semua tenant.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Hanya apply filter kalau ada user yang login DAN user punya tenant
        // Developer (tenant_id = null) → skip filter, bisa lihat semua data
        if (Auth::check() && Auth::user()->tenant_id !== null) {
            $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
        }
    }
}