<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email berisi kode OTP 6 digit untuk reset password (dibuat di
 * AuthController::forgotPassword, user mengetiknya di halaman lupa password).
 */
class ResetPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Batasi percobaan & waktu supaya email macet tidak menyandera worker queue tunggal. */
    public int $tries = 2;
    public int $timeout = 30;

    /**
     * @param User   $user            user pemilik akun yang minta reset
     * @param string $otp             kode 6 digit (sekali pakai)
     * @param int    $expiresMinutes  masa berlaku kode (default 10 menit)
     */
    public function __construct(
        public User $user,
        public string $otp,
        public int $expiresMinutes = 10,
    ) {}

    /**
     * Metadata email: subjek yang tampil di inbox user.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode Reset Password KasirAI',
        );
    }

    /**
     * Isi email: render blade views/emails/reset-password.blade.php.
     * Variabel $user, $otp & $expiresMinutes otomatis tersedia di view.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
        );
    }
}