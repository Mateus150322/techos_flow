<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Models\OrdemServico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrdemServicoController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_servico' => 'required|string|max:100',
            'nome_cliente' => 'required|string|max:255',
            'descricao' => 'required|string',

            'endereco.logradouro' => 'required|string|max:255',
            'endereco.numero' => 'required|string|max:50',
            'endereco.complemento' => 'nullable|string|max:255',
            'endereco.bairro' => 'required|string|max:255',
            'endereco.cidade' => 'required|string|max:255',
            'endereco.estado' => 'required|string|size:2',
            'endereco.cep' => 'required|string|max:9',
        ]);

        $os = DB::transaction(function () use ($data) {
            $endereco = Endereco::create([
                'rua' => $data['endereco']['logradouro'],
                'numero' => $data['endereco']['numero'],
                'complemento' => $data['endereco']['complemento'] ?? null,
                'bairro' => $data['endereco']['bairro'],
                'cidade' => $data['endereco']['cidade'],
                'estado' => strtoupper($data['endereco']['estado']),
                'cep' => preg_replace('/\D/', '', $data['endereco']['cep']),
            ]);

            $ano = now()->year;

            $ultimo = OrdemServico::whereYear('data_abertura', $ano)
                ->orderBy('numero', 'desc')
                ->first();

            $sequencial = $ultimo
                ? (int) substr($ultimo->numero, 5) + 1
                : 1;

            $numero = sprintf('%d-%06d', $ano, $sequencial);

            return OrdemServico::create([
                'numero' => $numero,
                'tipo' => $data['tipo_servico'],
                'nome_cliente' => $data['nome_cliente'],
                'descricao' => $data['descricao'],
                'prioridade' => 2,
                'endereco_id' => $endereco->id,
                'criada_por_id' => Auth::id(),
            ]);
        });

        return response()->json(
            $os->load(['endereco', 'criadaPor']),
            201
        );
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'status' => 'nullable|in:aberta,em_execucao,finalizada,nao_executada,cancelada',
            'prioridade' => 'nullable|integer|in:1,2,3',
            'tipo' => 'nullable|string|max:255',
            'q' => 'nullable|string|max:255',
            'sort' => 'nullable|in:data_abertura,prioridade,status,numero,tipo,nome_cliente',
            'dir' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
            'include' => 'nullable|string',
        ]);

        $perPage = $data['per_page'] ?? 15;
        $sort = $data['sort'] ?? 'data_abertura';
        $dir = $data['dir'] ?? 'desc';

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->values()
            ->all();

        $allowedIncludes = ['endereco', 'criadaPor'];
        $include = array_values(array_intersect($include, $allowedIncludes));

        $query = OrdemServico::query();

        if (!empty($include)) {
            $query->with($include);
        }

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
                    ->orWhere('descricao', 'ilike', "%{$q}%")
                    ->orWhere('nome_cliente', 'ilike', "%{$q}%");
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
            'include' => 'nullable|string',
        ]);

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->values()
            ->all();

        $allowedIncludes = ['endereco', 'criadaPor', 'execucoes', 'execucoes.tecnico', 'anexos'];
        $include = array_values(array_intersect($include, $allowedIncludes));

        $query = OrdemServico::query();

        if (!empty($include)) {
            $query->with($include);
        }

        $os = $query->where('id', $id)->firstOrFail();

        return response()->json($os);
    }
}