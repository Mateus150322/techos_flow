<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\OrdemServicoDashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly OrdemServicoDashboardService $dashboardService
    ) {
    }

    public function admin()
    {
        return response()->json($this->dashboardService->buildAdminDashboard());
    }

    public function atendente(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:255',
            'per_section' => 'nullable|integer|min:1|max:25',
        ]);

        return response()->json(
            $this->dashboardService->buildAtendenteDashboard(
                $data['q'] ?? null,
                $data['per_section'] ?? 12
            )
        );
    }

    public function tecnico(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:255',
            'per_section' => 'nullable|integer|min:1|max:25',
        ]);

        return response()->json(
            $this->dashboardService->buildTecnicoDashboard(
                $request->user(),
                $data['q'] ?? null,
                $data['per_section'] ?? 12
            )
        );
    }
}
