<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const OPEN_EXECUTION_INDEX = 'execucoes_os_aberta_unique';

    private const AVAILABLE_ORDERS_INDEX = 'ordem_servicos_disponiveis_data_abertura_index';

    public function up(): void
    {
        $this->ensureExistingDataIsValid();

        if (DB::getDriverName() === 'pgsql') {
            $this->addPostgresConstraints();
        } elseif (DB::getDriverName() === 'sqlite') {
            $this->addSqliteIntegrityTriggers();
        }

        DB::statement(
            'CREATE UNIQUE INDEX '.self::OPEN_EXECUTION_INDEX
            .' ON execucoes (os_id) WHERE data_fim IS NULL'
        );

        DB::statement(
            'CREATE INDEX '.self::AVAILABLE_ORDERS_INDEX
            ." ON ordem_servicos (data_abertura DESC)
               WHERE status = 'aberta' AND tecnico_responsavel_id IS NULL"
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS '.self::AVAILABLE_ORDERS_INDEX);
        DB::statement('DROP INDEX IF EXISTS '.self::OPEN_EXECUTION_INDEX);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE execucao_funcionarios
                 DROP CONSTRAINT IF EXISTS execucao_funcionarios_participante_check'
            );
            DB::statement(
                'ALTER TABLE execucao_funcionarios
                 DROP CONSTRAINT IF EXISTS execucao_funcionarios_periodo_check'
            );
            DB::statement(
                'ALTER TABLE execucoes
                 DROP CONSTRAINT IF EXISTS execucoes_periodo_check'
            );
            DB::statement(
                'ALTER TABLE ordem_servicos
                 DROP CONSTRAINT IF EXISTS ordem_servicos_prioridade_check'
            );
        } elseif (DB::getDriverName() === 'sqlite') {
            foreach ($this->sqliteTriggerNames() as $trigger) {
                DB::statement("DROP TRIGGER IF EXISTS {$trigger}");
            }
        }
    }

    private function ensureExistingDataIsValid(): void
    {
        $hasDuplicateOpenExecutions = DB::table('execucoes')
            ->select('os_id')
            ->whereNull('data_fim')
            ->groupBy('os_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicateOpenExecutions) {
            throw new RuntimeException(
                'Existem OS com mais de uma execucao aberta. Corrija os dados antes de migrar.'
            );
        }

        if (DB::table('ordem_servicos')->whereNotBetween('prioridade', [1, 3])->exists()) {
            throw new RuntimeException(
                'Existem ordens de servico com prioridade fora do intervalo de 1 a 3.'
            );
        }

        if (DB::table('execucoes')
            ->whereNotNull('data_fim')
            ->whereColumn('data_fim', '<', 'data_inicio')
            ->exists()) {
            throw new RuntimeException(
                'Existem execucoes com data final anterior a data inicial.'
            );
        }

        if (DB::table('execucao_funcionarios')
            ->whereColumn('data_fim', '<', 'data_inicio')
            ->exists()) {
            throw new RuntimeException(
                'Existem participantes com data final anterior a data inicial.'
            );
        }

        if (DB::table('execucao_funcionarios')
            ->whereRaw(
                '(funcionario_id IS NULL AND colaborador_operacional_id IS NULL)
                 OR (funcionario_id IS NOT NULL AND colaborador_operacional_id IS NOT NULL)'
            )
            ->exists()) {
            throw new RuntimeException(
                'Existem participantes com vinculo ausente ou duplicado.'
            );
        }
    }

    private function addPostgresConstraints(): void
    {
        DB::statement(
            'ALTER TABLE ordem_servicos
             ADD CONSTRAINT ordem_servicos_prioridade_check
             CHECK (prioridade BETWEEN 1 AND 3) NOT VALID'
        );
        DB::statement(
            'ALTER TABLE execucoes
             ADD CONSTRAINT execucoes_periodo_check
             CHECK (data_fim IS NULL OR data_fim >= data_inicio) NOT VALID'
        );
        DB::statement(
            'ALTER TABLE execucao_funcionarios
             ADD CONSTRAINT execucao_funcionarios_periodo_check
             CHECK (data_fim >= data_inicio) NOT VALID'
        );
        DB::statement(
            'ALTER TABLE execucao_funcionarios
             ADD CONSTRAINT execucao_funcionarios_participante_check
             CHECK ((funcionario_id IS NULL) <> (colaborador_operacional_id IS NULL))
             NOT VALID'
        );

        DB::statement(
            'ALTER TABLE ordem_servicos
             VALIDATE CONSTRAINT ordem_servicos_prioridade_check'
        );
        DB::statement(
            'ALTER TABLE execucoes
             VALIDATE CONSTRAINT execucoes_periodo_check'
        );
        DB::statement(
            'ALTER TABLE execucao_funcionarios
             VALIDATE CONSTRAINT execucao_funcionarios_periodo_check'
        );
        DB::statement(
            'ALTER TABLE execucao_funcionarios
             VALIDATE CONSTRAINT execucao_funcionarios_participante_check'
        );
    }

    private function addSqliteIntegrityTriggers(): void
    {
        DB::statement(
            "CREATE TRIGGER ordem_servicos_prioridade_insert_check
             BEFORE INSERT ON ordem_servicos
             FOR EACH ROW
             WHEN NEW.prioridade NOT BETWEEN 1 AND 3
             BEGIN
                 SELECT RAISE(ABORT, 'prioridade deve estar entre 1 e 3');
             END"
        );
        DB::statement(
            "CREATE TRIGGER ordem_servicos_prioridade_update_check
             BEFORE UPDATE OF prioridade ON ordem_servicos
             FOR EACH ROW
             WHEN NEW.prioridade NOT BETWEEN 1 AND 3
             BEGIN
                 SELECT RAISE(ABORT, 'prioridade deve estar entre 1 e 3');
             END"
        );
        DB::statement(
            "CREATE TRIGGER execucoes_periodo_insert_check
             BEFORE INSERT ON execucoes
             FOR EACH ROW
             WHEN NEW.data_fim IS NOT NULL AND NEW.data_fim < NEW.data_inicio
             BEGIN
                 SELECT RAISE(ABORT, 'data final da execucao anterior a data inicial');
             END"
        );
        DB::statement(
            "CREATE TRIGGER execucoes_periodo_update_check
             BEFORE UPDATE OF data_inicio, data_fim ON execucoes
             FOR EACH ROW
             WHEN NEW.data_fim IS NOT NULL AND NEW.data_fim < NEW.data_inicio
             BEGIN
                 SELECT RAISE(ABORT, 'data final da execucao anterior a data inicial');
             END"
        );
        DB::statement(
            "CREATE TRIGGER execucao_funcionarios_integridade_insert_check
             BEFORE INSERT ON execucao_funcionarios
             FOR EACH ROW
             WHEN NEW.data_fim < NEW.data_inicio
                OR ((NEW.funcionario_id IS NULL) = (NEW.colaborador_operacional_id IS NULL))
             BEGIN
                 SELECT RAISE(ABORT, 'periodo ou vinculo de participante invalido');
             END"
        );
        DB::statement(
            "CREATE TRIGGER execucao_funcionarios_integridade_update_check
             BEFORE UPDATE OF data_inicio, data_fim, funcionario_id, colaborador_operacional_id
             ON execucao_funcionarios
             FOR EACH ROW
             WHEN NEW.data_fim < NEW.data_inicio
                OR ((NEW.funcionario_id IS NULL) = (NEW.colaborador_operacional_id IS NULL))
             BEGIN
                 SELECT RAISE(ABORT, 'periodo ou vinculo de participante invalido');
             END"
        );
    }

    /**
     * @return array<int, string>
     */
    private function sqliteTriggerNames(): array
    {
        return [
            'ordem_servicos_prioridade_insert_check',
            'ordem_servicos_prioridade_update_check',
            'execucoes_periodo_insert_check',
            'execucoes_periodo_update_check',
            'execucao_funcionarios_integridade_insert_check',
            'execucao_funcionarios_integridade_update_check',
        ];
    }
};
