<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected ?string $phoneNumberId;
    protected ?string $accessToken;
    protected string $apiVersion;

    public function __construct()
    {
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->accessToken    = config('services.whatsapp.access_token');
        $this->apiVersion     = config('services.whatsapp.api_version', 'v18.0');
    }

    public function sendInvoiceNotification(Invoice $invoice): array
    {
        $contact = $invoice->contact;
        $formattedPhone = preg_replace('/\D/', '', $contact->whatsapp_number);
        $totalBDT = number_format((float)$invoice->total_amount, 2);
        $dueDate = $invoice->due_date ? $invoice->due_date->format('d M, Y') : 'Due upon receipt';

        $bodyText = "Dear {$contact->name},\n\n"
            . "Invoice *{$invoice->invoice_number}* has been issued for your order from *Nefco Books*.\n\n"
            . "*Total Amount:* ৳ {$totalBDT}\n"
            . "*Due Date:* {$dueDate}\n\n"
            . "Thank you for doing business with Nefco Books!";

        return $this->sendMessage($formattedPhone, $bodyText);
    }

    public function sendPaymentNotification(Payment $payment): array
    {
        $contact = $payment->contact;
        $formattedPhone = preg_replace('/\D/', '', $contact->whatsapp_number);
        $amountBDT = number_format((float)$payment->amount, 2);
        $invoiceNumber = $payment->invoice ? $payment->invoice->invoice_number : 'Account Credit';
        $paymentDate = $payment->payment_date ? $payment->payment_date->format('d M, Y') : now()->format('d M, Y');

        $bodyText = "Dear {$contact->name},\n\n"
            . "Payment Receipt *{$payment->payment_number}* confirmed by *Nefco Books*!\n\n"
            . "*Amount Paid:* ৳ {$amountBDT}\n"
            . "*For Invoice:* {$invoiceNumber}\n"
            . "*Date:* {$paymentDate}\n\n"
            . "Thank you for choosing Nefco Books!";

        return $this->sendMessage($formattedPhone, $bodyText);
    }

    protected function sendMessage(string $recipientPhone, string $messageBody): array
    {
        if (
            empty($this->phoneNumberId) ||
            empty($this->accessToken) ||
            str_starts_with($this->accessToken, 'mock_')
        ) {
            Log::info('[WhatsApp Mock Dispatch]:', [
                'to'      => $recipientPhone,
                'message' => $messageBody,
            ]);

            return [
                'success'   => true,
                'mock'      => true,
                'recipient' => $recipientPhone,
            ];
        }

        try {
            $endpoint = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

            $response = Http::withToken($this->accessToken)
                ->timeout(15)
                ->post($endpoint, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type'    => 'individual',
                    'to'                => $recipientPhone,
                    'type'              => 'text',
                    'text'              => [
                        'body' => $messageBody,
                    ],
                ]);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            Log::error('WhatsApp API Error Response:', $response->json());
            return ['success' => false, 'error' => $response->body()];
        } catch (\Throwable $e) {
            Log::error('WhatsApp Cloud API Exception:', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
