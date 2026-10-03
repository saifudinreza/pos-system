<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class, DisposableAuthUser::class)
    ->beforeEach(function () {
        $this->assertSafeTestDatabase();
    })
    ->afterEach(function () {
        $this->cleanupCreatedUsers();
    })
    ->in('Feature/Auth/Pest');
