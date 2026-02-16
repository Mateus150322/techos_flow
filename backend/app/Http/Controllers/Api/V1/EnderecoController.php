<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Services\Geocoding\NominatimGeocodingService;
use Illuminate\Http\Request;

class EnderecoController extends Controller
{
    public function store(Request $request, NominatimGeocodingService $geo)
    {
        $data = $request->validate([
            'rua' => 'required|string|max:200',
            'numero' => 'nullable|string|max:10',
            'bairro' => 'required|string|max:120',
            'cidade' => 'required|string|max:120',
            'estado' => 'required|string|size:2',
            'cep' => 'nullable|string|max:8',
        ]);

        // cria o endereço primeiro
        $endereco = Endereco::create($data);

        // tenta geocodificar automaticamente
        $coords = $geo->geocode($data);

        if ($coords) {
            $endereco->update([
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
            ]);
        }

        return response()->json($endereco, 201);
    }
}
