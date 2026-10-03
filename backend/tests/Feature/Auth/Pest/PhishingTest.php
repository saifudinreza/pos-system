<?php

use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Mail;

beforeEach(fn () => $this->withoutThrottle());

/** Minta email reset lalu kembalikan [mailable, html]. */
function phishingResetMail($test, string $email, array $headers = []): array
{
    Mail::fake();
    $test->postJson('/api/forgot-password', ['email' => $email], $headers)->assertOk();

    $mailable = null;
    Mail::assertQueued(ResetPasswordMail::class, function ($mail) use (&$mailable) {
        $mailable = $mail;
        return true;
    });

    return [$mailable, $mailable->render()];
}

it('host header palsu tidak masuk ke isi email', function () {
    $user = $this->createFreshUser();

    [, $html] = phishingResetMail($this, $user->email, ['Host' => 'evil.com', 'X-Forwarded-Host' => 'evil.com']);

    expect($html)->not->toContain('evil.com');
});

it('email resmi berisi otp dan masa berlaku tanpa link', function () {
    $user = $this->createFreshUser();

    [$mail, $html] = phishingResetMail($this, $user->email);

    expect($mail->otp)->toMatch('/^\d{6}$/');
    expect($html)->toContain($mail->otp)->toContain('10 menit');
    expect($html)->not->toContain('<a href')->not->toContain('<form');
});

it('nama user berisi teks menipu tidak menjadi link yang bisa diklik', function () {
    $user = $this->createFreshUser(['name' => 'Admin KasirAI. Akun Anda diblokir, buka https://evil.com']);

    [, $html] = phishingResetMail($this, $user->email);

    expect($html)->not->toContain('<a href');
    $this->observe('P-03', 'teks url tampil sebagai teks polos: ' . (str_contains($html, 'https://evil.com') ? 'ya' : 'tidak'));
});

it('alamat pengirim email terkonfigurasi', function () {
    $from = config('mail.from.address');

    $this->observe('P-04', $from);
    expect($from)->not->toBeEmpty();
});

it('subjek email sesuai', function () {
    $user = $this->createFreshUser();

    [$mail] = phishingResetMail($this, $user->email);

    expect($mail->envelope()->subject)->toBe('Kode Reset Password KasirAI');
});
