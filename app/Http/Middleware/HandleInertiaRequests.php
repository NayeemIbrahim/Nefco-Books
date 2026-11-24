<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user() ?? \App\Models\User::first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'company' => [
                'name'              => $user?->company_name ?? 'Nefco Trading & IT Ltd.',
                'company_name'      => $user?->company_name ?? 'Nefco Trading & IT Ltd.',
                'company_address'   => $user?->company_address ?? 'Dhaka, Bangladesh',
                'phone'             => $user?->phone ?? '+8801711223344',
                'bin_number'        => $user?->bin_number ?? '123456789-0101',
                'currency_symbol'   => $user?->currency_symbol ?? '৳',
                'currency_code'     => $user?->currency_code ?? 'BDT',
                'default_uom'       => $user?->default_uom ?? 'Pcs',
                'enable_stock'      => (bool)($user?->enable_stock ?? false),
                'company_logo'      => $user?->company_logo ?? null,
                'company_icon'      => $user?->company_icon ?? null,
                'whatsapp_template' => $user?->whatsapp_template ?? null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
