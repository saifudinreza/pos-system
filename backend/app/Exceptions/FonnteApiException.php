<?php

namespace App\Exceptions;

/**
 * Exception dilempar kalau Fonnte API merespons dengan error (4xx/5xx).
 * Bisa transient (rate limit) atau non-transient (invalid token, invalid number).
 */
class FonnteApiException extends FonnteException
{
    /**
     * @var array|null Response body dari Fonnte (kalau ada)
     */
    public ?array $responseBody;

    /**
     * @param string $message
     * @param int $code HTTP status code dari Fonnte
     * @param array|null $responseBody
     * @param \Throwable|null $previous
     */
    public function __construct(string $message, int $code = 0, ?array $responseBody = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->responseBody = $responseBody;
    }

    /**
     * Cek apakah error ini layak di-retry (transient).
     * Rate limit (429), server error (5xx) = retry.
     * Client error lain (400, 401, 403, 404) = jangan retry.
     */
    public function isRetryable(): bool
    {
        return $this->code === 429 || $this->code >= 500;
    }
}