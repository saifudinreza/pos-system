<?php

// Throttle SENGAJA aktif di file ini.

it('sepuluh percobaan dari satu IP diblokir setelah batas', function () {
    $users = [$this->createFreshUser(), $this->createFreshUser(), $this->createFreshUser()];

    $statuses = [];
    for ($i = 0; $i < 10; $i++) {
        $user       = $users[$i % 3];
        $password   = $i % 2 === 0 ? $this->wrongPassword() : $this->validPassword();
        $statuses[] = $this->loginAs($user->email, $password)->getStatusCode();
    }

    expect(array_slice($statuses, 5))->each->toBe(429);
});

it('login baru membatalkan token perangkat sebelumnya', function () {
    $user = $this->createFreshUser();
    $old  = $this->loginAs($user->email, $this->validPassword())->json('data.token');

    $this->loginAs($user->email, $this->validPassword())->assertOk();

    $this->requestWithToken('GET', '/api/me', $old)->assertStatus(401);
});
