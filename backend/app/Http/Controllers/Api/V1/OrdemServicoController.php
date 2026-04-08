<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Models\OrdemServico;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\DB as QueryBuilder;
use Illuminate\Support\Str;

class OrdemServicoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo_servico' => 'required|string|max:100',
            'nome_cliente' => 'required|string|max:255',
            'prioridade' => 'required|integer|in:1,2,3',
            'descricao' => 'required|string',

            'endereco.logradouro' => 'required|string|max:255',
            'endereco.numero' => 'required|string|max:50',
            'endereco.complemento' => 'nullable|string|max:255',
            'endereco.bairro' => 'required|string|max:255',
            'endereco.cidade' => 'required|string|max:255',
            'endereco.estado' => 'required|string|size:2',
            'endereco.cep' => 'required|string|max:9',
        ]);

        $user = $request->user();

        if (
            $user->role === 'tecnico' &&
            $this->normalizeTipoServico($data['tipo_servico']) !== 'manutencao eta/ete'
        ) {
            return response()->json([
                'message' => 'Técnico só pode abrir OS do tipo Manutenção ETA/ETE.',
            ], 403);
        }

        $os = null;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                $os = DB::transaction(function () use ($data, $user) {
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
                    $numero = $this->generateOrderNumber($ano);

                    return OrdemServico::create([
                        'numero' => $numero,
                        'tipo' => $data['tipo_servico'],
                        'nome_cliente' => $data['nome_cliente'],
                        'descricao' => $data['descricao'],
                        'prioridade' => $data['prioridade'],
                        'endereco_id' => $endereco->id,
                        'criada_por_id' => $user->id,
                        'tecnico_responsavel_id' => $user->role === 'tecnico' ? $user->id : null,
                    ]);
                });

                break;
            } catch (QueryException $exception) {
                if (! $this->isDuplicateOrderNumberException($exception) || $attempt === 4) {
                    throw $exception;
                }
            }
        }

        return response()->json(
            $os->load(['endereco', 'criadaPor', 'tecnicoResponsavel']),
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

        $allowedIncludes = ['endereco', 'criadaPor', 'tecnicoResponsavel'];
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
            $tipo = mb_strtolower($data['tipo']);
            $query->where(QueryBuilder::raw('LOWER(tipo)'), 'like', '%' . $tipo . '%');
        }

        if (!empty($data['q'])) {
            $q = mb_strtolower($data['q']);

            $query->where(function ($w) use ($q) {
                $w->where(QueryBuilder::raw('LOWER(numero)'), 'like', "%{$q}%")
                    ->orWhere(QueryBuilder::raw('LOWER(descricao)'), 'like', "%{$q}%")
                    ->orWhere(QueryBuilder::raw('LOWER(nome_cliente)'), 'like', "%{$q}%");
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

        $allowedIncludes = [
            'endereco',
            'criadaPor',
            'tecnicoResponsavel',
            'execucoes',
            'execucoes.tecnico',
            'anexos',
        ];
        $include = array_values(array_intersect($include, $allowedIncludes));

        $query = OrdemServico::query();

        if (!empty($include)) {
            $query->with($include);
        }

        $os = $query->where('id', $id)->firstOrFail();

        return response()->json($os);
    }

    public function marcarNaoExecutada(Request $request, string $id)
    {
        $data = $request->validate([
            'motivo_nao_execucao' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if (in_array($os->status, ['finalizada', 'cancelada', 'nao_executada'], true)) {
            return response()->json([
                'message' => 'Não é possível marcar como não executada uma OS já encerrada.',
            ], 422);
        }

        $os->status = 'nao_executada';
        $os->motivo_nao_execucao = $data['motivo_nao_execucao'];
        $os->data_encerramento = now();
        $os->save();

        return response()->json([
            'message' => 'OS marcada como não executada com sucesso.',
            'os' => $os,
        ]);
    }

    public function aceitar(Request $request, string $id)
    {
        $user = $request->user();

        if ($user->role !== 'tecnico') {
            return response()->json(['message' => 'Apenas técnicos podem aceitar OS.'], 403);
        }

        $os = OrdemServico::query()->findOrFail($id);

        if ($os->status !== 'aberta') {
            return response()->json([
                'message' => 'Apenas OS abertas podem ser aceitas.',
            ], 422);
        }

        if ($os->tecnico_responsavel_id) {
            if ($os->tecnico_responsavel_id === $user->id) {
                return response()->json([
                    'message' => 'Essa OS já está atribuída a você.',
                    'data' => $os,
                ]);
            }

            return response()->json([
                'message' => 'Essa OS já foi aceita por outro técnico.',
            ], 409);
        }

        $os->update([
            'tecnico_responsavel_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'OS aceita com sucesso.',
            'data' => $os->fresh(['tecnicoResponsavel']),
        ]);
    }

    private function generateOrderNumber(int $year): string
    {
        $lastOrder = OrdemServico::query()
            ->whereYear('data_abertura', $year)
            ->lockForUpdate()
            ->orderByDesc('numero')
            ->first();

        $sequence = $lastOrder
            ? (int) Str::after($lastOrder->numero, "{$year}-") + 1
            : 1;

        return sprintf('%d-%06d', $year, $sequence);
    }

    private function isDuplicateOrderNumberException(QueryException $exception): bool
    {
        return in_array((string) $exception->getCode(), ['23000', '23505'], true);
    }

    private function normalizeTipoServico(?string $value): string
    {
        return (string) Str::of($value ?? '')
            ->ascii()
            ->lower()
            ->squish();
    }
}
