<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('payment_allocations')) {
            Schema::create('payment_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
                $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
                $table->decimal('amount', 15, 2);
                $table->timestamps();

                $table->unique(['payment_id', 'invoice_id']);
            });
        }

        // Backfill existing invoice-linked customer payments without altering ledger/invoice balances
        $existingPayments = DB::table('payments')
            ->where('type', 'CUSTOMER_PAYMENT')
            ->whereNotNull('invoice_id')
            ->get();

        foreach ($existingPayments as $pay) {
            $invoice = DB::table('invoices')->where('id', $pay->invoice_id)->first();
            if (! $invoice) {
                continue;
            }

            $alreadyAllocated = DB::table('payment_allocations')
                ->where('payment_id', $pay->id)
                ->where('invoice_id', $pay->invoice_id)
                ->exists();

            if (! $alreadyAllocated) {
                $allocAmount = min((float) $pay->amount, max(0, (float) $invoice->total_amount));
                if ($allocAmount > 0) {
                    DB::table('payment_allocations')->insert([
                        'payment_id' => $pay->id,
                        'invoice_id' => $pay->invoice_id,
                        'amount'     => $allocAmount,
                        'created_at' => $pay->created_at ?? now(),
                        'updated_at' => $pay->updated_at ?? now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
    }
};
