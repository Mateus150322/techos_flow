<?php

namespace App\Services\Geocoding;

use Illuminate\Support\Facades\Http;

class NominatimGeocodingService
{
    public function geocode(array $endereco): ?array
    {
        $query = $this->buildQuery($endereco);

        $resp = Http::timeout(5)
            ->withHeaders([
                'User-Agent' => 'TechOSFlow/1.0 (mateus)',
                'Accept-Language' => 'pt-BR',
            ])
            ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query,
                'format' => 'json',
                'limit' => 1,
            ]);

        if (! $resp->successful()) return null;

        $data = $resp->json();
        if (!is_array($data) || count($data) === 0) return null;

        $item = $data[0];
        if (!isset($item['lat'], $item['lon'])) return null;

        return [
            'lat' => (float) $item['lat'],
            'lng' => (float) $item['lon'],
        ];
    }

    private function buildQuery(array $e): string
    {
        $parts = array_filter([
            $e['rua'] ?? null,
            $e['numero'] ?? null,
            $e['bairro'] ?? null,
            $e['cidade'] ?? null,
            $e['estado'] ?? null,
            $e['cep'] ?? null,
            'Brasil',
        ]);

        return implode(', ', $parts);
    }
}
