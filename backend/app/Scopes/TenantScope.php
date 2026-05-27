<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Hanya apply filter kalau ada user yang login DAN user punya tenant
        // Developer (tenant_id = null) → skip filter, bisa lihat semua data
        if (Auth::check() && Auth::user()->tenant_id !== null) {
            $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
        }
    }
}
