<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller; 
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrdemServicoController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|string|max:100',
            'descricao' => 'required|string',
            'prioridade' => 'nullable|integer|in:1,2,3',
            'endereco_id' => 'required|uuid|exists:enderecos,id',
        ]);

        $ano = now()->year;

        $ultimo = OrdemServico::whereYear('data_abertura', $ano)
            ->orderBy('numero', 'desc')
            ->first();

        $sequencial = $ultimo
            ? (int) substr($ultimo->numero, 5) + 1
            : 1;

        $numero = sprintf('%d-%06d', $ano, $sequencial);

        $os = OrdemServico::create([
            'numero' => $numero,
            'tipo' => $data['tipo'],
            'descricao' => $data['descricao'],
            'prioridade' => $data['prioridade'] ?? 2,
            'endereco_id' => $data['endereco_id'],
            'criada_por_id' => Auth::id(),
        ]);

        return response()->json($os, 201);
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'status' => 'nullable|in:aberta,em_execucao,finalizada,nao_executada,cancelada',
            'prioridade' => 'nullable|integer|in:1,2,3',
            'tipo' => 'nullable|string|max:255',
            'q' => 'nullable|string|max:255', // busca em numero/decricao
            'sort' => 'nullable|in:data_abertura,prioridade,status,numero,tipo',
            'dir' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
            'include' => 'nullable|string', // "endereco,criadopor"
        ]);

        $perPage = $data['per_page'] ?? 15;
        $sort = $data['sort'] ?? 'data_abertura';
        $dir = $data['dir'] ?? 'desc';

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn($s) => trim($s))
            ->filter()
            ->values()
            ->all();
        
        // includes permitidos
        $allowedIncludes = ['endereco', 'criadoPor'];
        $include = array_values(array_intersect($include,$allowedIncludes));

        $query = \App\Models\OrdemServico::query();
        if (!empty($include)) {
            $query->with($include);
        }

        // filtros
        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (!empty($data['prioridade'])) {
            $query->where('prioridade', (int) $data['prioridade']);

        }

        if (!empty($data['tipo'])) {
            $query->where('tipo', 'ilike', '%' . $data['tipo'] . '%');

        }

        if (!empty($data['q'])) {
            $q = $data['q'];
            $query->where(function ($w) use ($q) {
                $w->where('numero', 'ilike', "%{$q}%")
                    ->orWhere('descricao', 'ilike', "%{$q}%");
            });
        }
        
        $query->orderBy($sort, $dir);

        return response()->json(
            $query->paginate($perPage)->appends($request->query())
        );
    }

    public function show(Request $request, string $id)
    {
        $data = $request->validate([
            'include' => 'nullable|string', // "endereco,criadopor,execucoes"
        ]);

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn($s) => trim($s))
            ->filter()
            ->values()
            ->all();
        
        $allowedIncludes = ['endereco', 'criadoPor', 'execucoes', 'anexos'];
        $include = array_values(array_intersect($include,$allowedIncludes));

        $query = \App\Models\OrdemServico::query();

        if (!empty($include)) {
            $query->with($include);
        }

        $os = $query->where('id', $id)->firstOrFail();
        
        return response()->json($os);
    }
}
