import type { ReactNode } from "react";
import {
  ClipboardList,
  FileText,
  History,
  MapPin,
  Paperclip,
  UserCircle2,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  formatarDataHora,
} from "../ordemServicoDetalhe.utils";
import {
  getCriadaPor,
  getTecnicoResponsavel,
  type Endereco,
  type Execucao,
  type ExecucaoFuncionario,
  type OrdemServicoDetalhe,
  type Usuario,
} from "../ordensServico.service";
import { AnexoItemCard } from "./AnexoItemCard";
import { PrioridadeBadge } from "./PrioridadeBadge";
import { StatusBadge } from "./StatusBadge";

type RegistroHistoricoOS = {
  id?: string;
  titulo?: string;
  acao?: string;
  mensagem?: string | null;
  descricao?: string | null;
  data?: string | null;
  created_at?: string | null;
  usuario?: Usuario | string | null;
};

type OrdemServicoComHistorico = OrdemServicoDetalhe & {
  historico?: RegistroHistoricoOS[];
  logs?: RegistroHistoricoOS[];
};

type OSAccordionProps = {
  ordemServico: OrdemServicoComHistorico;
  className?: string;
  variant?: "page" | "modal";
  abrirInicialmente?: string[];
};

export function OSAccordion({
  ordemServico,
  className,
  variant = "page",
  abrirInicialmente = ["dados"],
}: OSAccordionProps) {
  const tecnicoResponsavel = getTecnicoResponsavel(ordemServico);
  const criadaPor = getCriadaPor(ordemServico);
  const anexos = ordemServico.anexos ?? [];
  const execucoes = ordemServico.execucoes ?? [];
  const registrosHistorico =
    ordemServico.eventos ?? ordemServico.historico ?? ordemServico.logs ?? [];
  const enderecoFormatado = formatarEndereco(ordemServico.endereco);
  const solicitante =
    criadaPor?.name || ordemServico.nome_cliente || "Solicitante nao informado";
  const temAnexos = anexos.length > 0;
  const temHistorico =
    registrosHistorico.length > 0 ||
    execucoes.length > 0 ||
    Boolean(ordemServico.motivo_nao_execucao);

  return (
    <section
      className={cn(
        "app-card overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]",
        variant === "modal" ? "shadow-none" : "shadow-[var(--shadow-card)]",
        className
      )}
      aria-label={`Detalhes em accordion da ordem de servico ${ordemServico.numero}`}
    >
      <div className="border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="app-muted text-xs font-semibold uppercase tracking-[0.16em]">
              Detalhes da OS
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)]">
              {ordemServico.numero}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ordemServico.status} />
            <PrioridadeBadge prioridade={ordemServico.prioridade} />
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={abrirInicialmente} className="px-4 sm:px-5">
        <AccordionItem value="dados">
          <AccordionTrigger>
            <TituloSecao
              icone={<ClipboardList className="h-4 w-4" />}
              titulo="Dados principais"
              descricao="Numero, status, prioridade e responsaveis"
            />
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoResumo rotulo="Numero da OS" valor={ordemServico.numero} />
              <CampoResumo
                rotulo="Status"
                valor={<StatusBadge status={ordemServico.status} />}
              />
              <CampoResumo
                rotulo="Prioridade"
                valor={<PrioridadeBadge prioridade={ordemServico.prioridade} />}
              />
              <CampoResumo rotulo="Tipo" valor={ordemServico.tipo} />
              <CampoResumo rotulo="Solicitante" valor={solicitante} />
              <CampoResumo
                rotulo="Tecnico responsavel"
                valor={tecnicoResponsavel?.name || "Nao atribuido"}
              />
              <CampoResumo
                rotulo="Data de abertura"
                valor={formatarDataHora(ordemServico.data_abertura)}
              />
              <CampoResumo
                rotulo="Endereco"
                valor={enderecoFormatado}
                className="sm:col-span-2"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="descricao">
          <AccordionTrigger>
            <TituloSecao
              icone={<FileText className="h-4 w-4" />}
              titulo="Descricao"
              descricao="Informacoes registradas na abertura"
            />
          </AccordionTrigger>
          <AccordionContent>
            <div className="app-card-soft rounded-xl px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-main)]">
                {normalizarTexto(ordemServico.descricao)}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {ordemServico.endereco ? (
          <AccordionItem value="endereco">
            <AccordionTrigger>
              <TituloSecao
                icone={<MapPin className="h-4 w-4" />}
                titulo="Endereco"
                descricao="Local da ordem de servico"
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoResumo rotulo="Logradouro" valor={ordemServico.endereco.rua} />
                <CampoResumo rotulo="Numero" valor={ordemServico.endereco.numero} />
                <CampoResumo rotulo="Complemento" valor={ordemServico.endereco.complemento} />
                <CampoResumo rotulo="Bairro" valor={ordemServico.endereco.bairro} />
                <CampoResumo rotulo="Cidade" valor={ordemServico.endereco.cidade} />
                <CampoResumo rotulo="Estado" valor={ordemServico.endereco.estado} />
                <CampoResumo rotulo="CEP" valor={ordemServico.endereco.cep} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {temAnexos ? (
          <AccordionItem value="anexos">
            <AccordionTrigger>
              <TituloSecao
                icone={<Paperclip className="h-4 w-4" />}
                titulo="Evidencias e anexos"
                descricao={`${anexos.length} arquivo${anexos.length === 1 ? "" : "s"} registrado${
                  anexos.length === 1 ? "" : "s"
                }`}
              />
            </AccordionTrigger>
            <AccordionContent>
              <ul className="grid gap-3 lg:grid-cols-2">
                {anexos.map((anexo) => (
                  <AnexoItemCard
                    key={anexo.id}
                    anexo={anexo}
                    variant={variant}
                    wrapper="li"
                  />
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        {temHistorico ? (
          <AccordionItem value="historico">
            <AccordionTrigger>
              <TituloSecao
                icone={<History className="h-4 w-4" />}
                titulo="Historico e logs"
                descricao="Eventos, execucoes e resolucoes registradas"
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {registrosHistorico.map((registro, indice) => (
                  <RegistroHistoricoItem
                    key={registro.id ?? `${registro.titulo ?? "registro"}-${indice}`}
                    registro={registro}
                  />
                ))}

                {execucoes.map((execucao) => (
                  <ExecucaoHistoricoItem key={execucao.id} execucao={execucao} />
                ))}

                {ordemServico.motivo_nao_execucao ? (
                  <div className="app-alert-warning rounded-xl px-4 py-3 text-sm">
                    <p className="font-semibold">Motivo de nao execucao</p>
                    <p className="mt-1">{ordemServico.motivo_nao_execucao}</p>
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : null}
      </Accordion>
    </section>
  );
}

function TituloSecao({
  icone,
  titulo,
  descricao,
}: {
  icone: ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <span className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-[var(--primary)]">
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--text-main)]">
          {titulo}
        </span>
        <span className="app-muted mt-1 block text-xs font-normal leading-5">
          {descricao}
        </span>
      </span>
    </span>
  );
}

function CampoResumo({
  rotulo,
  valor,
  className,
}: {
  rotulo: string;
  valor?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-card-soft rounded-xl px-4 py-3", className)}>
      <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
        {rotulo}
      </p>
      <div className="mt-2 text-sm font-medium text-[var(--text-main)]">
        {typeof valor === "string" || typeof valor === "number"
          ? normalizarTexto(String(valor))
          : valor || "-"}
      </div>
    </div>
  );
}

function RegistroHistoricoItem({ registro }: { registro: RegistroHistoricoOS }) {
  const nomeUsuario =
    typeof registro.usuario === "string" ? registro.usuario : registro.usuario?.name;

  return (
    <div className="app-card-soft rounded-xl px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-[var(--text-main)]">
            {registro.titulo || registro.acao || "Registro"}
          </p>
          <p className="app-muted mt-1 text-sm">
            {normalizarTexto(registro.mensagem || registro.descricao)}
          </p>
        </div>
        <p className="app-muted text-xs">
          {formatarDataHora(registro.data || registro.created_at)}
        </p>
      </div>
      {nomeUsuario ? (
        <p className="app-muted mt-2 inline-flex items-center gap-2 text-xs">
          <UserCircle2 className="h-3.5 w-3.5" />
          {nomeUsuario}
        </p>
      ) : null}
    </div>
  );
}

function ExecucaoHistoricoItem({ execucao }: { execucao: Execucao }) {
  const participantes = obterParticipantes(execucao);

  return (
    <div className="app-card-soft rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] text-[var(--primary)]">
          <Wrench className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoHistorico rotulo="Tecnico" valor={execucao.tecnico?.name} />
            <CampoHistorico rotulo="Inicio" valor={formatarDataHora(execucao.data_inicio)} />
            <CampoHistorico rotulo="Fim" valor={formatarDataHora(execucao.data_fim)} />
            <CampoHistorico
              rotulo="Observacao"
              valor={execucao.observacao || "Sem observacoes registradas."}
            />
            <CampoHistorico
              rotulo="Diagnostico"
              valor={execucao.diagnostico || "Nao informado."}
            />
            <CampoHistorico
              rotulo="Procedimento executado"
              valor={execucao.procedimento || "Nao informado."}
            />
            <CampoHistorico
              rotulo="Material utilizado"
              valor={execucao.material_utilizado || "Nenhum material informado."}
            />
          </div>

          {participantes.length > 0 ? (
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3">
              <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                Participantes
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--text-main)]">
                {participantes.map((participante) => (
                  <li key={participante.id}>{obterNomeParticipante(participante)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CampoHistorico({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor?: string | null;
}) {
  return (
    <div>
      <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
        {rotulo}
      </p>
      <p className="mt-1 text-sm text-[var(--text-main)]">{normalizarTexto(valor)}</p>
    </div>
  );
}

function obterParticipantes(execucao: Execucao) {
  return execucao.execucao_funcionarios ?? execucao.execucaoFuncionarios ?? [];
}

function obterNomeParticipante(participante: ExecucaoFuncionario) {
  return (
    participante.funcionario?.name ||
    participante.colaborador_operacional?.name ||
    "Participante sem nome"
  );
}

function formatarEndereco(endereco?: Endereco | null) {
  if (!endereco) {
    return "-";
  }

  const logradouro = [endereco.rua, endereco.numero].filter(Boolean).join(", ");
  const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(" - ");

  return [
    logradouro,
    endereco.complemento,
    endereco.bairro,
    cidadeEstado,
    endereco.cep ? `CEP ${endereco.cep}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function normalizarTexto(valor?: string | null) {
  const texto = String(valor ?? "").trim();

  return texto || "-";
}
