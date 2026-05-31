<?php

namespace App\Services\Relatorios;

use App\Models\OrdemServico;

class OperationalContextFormatter
{
    public function extractOperationalDetails(OrdemServico $ordem): array
    {
        $campos = $this->extractStructuredContext($ordem->descricao);
        $contexto = $this->formatContextoOperacional(
            $ordem->motivo_nao_execucao,
            $ordem->descricao,
            $ordem->observacoes
        );

        $localPartes = array_filter([
            $campos['unidade'] ?? null,
            $campos['local'] ?? null,
        ]);

        if ($localPartes === []) {
            $localPartes = array_filter([
                $ordem->endereco?->rua,
                $ordem->endereco?->numero,
                $ordem->endereco?->bairro,
            ]);
        }

        $origemPartes = array_filter([
            $campos['setor'] ?? null,
            $campos['encarregado'] ?? null,
        ]);

        if ($origemPartes === []) {
            $origemPartes = array_filter([$ordem->nome_cliente]);
        }

        $servico = $campos['servico'] ?? $campos['tipo_manutencao'] ?? '';
        if ($servico === '') {
            $servico = $contexto !== '-' ? $contexto : $ordem->tipo;
        }

        $equipamento = $campos['equipamento'] ?? '';
        if ($equipamento === '') {
            $equipamento = $campos['diagnostico'] ?? '-';
        }

        return [
            'local' => $localPartes !== [] ? implode(' / ', $localPartes) : '-',
            'origem' => $origemPartes !== [] ? implode(' / ', $origemPartes) : 'Não informado',
            'servico' => $this->limitContext($this->sanitizeContextText($servico), 80),
            'equipamento' => $this->limitContext($this->sanitizeContextText($equipamento), 70),
            'contexto' => $contexto,
        ];
    }

    public function formatContextoOperacional(
        ?string $motivoNaoExecucao,
        ?string $descricao,
        ?string $observacoes = null
    ): string {
        $motivo = $this->sanitizeContextText($motivoNaoExecucao);

        if ($motivo !== '') {
            return $this->limitContext("Não executada: {$motivo}");
        }

        $campos = $this->extractStructuredContext($descricao);
        $resumoEstruturado = $this->buildStructuredContextSummary($campos);

        if ($resumoEstruturado !== '') {
            return $this->limitContext($resumoEstruturado);
        }

        $texto = $this->sanitizeContextText($observacoes ?: $descricao ?: '');

        if ($texto === '') {
            return '-';
        }

        if (str_contains(mb_strtolower($texto), 'seeder')) {
            return 'Registro inicial de demonstracao.';
        }

        return $this->limitContext($texto);
    }

    public function extractStructuredContext(?string $descricao): array
    {
        $texto = trim((string) $descricao);

        if ($texto === '') {
            return [];
        }

        $campos = [];

        foreach (preg_split("/\r\n|\n|\r/", $texto) ?: [] as $linha) {
            $linha = trim($linha);

            if ($linha === '' || ! str_contains($linha, ':')) {
                continue;
            }

            [$chave, $valor] = array_pad(explode(':', $linha, 2), 2, '');
            $chaveNormalizada = $this->normalizeContextKey($chave);
            $valor = $this->sanitizeContextText($valor);

            if ($chaveNormalizada === '' || $valor === '') {
                continue;
            }

            $campos[$chaveNormalizada] = $valor;
        }

        return $campos;
    }

    private function buildStructuredContextSummary(array $campos): string
    {
        if ($campos === []) {
            return '';
        }

        $partes = [];
        $unidade = $campos['unidade'] ?? '';
        $local = $campos['local'] ?? '';
        $tipoManutencao = $campos['tipo_manutencao'] ?? '';
        $servico = $campos['servico'] ?? '';
        $equipamento = $campos['equipamento'] ?? '';
        $diagnostico = $campos['diagnostico'] ?? '';

        if ($unidade !== '' || $local !== '') {
            $partes[] = trim(implode(' / ', array_filter([$unidade, $local])));
        }

        if ($tipoManutencao !== '') {
            $partes[] = ucfirst(mb_strtolower($tipoManutencao));
        }

        if ($servico !== '') {
            $partes[] = 'Serviço: ' . $servico;
        }

        if ($equipamento !== '') {
            $partes[] = 'Equip.: ' . $equipamento;
        }

        if ($diagnostico !== '') {
            $partes[] = 'Diag.: ' . $diagnostico;
        }

        if ($partes === []) {
            foreach (['setor', 'encarregado', 'procedimento', 'material', 'material_utilizado'] as $campo) {
                if (! empty($campos[$campo])) {
                    $partes[] = ucfirst(str_replace('_', ' ', $campo)) . ': ' . $campos[$campo];
                }

                if (count($partes) >= 2) {
                    break;
                }
            }
        }

        return implode(' • ', $partes);
    }

    private function normalizeContextKey(string $chave): string
    {
        $normalizada = mb_strtolower(trim($chave));
        $normalizada = str_replace(
            ['ã', 'á', 'à', 'â', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç'],
            ['a', 'a', 'a', 'a', 'e', 'e', 'i', 'o', 'o', 'o', 'u', 'c'],
            $normalizada
        );
        $normalizada = preg_replace('/[^a-z0-9]+/u', '_', $normalizada) ?? $normalizada;

        return trim($normalizada, '_');
    }

    private function sanitizeContextText(?string $texto): string
    {
        $texto = trim((string) $texto);
        $texto = preg_replace('/\s+/u', ' ', $texto) ?? $texto;

        return trim($texto, " \t\n\r\0\x0B,;.-");
    }

    private function limitContext(string $texto, int $limite = 110): string
    {
        if (mb_strlen($texto) <= $limite) {
            return $texto;
        }

        return rtrim(mb_substr($texto, 0, $limite - 3)) . '...';
    }
}
