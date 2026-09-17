<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(public Invoice $invoice)
    {
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        $whatsAppService->sendInvoiceNotification($this->invoice);
    }
}
