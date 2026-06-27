<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Endereco;
use App\Models\OrdemServico;
use App\Models\User;
use App\Services\Auditoria\OrdemServicoAuditService;
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

    public function __construct(
        private readonly OrdemServicoAuditService $auditService
    ) {}

    public function store(Request $request)
    {
        $user = $request->user();
        $tipoServicoNormalizado = $this->normalizeTipoServico($request->input('tipo_servico'));

        if (
            $user->role === 'tecnico' &&
            $tipoServicoNormalizado !== 'manutencao eta/ete'
        ) {
            return response()->json([
                'message' => 'Técnico só pode abrir OS do tipo Manutenção ETA/ETE.',
            ], 403);
        }

        $regrasEndereco = [
            'endereco.logradouro' => 'required|string|max:255',
            'endereco.numero' => 'required|string|max:50',
            'endereco.complemento' => 'nullable|string|max:255',
            'endereco.bairro' => 'required|string|max:255',
            'endereco.cidade' => 'required|string|max:255',
            'endereco.estado' => 'required|string|size:2',
            'endereco.cep' => 'required|string|max:9',
        ];

        if ($user->role === 'tecnico' && $tipoServicoNormalizado === 'manutencao eta/ete') {
            $regrasEndereco['endereco.bairro'] = 'nullable|string|max:255';
            $regrasEndereco['endereco.cidade'] = 'nullable|string|max:255';
            $regrasEndereco['endereco.estado'] = 'nullable|string|max:2';
            $regrasEndereco['endereco.cep'] = 'nullable|string|max:9';
        }

        $data = $request->validate([
            'tipo_servico' => 'required|string|max:100',
            'nome_cliente' => 'required|string|max:255',
            'prioridade' => 'required|integer|in:1,2,3',
            'descricao' => 'required|string',
            'data_abertura' => 'nullable|date',
        ] + $regrasEndereco);

        $os = null;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                $os = DB::transaction(function () use ($data, $user) {
                    $endereco = Endereco::create([
                        'rua' => $data['endereco']['logradouro'],
                        'numero' => $data['endereco']['numero'] ?: 'SN',
                        'complemento' => $data['endereco']['complemento'] ?? null,
                        'bairro' => trim((string) ($data['endereco']['bairro'] ?? '')),
                        'cidade' => trim((string) ($data['endereco']['cidade'] ?? '')),
                        'estado' => strtoupper(trim((string) ($data['endereco']['estado'] ?? ''))),
                        'cep' => preg_replace('/\D/', '', (string) ($data['endereco']['cep'] ?? '')),
                    ]);

                    $ano = now()->year;
                    $numero = $this->generateOrderNumber($ano);

                    $ordemServico = OrdemServico::create([
                        'numero' => $numero,
                        'tipo' => $data['tipo_servico'],
                        'nome_cliente' => $data['nome_cliente'],
                        'descricao' => $data['descricao'],
                        'prioridade' => $data['prioridade'],
                        'data_abertura' => $data['data_abertura'] ?? now(),
                        'endereco_id' => $endereco->id,
                        'criada_por_id' => $user->id,
                        'tecnico_responsavel_id' => $user->role === 'tecnico' ? $user->id : null,
                    ]);

                    $this->auditService->registrar(
                        $ordemServico,
                        $user,
                        'os_criada',
                        'Ordem de serviço criada.',
                        null,
                        [
                            'status' => $ordemServico->status,
                            'prioridade' => $ordemServico->prioridade,
                            'tecnico_responsavel_id' => $ordemServico->tecnico_responsavel_id,
                        ]
                    );

                    return $ordemServico;
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
        $user = $request->user();

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
        $includeLoaders = $this->buildDetailIncludes($include);

        if (! empty($includeLoaders)) {
            $query->with($includeLoaders);
        }

        $this->applyListFilters($query, $data);
        $this->applyVisibilityScope($query, $user);

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
        $this->applyVisibilityScope($query, $request->user());

        $statusResumo = $query
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'aberta' THEN 1 ELSE 0 END) as abertas")
            ->selectRaw("SUM(CASE WHEN status = 'em_execucao' THEN 1 ELSE 0 END) as em_execucao")
            ->selectRaw("SUM(CASE WHEN status = 'finalizada' THEN 1 ELSE 0 END) as finalizadas")
            ->selectRaw("SUM(CASE WHEN status = 'nao_executada' THEN 1 ELSE 0 END) as nao_executadas")
            ->selectRaw("SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas")
            ->first();

        $finalizadas = (int) ($statusResumo->finalizadas ?? 0);
        $naoExecutadas = (int) ($statusResumo->nao_executadas ?? 0);
        $canceladas = (int) ($statusResumo->canceladas ?? 0);

        return response()->json([
            'total' => (int) ($statusResumo->total ?? 0),
            'abertas' => (int) ($statusResumo->abertas ?? 0),
            'em_execucao' => (int) ($statusResumo->em_execucao ?? 0),
            'finalizadas' => $finalizadas,
            'nao_executadas' => $naoExecutadas,
            'canceladas' => $canceladas,
            'encerradas' => $finalizadas + $naoExecutadas + $canceladas,
        ]);
    }

    public function filterOptions(Request $request)
    {
        $query = OrdemServico::query();
        $this->applyVisibilityScope($query, $request->user());

        return response()->json([
            'tipos' => $query
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
        $user = $request->user();

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
            'eventos',
        ];
        $include = array_values(array_intersect($include, $allowedIncludes));

        if (in_array('eventos', $include, true)) {
            $include[] = 'eventos.usuario';
        }

        $query = OrdemServico::query();

        if (! empty($include)) {
            $query->with($include);
        }

        $os = $query->where('id', $id)->firstOrFail();

        if (! $this->canViewOrdemServico($user, $os)) {
            return response()->json([
                'message' => 'Acesso negado a esta ordem de serviço.',
            ], 403);
        }

        return response()->json($os);
    }

    public function marcarNaoExecutada(Request $request, string $id)
    {
        $data = $request->validate([
            'motivo_nao_execucao' => 'required|string|max:1000',
            'client_operation_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        if (
            ! empty($data['client_operation_id'])
            && $os->encerramento_client_operation_id === $data['client_operation_id']
            && $os->status === 'nao_executada'
        ) {
            return response()->json([
                'message' => 'OS ja sincronizada anteriormente.',
                'os' => $os,
            ]);
        }

        if (in_array($os->status, ['finalizada', 'cancelada', 'nao_executada'], true)) {
            return response()->json([
                'message' => 'Não é possível marcar como não executada uma OS já encerrada.',
            ], 422);
        }

        DB::transaction(function () use ($data, $os, $user) {
            $statusAnterior = $os->status;
            $os->status = 'nao_executada';
            $os->motivo_nao_execucao = $data['motivo_nao_execucao'];
            $os->data_encerramento = now();
            $os->encerramento_client_operation_id =
                $data['client_operation_id'] ?? null;
            $os->save();

            $this->auditService->registrar(
                $os,
                $user,
                'os_nao_executada',
                $data['motivo_nao_execucao'],
                ['status' => $statusAnterior],
                ['status' => $os->status],
                $data['client_operation_id'] ?? null
            );
        });

        return response()->json([
            'message' => 'OS marcada como não executada com sucesso.',
            'os' => $os,
        ]);
    }

    public function aceitar(Request $request, string $id)
    {
        $data = $request->validate([
            'client_operation_id' => 'nullable|uuid',
        ]);
        $user = $request->user();

        if ($user->role !== 'tecnico') {
            return response()->json(['message' => 'Apenas técnicos podem aceitar OS.'], 403);
        }

        $os = OrdemServico::query()->findOrFail($id);

        if (
            ! empty($data['client_operation_id'])
            && $os->aceite_client_operation_id === $data['client_operation_id']
            && $os->tecnico_responsavel_id === $user->id
        ) {
            return response()->json([
                'message' => 'OS ja sincronizada anteriormente.',
                'data' => $os->loadMissing('tecnicoResponsavel'),
            ]);
        }

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

        $aceita = DB::transaction(function () use ($data, $id, $user) {
            $updated = OrdemServico::query()
                ->whereKey($id)
                ->where('status', 'aberta')
                ->whereNull('tecnico_responsavel_id')
                ->update([
                    'tecnico_responsavel_id' => $user->id,
                    'aceite_client_operation_id' => $data['client_operation_id'] ?? null,
                    'updated_at' => now(),
                ]);

            if ($updated !== 1) {
                return false;
            }

            $ordemServico = OrdemServico::query()->findOrFail($id);
            $this->auditService->registrar(
                $ordemServico,
                $user,
                'os_aceita',
                'OS aceita pelo técnico responsável.',
                ['tecnico_responsavel_id' => null],
                ['tecnico_responsavel_id' => $user->id],
                $data['client_operation_id'] ?? null
            );

            return true;
        });

        if (! $aceita) {
            $os = OrdemServico::query()->findOrFail($id);

            if ($os->tecnico_responsavel_id === $user->id) {
                return response()->json([
                    'message' => 'Essa OS já está atribuída a você.',
                    'data' => $os->loadMissing('tecnicoResponsavel'),
                ]);
            }

            return response()->json([
                'message' => 'Essa OS já foi aceita por outro técnico.',
            ], 409);
        }

        return response()->json([
            'message' => 'OS aceita com sucesso.',
            'data' => OrdemServico::query()
                ->with('tecnicoResponsavel')
                ->findOrFail($id),
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

    private function buildDetailIncludes(array $include): array
    {
        $loaders = [];

        if (in_array('endereco', $include, true)) {
            $loaders['endereco'] = fn ($query) => $query->select([
                'id',
                'rua',
                'numero',
                'complemento',
                'bairro',
                'cidade',
                'estado',
                'cep',
                'latitude',
                'longitude',
            ]);
        }

        if (in_array('criadaPor', $include, true)) {
            $loaders['criadaPor'] = fn ($query) => $query->select([
                'id',
                'name',
                'email',
                'role',
            ]);
        }

        if (in_array('tecnicoResponsavel', $include, true)) {
            $loaders['tecnicoResponsavel'] = fn ($query) => $query->select([
                'id',
                'name',
                'email',
                'role',
            ]);
        }

        if (
            in_array('execucoes', $include, true) ||
            in_array('execucoes.tecnico', $include, true)
        ) {
            $loaders['execucoes'] = fn ($query) => $query->select([
                'id',
                'os_id',
                'tecnico_id',
                'data_inicio',
                'data_fim',
                'observacao',
                'diagnostico',
                'procedimento',
                'material_utilizado',
            ]);
        }

        if (in_array('execucoes.tecnico', $include, true)) {
            $loaders['execucoes.tecnico'] = fn ($query) => $query->select([
                'id',
                'name',
                'email',
                'role',
            ]);
        }

        if (in_array('anexos', $include, true)) {
            $loaders['anexos'] = fn ($query) => $query
                ->select([
                    'id',
                    'os_id',
                    'caminho',
                    'tipo',
                    'latitude',
                    'longitude',
                    'precisao_metros',
                    'geolocalizacao_capturada_em',
                    'rua_capturada',
                    'bairro_capturado',
                    'cidade_capturada',
                    'estado_capturado',
                    'endereco_capturado',
                    'criado_em',
                ])
                ->orderByDesc('criado_em');
        }

        if (in_array('eventos', $include, true)) {
            $loaders['eventos'] = fn ($query) => $query
                ->select([
                    'id',
                    'os_id',
                    'usuario_id',
                    'evento',
                    'descricao',
                    'dados_anteriores',
                    'dados_novos',
                    'created_at',
                ])
                ->orderByDesc('created_at');
            $loaders['eventos.usuario'] = fn ($query) => $query->select([
                'id',
                'name',
                'email',
                'role',
            ]);
        }

        return $loaders;
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

    private function applyVisibilityScope(Builder $query, User $user): void
    {
        if ($user->role !== 'tecnico') {
            return;
        }

        $query->where(function (Builder $builder) use ($user) {
            $builder
                ->where(function (Builder $openBuilder) {
                    $openBuilder
                        ->where('status', 'aberta')
                        ->whereNull('tecnico_responsavel_id');
                })
                ->orWhere('tecnico_responsavel_id', $user->id);
        });
    }

    private function canViewOrdemServico(User $user, OrdemServico $ordemServico): bool
    {
        if ($user->role !== 'tecnico') {
            return true;
        }

        return (
            $ordemServico->status === 'aberta'
            && ! $ordemServico->tecnico_responsavel_id
        ) || $ordemServico->tecnico_responsavel_id === $user->id;
    }
}
