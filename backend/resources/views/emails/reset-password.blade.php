<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password KasirAI</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF6EE; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EE; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width:480px; background-color:#FFFFFF; border:3px solid #0A0A0A; box-shadow:6px 6px 0 #0A0A0A;">
                    <tr>
                        <td style="padding:28px;">
                            <h1 style="margin:0 0 4px; font-size:26px; font-weight:900; color:#0A0A0A;">KasirAI</h1>
                            <p style="margin:0 0 20px; font-size:13px; color:#0A0A0A; opacity:0.6;">Reset Password Akun</p>

                            <p style="font-size:14px; color:#0A0A0A; line-height:1.6; margin:0 0 16px;">
                                Halo <strong>{{ $user->name }}</strong>,
                            </p>
                            <p style="font-size:14px; color:#0A0A0A; line-height:1.6; margin:0 0 16px;">
                                Kami menerima permintaan untuk mengganti password akun KasirAI kamu.
                                Klik tombol di bawah ini untuk melanjutkan:
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                <tr>
                                    <td align="center" style="background-color:#FFCE3D; border:2px solid #0A0A0A; box-shadow:3px 3px 0 #0A0A0A;">
                                        <a href="{{ $resetUrl }}"
                                           style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:700; color:#0A0A0A; text-decoration:none;">
                                            Reset Password →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size:13px; color:#0A0A0A; line-height:1.6; margin:0 0 8px;">
                                Link ini berlaku selama <strong>{{ $expiresMinutes }} menit</strong> dan hanya bisa
                                dipakai <strong>sekali</strong>. Kalau sudah kedaluwarsa, minta link baru lagi di halaman
                                login → "Lupa password?".
                            </p>
                            <p style="font-size:13px; color:#0A0A0A; line-height:1.6; margin:0;">
                                Kalau kamu tidak merasa minta reset password, abaikan email ini — password kamu aman.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#0A0A0A; padding:12px 28px;">
                            <p style="margin:0; font-size:11px; color:#FFFFFF; opacity:0.7;">KasirAI — POS untuk UMKM Indonesia</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>