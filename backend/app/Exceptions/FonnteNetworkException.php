<?php

namespace App\Exceptions;

/**
 * Exception dilempar kalau gagal koneksi ke Fonnte (timeout, DNS, TLS, dll).
 * Ini TRANSIENT — layak di-retry oleh queue worker.
 */
class FonnteNetworkException extends FonnteException
{
    public function __construct(string $message = 'Gagal terhubung ke Fonnte API', int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}