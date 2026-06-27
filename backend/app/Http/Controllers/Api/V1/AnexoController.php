<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\EnsuresTecnicoResponsavel;
use App\Http\Controllers\Controller;
use App\Models\Anexo;
use App\Models\OrdemServico;
use App\Services\Auditoria\OrdemServicoAuditService;
use App\Services\Storage\AnexoStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class AnexoController extends Controller
{
    use EnsuresTecnicoResponsavel;

    private const ESTADOS_BRASILEIROS = [
        'acre' => 'AC',
        'alagoas' => 'AL',
        'amapa' => 'AP',
        'amazonas' => 'AM',
        'bahia' => 'BA',
        'ceara' => 'CE',
        'distrito federal' => 'DF',
        'espirito santo' => 'ES',
        'goias' => 'GO',
        'maranhao' => 'MA',
        'mato grosso' => 'MT',
        'mato grosso do sul' => 'MS',
        'minas gerais' => 'MG',
        'para' => 'PA',
        'paraiba' => 'PB',
        'parana' => 'PR',
        'pernambuco' => 'PE',
        'piaui' => 'PI',
        'rio de janeiro' => 'RJ',
        'rio grande do norte' => 'RN',
        'rio grande do sul' => 'RS',
        'rondonia' => 'RO',
        'roraima' => 'RR',
        'santa catarina' => 'SC',
        'sao paulo' => 'SP',
        'sergipe' => 'SE',
        'tocantins' => 'TO',
    ];

    public function __construct(
        private readonly AnexoStorageService $anexoStorage,
        private readonly OrdemServicoAuditService $auditService
    ) {}

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'arquivo' => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,csv,txt|max:5120',
            'tipo' => 'nullable|string|max:50',
            'latitude' => 'nullable|required_with:longitude|numeric|between:-90,90',
            'longitude' => 'nullable|required_with:latitude|numeric|between:-180,180',
            'precisao_metros' => 'nullable|numeric|min:0',
            'geolocalizacao_capturada_em' => 'nullable|date',
            'rua_capturada' => 'nullable|string|max:255',
            'bairro_capturado' => 'nullable|string|max:255',
            'cidade_capturada' => 'nullable|string|max:255',
            'estado_capturado' => 'nullable|string|max:120',
            'endereco_capturado' => 'nullable|string|max:1000',
            'client_operation_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $os = OrdemServico::query()->findOrFail($id);

        if ($response = $this->ensureTecnicoResponsavel($user, $os)) {
            return $response;
        }

        $clientOperationId = $data['client_operation_id'] ?? null;

        if ($clientOperationId) {
            $anexoExistente = Anexo::query()
                ->where('client_operation_id', $clientOperationId)
                ->where('os_id', $os->id)
                ->where('submetido_por_id', $user->id)
                ->first();

            if ($anexoExistente) {
                return response()->json([
                    'message' => 'Anexo ja sincronizado anteriormente.',
                    'anexo' => $this->buildAnexoPayload($anexoExistente),
                    'endereco_os' => $os->endereco()->first(),
                ]);
            }
        }

        $arquivo = $request->file('arquivo');
        $caminho = $this->anexoStorage->store($arquivo, 'anexos');

        $tipo = $data['tipo'] ?? null;

        if (! $tipo) {
            $mime = $arquivo->getMimeType();

            if (str_starts_with($mime, 'image/')) {
                $tipo = 'foto';
            } elseif ($mime === 'application/pdf') {
                $tipo = 'pdf';
            } else {
                $tipo = 'arquivo';
            }
        }

        $anexo = DB::transaction(function () use ($caminho, $clientOperationId, $data, $os, $tipo, $user) {
            $anexo = Anexo::create([
                'os_id' => $os->id,
                'caminho' => $caminho,
                'tipo' => $tipo,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'precisao_metros' => $data['precisao_metros'] ?? null,
                'geolocalizacao_capturada_em' => $data['geolocalizacao_capturada_em'] ?? null,
                'rua_capturada' => $data['rua_capturada'] ?? null,
                'bairro_capturado' => $data['bairro_capturado'] ?? null,
                'cidade_capturada' => $data['cidade_capturada'] ?? null,
                'estado_capturado' => $data['estado_capturado'] ?? null,
                'endereco_capturado' => $data['endereco_capturado'] ?? null,
                'submetido_por_id' => Auth::id(),
                'criado_em' => now(),
                'client_operation_id' => $clientOperationId,
            ]);

            $this->atualizarEnderecoDaOrdemServico($os, $data);

            $this->auditService->registrar(
                $os,
                $user,
                'anexo_enviado',
                'Evidência adicionada à ordem de serviço.',
                null,
                [
                    'anexo_id' => $anexo->id,
                    'tipo' => $anexo->tipo,
                    'possui_geolocalizacao' => $anexo->latitude !== null && $anexo->longitude !== null,
                ],
                $clientOperationId
            );

            if (isset($data['latitude'], $data['longitude'])) {
                $this->auditService->registrar(
                    $os,
                    $user,
                    'localizacao_atualizada',
                    'Endereço da OS atualizado pela geolocalização da evidência.',
                    null,
                    [
                        'latitude' => $data['latitude'],
                        'longitude' => $data['longitude'],
                        'rua' => $data['rua_capturada'] ?? null,
                        'bairro' => $data['bairro_capturado'] ?? null,
                        'cidade' => $data['cidade_capturada'] ?? null,
                        'estado' => $data['estado_capturado'] ?? null,
                    ]
                );
            }

            return $anexo;
        });

        $this->logAnexoAccess('anexo_upload', $user, $anexo, $os);

        return response()->json([
            'message' => 'Anexo enviado com sucesso.',
            'anexo' => $this->buildAnexoPayload($anexo),
            'endereco_os' => $os->endereco()->first(),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $anexo = Anexo::query()
            ->with(['ordemServico:id,status,tecnico_responsavel_id'])
            ->findOrFail($id);
        $ordemServico = $anexo->ordemServico;

        if (! $ordemServico) {
            abort(404);
        }

        if (! in_array($user->role, ['atendente', 'tecnico', 'administrador'], true)) {
            $this->logAnexoAccess('anexo_access_denied', $user, $anexo, $ordemServico, [
                'motivo' => 'perfil_nao_autorizado',
            ]);

            return response()->json([
                'message' => 'Acesso negado ao anexo solicitado.',
            ], 403);
        }

        if ($user->role === 'tecnico') {
            $osDisponivel = $ordemServico->status === 'aberta' && ! $ordemServico->tecnico_responsavel_id;
            $tecnicoResponsavel = $ordemServico->tecnico_responsavel_id === $user->id;

            if (! $osDisponivel && ! $tecnicoResponsavel) {
                $this->logAnexoAccess('anexo_access_denied', $user, $anexo, $ordemServico, [
                    'motivo' => 'tecnico_sem_permissao_na_os',
                ]);

                return response()->json([
                    'message' => 'Acesso negado ao anexo solicitado.',
                ], 403);
            }
        }

        $disk = $this->anexoStorage->resolveDisk($anexo->caminho);

        if (! $disk) {
            abort(404);
        }

        $this->logAnexoAccess('anexo_access_granted', $user, $anexo, $ordemServico, [
            'storage_disk' => $disk,
        ]);

        $fileName = basename((string) $anexo->caminho);
        $mimeType = $this->anexoStorage->mimeType($anexo->caminho, $disk) ?: 'application/octet-stream';
        $disposition = str_starts_with($mimeType, 'image/') || $mimeType === 'application/pdf'
            ? ResponseHeaderBag::DISPOSITION_INLINE
            : ResponseHeaderBag::DISPOSITION_ATTACHMENT;
        $headers = new ResponseHeaderBag;
        $contentDisposition = $headers->makeDisposition($disposition, $fileName);

        return $this->anexoStorage->streamResponse(
            (string) $anexo->caminho,
            $mimeType,
            $fileName,
            $contentDisposition
        );
    }

    private function buildAnexoPayload(Anexo $anexo): array
    {
        return [
            'id' => $anexo->id,
            'nome_arquivo' => basename((string) $anexo->caminho),
            'tipo' => $anexo->tipo,
            'latitude' => $anexo->latitude,
            'longitude' => $anexo->longitude,
            'precisao_metros' => $anexo->precisao_metros,
            'geolocalizacao_capturada_em' => optional($anexo->geolocalizacao_capturada_em)->toISOString(),
            'rua_capturada' => $anexo->rua_capturada,
            'bairro_capturado' => $anexo->bairro_capturado,
            'cidade_capturada' => $anexo->cidade_capturada,
            'estado_capturado' => $anexo->estado_capturado,
            'endereco_capturado' => $anexo->endereco_capturado,
        ];
    }

    private function atualizarEnderecoDaOrdemServico(OrdemServico $ordemServico, array $data): void
    {
        if (! isset($data['latitude'], $data['longitude'])) {
            return;
        }

        $endereco = $ordemServico->endereco()->lockForUpdate()->first();

        if (! $endereco) {
            return;
        }

        $atualizacoes = [
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
        ];

        foreach ([
            'rua_capturada' => ['campo' => 'rua', 'limite' => 200],
            'bairro_capturado' => ['campo' => 'bairro', 'limite' => 120],
            'cidade_capturada' => ['campo' => 'cidade', 'limite' => 120],
        ] as $origem => $destino) {
            $valor = trim((string) ($data[$origem] ?? ''));

            if ($valor !== '') {
                $atualizacoes[$destino['campo']] = Str::limit($valor, $destino['limite'], '');
            }
        }

        $estado = $this->normalizarEstadoBrasileiro($data['estado_capturado'] ?? null);

        if ($estado !== null) {
            $atualizacoes['estado'] = $estado;
        }

        $endereco->update($atualizacoes);
    }

    private function normalizarEstadoBrasileiro(mixed $estado): ?string
    {
        $valor = trim((string) $estado);

        if ($valor === '') {
            return null;
        }

        $sigla = strtoupper($valor);

        if (in_array($sigla, self::ESTADOS_BRASILEIROS, true)) {
            return $sigla;
        }

        $nomeNormalizado = (string) Str::of($valor)
            ->ascii()
            ->lower()
            ->squish();

        return self::ESTADOS_BRASILEIROS[$nomeNormalizado] ?? null;
    }

    private function logAnexoAccess(
        string $event,
        mixed $user,
        Anexo $anexo,
        OrdemServico $ordemServico,
        array $context = []
    ): void {
        Log::info($event, array_merge([
            'user_id' => $user?->id,
            'user_role' => $user?->role,
            'anexo_id' => $anexo->id,
            'os_id' => $ordemServico->id,
            'os_status' => $ordemServico->status,
            'tecnico_responsavel_id' => $ordemServico->tecnico_responsavel_id,
        ], $context));
    }
}
