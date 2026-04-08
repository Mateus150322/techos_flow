<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Support\Concerns\UsesCaseInsensitiveLike;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrdemServicoController extends Controller
{
    use EnsuresTecnicoResponsavel;
    use UsesCaseInsensitiveLike;

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
                'message' => 'Tecnico so pode abrir OS do tipo Manutencao ETA/ETE.',
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
        $data = $this->validateListFilters($request);

        $perPage = $data['per_page'] ?? 15;
        $sort = $data['sort'] ?? 'data_abertura';
        $dir = $data['dir'] ?? 'desc';

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn ($value) => trim($value))
            ->filter()
            ->values()
            ->all();

        $allowedIncludes = ['endereco', 'criadaPor', 'tecnicoResponsavel'];
        $include = array_values(array_intersect($include, $allowedIncludes));

        $query = OrdemServico::query();

        if (! empty($include)) {
            $query->with($include);
        }

        $this->applyListFilters($query, $data);

        $query->orderBy($sort, $dir);

        return response()->json(
            $query->paginate($perPage)->appends($request->query())
        );
    }

    public function summary(Request $request)
    {
        $data = $this->validateListFilters($request);
        $query = OrdemServico::query();

        $this->applyListFilters($query, $data);

        return response()->json([
            'total' => (clone $query)->count(),
            'abertas' => (clone $query)->where('status', 'aberta')->count(),
            'em_execucao' => (clone $query)->where('status', 'em_execucao')->count(),
            'finalizadas' => (clone $query)->where('status', 'finalizada')->count(),
            'nao_executadas' => (clone $query)->where('status', 'nao_executada')->count(),
            'canceladas' => (clone $query)->where('status', 'cancelada')->count(),
            'encerradas' => (clone $query)->whereIn('status', ['finalizada', 'nao_executada', 'cancelada'])->count(),
        ]);
    }

    public function filterOptions()
    {
        return response()->json([
            'tipos' => OrdemServico::query()
                ->whereNotNull('tipo')
                ->orderBy('tipo')
                ->pluck('tipo')
                ->filter()
                ->unique()
                ->values(),
        ]);
    }

    public function show(Request $request, string $id)
    {
        $data = $request->validate([
            'include' => 'nullable|string',
        ]);

        $include = collect(explode(',', $data['include'] ?? ''))
            ->map(fn ($value) => trim($value))
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

        if (! empty($include)) {
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
                'message' => 'Nao e possivel marcar como nao executada uma OS ja encerrada.',
            ], 422);
        }

        $os->status = 'nao_executada';
        $os->motivo_nao_execucao = $data['motivo_nao_execucao'];
        $os->data_encerramento = now();
        $os->save();

        return response()->json([
            'message' => 'OS marcada como nao executada com sucesso.',
            'os' => $os,
        ]);
    }

    public function aceitar(Request $request, string $id)
    {
        $user = $request->user();

        if ($user->role !== 'tecnico') {
            return response()->json(['message' => 'Apenas tecnicos podem aceitar OS.'], 403);
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
                    'message' => 'Essa OS ja esta atribuida a voce.',
                    'data' => $os,
                ]);
            }

            return response()->json([
                'message' => 'Essa OS ja foi aceita por outro tecnico.',
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

    private function validateListFilters(Request $request): array
    {
        return $request->validate([
            'status' => 'nullable|in:aberta,em_execucao,finalizada,nao_executada,cancelada',
            'prioridade' => 'nullable|integer|in:1,2,3',
            'tipo' => 'nullable|string|max:255',
            'q' => 'nullable|string|max:255',
            'sort' => 'nullable|in:data_abertura,prioridade,status,numero,tipo,nome_cliente',
            'dir' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
            'include' => 'nullable|string',
            'tecnico_id' => 'nullable|uuid',
            'sem_responsavel' => 'nullable|boolean',
        ]);
    }

    private function applyListFilters(Builder $query, array $data): void
    {
        $likeOperator = $this->caseInsensitiveLikeOperator($query);

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['prioridade'])) {
            $query->where('prioridade', (int) $data['prioridade']);
        }

        if (! empty($data['tecnico_id'])) {
            $query->where('tecnico_responsavel_id', $data['tecnico_id']);
        }

        if (array_key_exists('sem_responsavel', $data) && filter_var($data['sem_responsavel'], FILTER_VALIDATE_BOOL)) {
            $query->whereNull('tecnico_responsavel_id');
        }

        if (! empty($data['tipo'])) {
            $query->where('tipo', $data['tipo']);
        }

        if (! empty($data['q'])) {
            $q = trim($data['q']);
            $pattern = $this->containsPattern($q);

            $query->where(function (Builder $where) use ($likeOperator, $pattern) {
                $where->where('numero', $likeOperator, $pattern)
                    ->orWhere('tipo', $likeOperator, $pattern)
                    ->orWhere('descricao', $likeOperator, $pattern)
                    ->orWhere('nome_cliente', $likeOperator, $pattern)
                    ->orWhereHas('tecnicoResponsavel', function (Builder $tecnicoQuery) use ($pattern) {
                        $tecnicoLikeOperator = $this->caseInsensitiveLikeOperator($tecnicoQuery);

                        $tecnicoQuery->where('name', $tecnicoLikeOperator, $pattern);
                    });
            });
        }
    }
}
