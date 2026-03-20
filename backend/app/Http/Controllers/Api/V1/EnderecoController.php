<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Services\Geocoding\NominatimGeocodingService;
use Illuminate\Http\Request;

class EnderecoController extends Controller
{
    public function index()
    {
        $enderecos = Endereco::orderBy('rua')
            ->orderBy('numero')
            ->get();

        return response()->json($enderecos);
    }

    public function store(Request $request, NominatimGeocodingService $geo)
    {
        $data = $request->validate([
            'rua' => 'required|string|max:200',
            'numero' => 'nullable|string|max:20',
            'complemento' => 'nullable|string|max:255',
            'bairro' => 'required|string|max:120',
            'cidade' => 'required|string|max:120',
            'estado' => 'required|string|size:2',
            'cep' => 'nullable|string|max:8',
        ]);

        $data['estado'] = strtoupper($data['estado']);

        if (!empty($data['cep'])) {
            $data['cep'] = preg_replace('/\D/', '', $data['cep']);
        }

        $endereco = Endereco::create($data);

        $coords = $geo->geocode([
            'rua' => $endereco->rua,
            'numero' => $endereco->numero,
            'bairro' => $endereco->bairro,
            'cidade' => $endereco->cidade,
            'estado' => $endereco->estado,
            'cep' => $endereco->cep,
        ]);

        if ($coords) {
            $endereco->update([
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
            ]);
        }

        return response()->json($endereco, 201);
    }
}