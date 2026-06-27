import { useState, type FormEvent, type ReactNode } from "react";
import {
  ClipboardList,
  Loader2,
  MapPin,
  PlusCircle,
  Users,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/shared/utils/apiError";
import { useCurrentUser } from "@/shared/auth/session";
import { usePersistedDraft } from "@/shared/hooks/usePersistedDraft";
import { criarOrdem } from "../ordensServico.service";

type UnidadeType = "CR" | "ETA" | "EEE" | "ETE" | "CAPITACAO";
type MaintenanceType = "preventiva" | "corretiva";

type Props = {
  onCriada?: () => void;
  mobileNavOffset?: boolean;
};

type FormSection =
  | "abertura"
  | "unidade"
  | "responsaveis"
  | "manutencao";

function getDataAtualLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getHoraAtualLocal() {
  return new Date().toTimeString().slice(0, 5);
}

const initialForm = {
  dataAbertura: getDataAtualLocal(),
  horaAbertura: getHoraAtualLocal(),
  prioridade: "2",
  unidade: "" as UnidadeType | "",
  local: "",
  setorRequisitante: "",
  encarregado: "",
  tipoManutencao: "" as MaintenanceType | "",
  servico: "",
  equipamento: "",
};

export default function FormularioETAETETecnico({
  onCriada,
  mobileNavOffset = false,
}: Props) {
  const currentUser = useCurrentUser("tecnico");
  const {
    value: formData,
    setValue: setFormData,
    clearDraft,
  } = usePersistedDraft(
    `draft:ordem-eta-ete:${currentUser.id ?? "tecnico"}`,
    initialForm
  );
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [secoesAbertas, setSecoesAbertas] = useState<FormSection[]>([
    "abertura",
  ]);

  function updateField<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function montarDataAbertura() {
    if (!formData.dataAbertura || !formData.horaAbertura) {
      return "";
    }

    const local = new Date(`${formData.dataAbertura}T${formData.horaAbertura}`);

    return Number.isNaN(local.getTime()) ? "" : local.toISOString();
  }

  function montarReferenciaOperacional() {
    return [formData.unidade, formData.local.trim()].filter(Boolean).join(" - ");
  }

  function montarDescricao() {
    const linhas = [
      `Data Abertura: ${formData.dataAbertura}`,
      `Hora Abertura: ${formData.horaAbertura}`,
      `Unidade: ${formData.unidade}`,
      `Local Operacional: ${formData.local}`,
      `Referencia Operacional: ${montarReferenciaOperacional()}`,
      `Setor: ${formData.setorRequisitante}`,
      `Encarregado: ${formData.encarregado}`,
      "",
      `Tipo Manutencao: ${formData.tipoManutencao}`,
      `Servico: ${formData.servico}`,
      `Equipamento: ${formData.equipamento}`,
    ];

    return linhas.filter(Boolean).join("\n");
  }

  function validarFormulario() {
    if (!formData.dataAbertura) return { mensagem: "Informe a data de abertura.", secao: "abertura" as const };
    if (!formData.horaAbertura) return { mensagem: "Informe a hora de abertura.", secao: "abertura" as const };
    if (!formData.prioridade) return { mensagem: "Selecione a prioridade.", secao: "abertura" as const };
    if (!formData.unidade) return { mensagem: "Selecione a unidade.", secao: "unidade" as const };
    if (!formData.local.trim()) return { mensagem: "Informe o local operacional.", secao: "unidade" as const };
    if (!formData.setorRequisitante.trim()) return { mensagem: "Informe o setor requisitante.", secao: "responsaveis" as const };
    if (!formData.encarregado.trim()) return { mensagem: "Informe o encarregado.", secao: "responsaveis" as const };
    if (!formData.tipoManutencao) return { mensagem: "Selecione o tipo de manutenção.", secao: "manutencao" as const };
    if (!formData.servico.trim()) return { mensagem: "Descreva o serviço.", secao: "manutencao" as const };
    if (!formData.equipamento.trim()) return { mensagem: "Informe o equipamento.", secao: "manutencao" as const };

    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro.mensagem);
      setSecoesAbertas((current) =>
        current.includes(mensagemErro.secao)
          ? current
          : [...current, mensagemErro.secao]
      );
      return;
    }

    try {
      setEnviando(true);

      await criarOrdem({
        data_abertura: montarDataAbertura(),
        tipo_servico: "Manutencao ETA/ETE",
        nome_cliente: formData.local || "ETA/ETE",
        prioridade: Number(formData.prioridade),
        descricao: montarDescricao(),
        endereco: {
          logradouro: montarReferenciaOperacional(),
          numero: "SN",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
        },
      });

      await clearDraft({
        ...initialForm,
        dataAbertura: getDataAtualLocal(),
        horaAbertura: getHoraAtualLocal(),
      });
      onCriada?.();
    } catch (error) {
      const errors = getApiValidationErrors(error);
      const message = getApiErrorMessage(error, "");

      setErro(
        errors?.data_abertura?.[0] ||
          errors?.descricao?.[0] ||
          errors?.tipo_servico?.[0] ||
          errors?.nome_cliente?.[0] ||
          errors?.prioridade?.[0] ||
          errors?.["endereco.logradouro"]?.[0] ||
          message ||
          "Não foi possível criar a OS."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-card rounded-[1.5rem] p-4 sm:rounded-[1.85rem] sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
          Ordem de Serviço - Manutenção ETA/ETE
        </h2>
        <p className="app-muted mt-2 text-sm">
          Formulário específico para manutenção em unidades operacionais.
        </p>
        <p className="app-muted mt-3 text-xs uppercase tracking-[0.16em]">
          Na abertura da OS, registre apenas data e hora inicial do chamado
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${mobileNavOffset ? "pb-6" : "pb-0"} sm:space-y-8 sm:pb-0`}
        aria-busy={enviando}
      >
        {erro ? (
          <div
            className="app-alert-danger rounded-xl px-4 py-3 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {erro}
          </div>
        ) : null}

        <Accordion
          type="multiple"
          value={secoesAbertas}
          onValueChange={(value) => setSecoesAbertas(value as FormSection[])}
          className="space-y-4"
        >
          <FormAccordionSection
            value="abertura"
            title="Abertura da OS"
            description="Registre somente o momento de abertura do chamado. As horas da equipe ficam para a finalização da execução."
            icon={<ClipboardList className="h-5 w-5" />}
          >

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Campo
              label="Data de abertura *"
              htmlFor="eta-data-abertura"
              input={
                <input
                  id="eta-data-abertura"
                  type="date"
                  value={formData.dataAbertura}
                  onChange={(e) => updateField("dataAbertura", e.target.value)}
                  className="app-input px-4 py-3"
                />
              }
            />

            <Campo
              label="Hora de abertura *"
              htmlFor="eta-hora-abertura"
              input={
                <input
                  id="eta-hora-abertura"
                  type="time"
                  value={formData.horaAbertura}
                  onChange={(e) => updateField("horaAbertura", e.target.value)}
                  className="app-input px-4 py-3"
                />
              }
            />

            <Campo
              label="Prioridade *"
              htmlFor="eta-prioridade"
              input={
                <select
                  id="eta-prioridade"
                  value={formData.prioridade}
                  onChange={(e) => updateField("prioridade", e.target.value)}
                  className="app-input px-4 py-3"
                >
                  <option value="1">Alta</option>
                  <option value="2">Média</option>
                  <option value="3">Baixa</option>
                </select>
              }
            />
          </div>
          </FormAccordionSection>

          <FormAccordionSection
            value="unidade"
            title="Unidade e local operacional"
            description="Identifique a unidade e o ponto exato do serviço. A geolocalização real será registrada depois nas evidências."
            icon={<MapPin className="h-5 w-5" />}
          >

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Unidade *
              </legend>
              <div className="flex flex-wrap gap-4 pt-2 text-[var(--text-main)] sm:gap-6">
                {[
                  { value: "CR", label: "CR" },
                  { value: "ETA", label: "ETA" },
                  { value: "EEE", label: "E.E.E" },
                  { value: "ETE", label: "ETE" },
                  { value: "CAPITACAO", label: "Captação" },
                ].map((item) => (
                  <label key={item.value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="unidade"
                      checked={formData.unidade === item.value}
                      onChange={() => updateField("unidade", item.value as UnidadeType)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Campo
              label="Local operacional *"
              htmlFor="eta-local"
              input={
                <input
                  id="eta-local"
                  type="text"
                  value={formData.local}
                  onChange={(e) => updateField("local", e.target.value)}
                  placeholder="Ex.: ETA 2 - casa de bombas"
                  className="app-input px-4 py-3"
                />
              }
            />
          </div>

          <div className="app-alert-info mt-4 rounded-xl px-4 py-3 text-sm">
            O endereço detalhado deixa de ser preenchido na abertura. O que valerá como localização de campo é a geolocalização capturada pelo técnico nas evidências.
          </div>
          </FormAccordionSection>

          <FormAccordionSection
            value="responsaveis"
            title="Responsáveis"
            description="Informe quem solicitou a OS e quem coordena a atividade."
            icon={<Users className="h-5 w-5" />}
          >

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo
              label="Setor requisitante *"
              htmlFor="eta-setor-requisitante"
              input={
                <input
                  id="eta-setor-requisitante"
                  type="text"
                  value={formData.setorRequisitante}
                  onChange={(e) => updateField("setorRequisitante", e.target.value)}
                  className="app-input px-4 py-3"
                />
              }
            />

            <Campo
              label="Encarregado *"
              htmlFor="eta-encarregado"
              input={
                <input
                  id="eta-encarregado"
                  type="text"
                  value={formData.encarregado}
                  onChange={(e) => updateField("encarregado", e.target.value)}
                  className="app-input px-4 py-3"
                />
              }
            />
          </div>

          <div className="app-alert-info mt-4 rounded-xl px-4 py-3 text-sm">
            A equipe executora é registrada ao finalizar a execução, com seleção de
            funcionários e auxiliares cadastrados no sistema.
          </div>
          </FormAccordionSection>

          <FormAccordionSection
            value="manutencao"
            title="Manutenção"
            description="Descreva a natureza do serviço e o equipamento envolvido."
            icon={<Wrench className="h-5 w-5" />}
          >

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-[var(--text-main)]">
              Tipo de manutenção *
            </legend>
            <div className="flex flex-wrap gap-4 pt-2 text-[var(--text-main)] sm:gap-8">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo_manutencao"
                  checked={formData.tipoManutencao === "preventiva"}
                  onChange={() => updateField("tipoManutencao", "preventiva")}
                />
                <span>Preventiva</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo_manutencao"
                  checked={formData.tipoManutencao === "corretiva"}
                  onChange={() => updateField("tipoManutencao", "corretiva")}
                />
                <span>Corretiva</span>
              </label>
            </div>
          </fieldset>

          <Campo
            label="Serviço *"
            htmlFor="eta-servico"
            input={
              <textarea
                id="eta-servico"
                rows={3}
                value={formData.servico}
                onChange={(e) => updateField("servico", e.target.value)}
                placeholder="Descreva o serviço a ser realizado"
                className="app-input px-4 py-3"
              />
            }
          />

          <Campo
            label="Equipamento *"
            htmlFor="eta-equipamento"
            input={
              <input
                id="eta-equipamento"
                type="text"
                value={formData.equipamento}
                onChange={(e) => updateField("equipamento", e.target.value)}
                placeholder="Equipamento relacionado ao serviço"
                className="app-input px-4 py-3"
              />
            }
          />
          </FormAccordionSection>
        </Accordion>

        <div className="app-mobile-sticky-actions">
          <div className="mx-auto max-w-7xl">
            <button
              type="submit"
              disabled={enviando}
              className="app-button-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Criar Ordem de Serviço
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormAccordionSection({
  value,
  title,
  description,
  icon,
  children,
}: {
  value: FormSection;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="app-section-soft overflow-hidden rounded-[1.2rem] border border-[var(--border)] px-4 sm:rounded-[1.35rem] sm:px-5"
    >
      <AccordionTrigger className="py-4 sm:py-5">
        <span className="flex min-w-0 items-start gap-3 text-left">
          <span className="app-card inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] shadow-none">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-[var(--text-main)] sm:text-lg">
              {title}
            </span>
            <span className="app-muted mt-1 block text-xs font-normal leading-5 sm:text-sm">
              {description}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Campo({
  label,
  htmlFor,
  input,
}: {
  label: string;
  htmlFor: string;
  input: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-[var(--text-main)]">
        {label}
      </label>
      {input}
    </div>
  );
}
