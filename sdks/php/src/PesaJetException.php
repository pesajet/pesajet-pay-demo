<?php

namespace PesaJet;

use Exception;

class PesaJetException extends Exception
{
    private ?string $errorCode;
    private $details;

    public function __construct(string $message, int $statusCode = 0, ?string $errorCode = null, $details = null)
    {
        parent::__construct($message, $statusCode);
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    public function getDetails()
    {
        return $this->details;
    }
}

