<?php

namespace App\Exceptions;

/**
 * Exception dilempar kalau token Fonnte belum dikonfigurasi di .env / config.
 * Ini NON-transient — jangan retry, perbaiki konfigurasi dulu.
 */
class FonnteNotConfiguredException extends FonnteException
{
    public function __construct(string $message = 'Fonnte token belum dikonfigurasi. Set FONNTE_TOKEN di .env', int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}