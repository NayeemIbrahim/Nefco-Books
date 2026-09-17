<?php

namespace App\Exceptions;

use Exception;

class UnbalancedJournalEntryException extends Exception
{
    public function __construct(string $totalDebit, string $totalCredit)
    {
        parent::__construct(
            "Double-Entry Violation: Total Debit (৳ {$totalDebit}) does not balance with Total Credit (৳ {$totalCredit})."
        );
    }
}
