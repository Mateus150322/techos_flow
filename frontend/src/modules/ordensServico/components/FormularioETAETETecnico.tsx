import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "@/shared/utils/apiError";
import { criarOrdem } from "../ordensServico.service";

type UnidadeType = "CR" | "ETA" | "EEE" | "ETE" | "CAPITACAO";
type MaintenanceType = "preventiva" | "corretiva";

type Props = {
  onCriada?: () => void;
  mobileNavOffset?: boolean;
};

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
  diagnostico: "",
  procedimento: "",
  materialUtilizado: "",
};

export default function FormularioETAETETecnico({
  onCriada,
  mobileNavOffset = false,
}: Props) {
  const [formData, setFormData] = useState(initialForm);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

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
      "",
      `Diagnostico: ${formData.diagnostico}`,
      `Procedimento: ${formData.procedimento}`,
      `Material: ${formData.materialUtilizado}`,
    ];

    return linhas.filter(Boolean).join("\n");
  }

  function validarFormulario() {
    if (!formData.dataAbertura) return "Informe a data de abertura.";
    if (!formData.horaAbertura) return "Informe a hora de abertura.";
    if (!formData.prioridade) return "Selecione a prioridade.";
    if (!formData.unidade) return "Selecione a unidade.";
    if (!formData.local.trim()) return "Informe o local operacional.";
    if (!formData.setorRequisitante.trim()) return "Informe o setor requisitante.";
    if (!formData.encarregado.trim()) return "Informe o encarregado.";
    if (!formData.tipoManutencao) return "Selecione o tipo de manutenção.";
    if (!formData.servico.trim()) return "Descreva o serviço.";
    if (!formData.equipamento.trim()) return "Informe o equipamento.";

    return "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);
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

      setFormData({
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

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Abertura da OS"
            description="Registre somente o momento de abertura do chamado. As horas da equipe ficam para a finalização da execução."
          />

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
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Unidade e local operacional"
            description="Identifique a unidade e o ponto exato do serviço. A geolocalização real será registrada depois nas evidências."
          />

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
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Responsáveis"
            description="Informe quem solicitou a OS e quem coordena a atividade."
          />

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
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Manutenção"
            description="Descreva a natureza do serviço e o equipamento envolvido."
          />

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
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Contexto técnico"
            description="Adicione o contexto inicial para facilitar a continuidade da OS."
          />

          <Campo
            label="Diagnóstico"
            htmlFor="eta-diagnostico"
            input={
              <textarea
                id="eta-diagnostico"
                rows={3}
                value={formData.diagnostico}
                onChange={(e) => updateField("diagnostico", e.target.value)}
                placeholder="Diagnóstico do problema"
                className="app-input px-4 py-3"
              />
            }
          />

          <Campo
            label="Procedimento"
            htmlFor="eta-procedimento"
            input={
              <textarea
                id="eta-procedimento"
                rows={3}
                value={formData.procedimento}
                onChange={(e) => updateField("procedimento", e.target.value)}
                placeholder="Procedimentos previstos ou iniciais"
                className="app-input px-4 py-3"
              />
            }
          />

          <Campo
            label="Material utilizado"
            htmlFor="eta-material-utilizado"
            input={
              <textarea
                id="eta-material-utilizado"
                rows={2}
                value={formData.materialUtilizado}
                onChange={(e) => updateField("materialUtilizado", e.target.value)}
                placeholder="Liste os materiais utilizados"
                className="app-input px-4 py-3"
              />
            }
          />
        </section>

        <div
          className="border-t border-[var(--border)] bg-transparent pt-4 sm:border-0 sm:pt-0"
        >
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

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-[var(--text-main)] sm:text-xl">{title}</h3>
      <p className="app-muted mt-1 text-sm">{description}</p>
    </div>
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
