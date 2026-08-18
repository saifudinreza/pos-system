<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email berisi link reset password yang dikirim ke user.
 * {resetUrl} berbentuk: FRONTEND_URL/auth/reset-password?token=...&email=...
 * (di-bangun di AuthController::forgotPassword)
 */
class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param User   $user            user pemilik akun yang minta reset
     * @param string $resetUrl        link reset (sekali pakai, berlaku 60 menit)
     * @param int    $expiresMinutes  masa berlaku link (default 60 menit)
     */
    public function __construct(
        public User $user,
        public string $resetUrl,
        public int $expiresMinutes = 60,
    ) {}

    /**
     * Metadata email: subjek yang tampil di inbox user.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password Akun KasirAI',
        );
    }

    /**
     * Isi email: render blade views/emails/reset-password.blade.php.
     * Variabel $user, $resetUrl & $expiresMinutes otomatis tersedia di view.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
        );
    }
}