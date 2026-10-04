<?php

namespace App\Mail;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Pengingat sebelum langganan berakhir (dikirim subscriptions:remind).
 *
 * Dikirim dari alamat pengirim aplikasi (Resend, domain terverifikasi), dengan
 * Reply-To ke email dukungan (config kasirai.support_email) supaya balasan
 * pelanggan masuk ke kotak masuk dukungan.
 */
class SubscriptionReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    /**
     * @param Subscription $subscription langganan yang akan/sudah berakhir
     * @param int          $daysLeft     7, 3, 1, atau 0 (sudah berakhir, masa tenggang)
     * @param int          $graceDays    masa tenggang sebelum turun ke Free
     */
    public function __construct(
        public Subscription $subscription,
        public int $daysLeft,
        public int $graceDays = 3,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->daysLeft > 0
            ? "Langganan KasirAI kamu berakhir {$this->daysLeft} hari lagi"
            : 'Langganan KasirAI kamu sudah berakhir, perpanjang sekarang';

        return new Envelope(
            subject: $subject,
            replyTo: [new Address(config('kasirai.support_email'), 'Dukungan KasirAI')],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-reminder',
            with: [
                'user'       => $this->subscription->user,
                'planName'   => ucfirst($this->subscription->plan),
                'expiresAt'  => $this->subscription->expires_at?->timezone('Asia/Jakarta')->translatedFormat('d F Y'),
                'daysLeft'   => $this->daysLeft,
                'graceDays'  => $this->graceDays,
                'renewUrl'   => rtrim((string) config('services.frontend_url'), '/') . '/upgrade?plan=' . $this->subscription->plan,
                'supportEmail' => config('kasirai.support_email'),
            ],
        );
    }
}
