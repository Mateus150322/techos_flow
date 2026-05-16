import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { getApiErrorMessage } from "@/shared/utils/apiError";
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

    return `${formData.dataAbertura}T${formData.horaAbertura}`;
  }

  function validarFormulario() {
    if (!formData.dataAbertura) return "Informe a data de abertura.";
    if (!formData.horaAbertura) return "Informe a hora de abertura.";
    if (!formData.unidade) return "Selecione a unidade.";
    if (!formData.local.trim()) return "Informe o local.";
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
        prioridade: 2,
        descricao: `
Data Abertura: ${formData.dataAbertura}
Hora Abertura: ${formData.horaAbertura}
Unidade: ${formData.unidade}
Local: ${formData.local}
Setor: ${formData.setorRequisitante}
Encarregado: ${formData.encarregado}

Tipo Manutencao: ${formData.tipoManutencao}
Servico: ${formData.servico}
Equipamento: ${formData.equipamento}

Diagnostico: ${formData.diagnostico}
Procedimento: ${formData.procedimento}
Material: ${formData.materialUtilizado}
        `.trim(),
        endereco: {
          logradouro: formData.local || "ETA/ETE",
          numero: "SN",
          bairro: "Centro",
          cidade: "Rio Branco",
          estado: "AC",
          cep: "69900000",
        },
      });

      setFormData({
        ...initialForm,
        dataAbertura: getDataAtualLocal(),
        horaAbertura: getHoraAtualLocal(),
      });
      onCriada?.();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível criar a OS."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-card rounded-[1.5rem] p-4 sm:rounded-[1.85rem] sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
          Ordem de Servico - Manutencao ETA/ETE
        </h2>
        <p className="app-muted mt-2 text-sm">
          Formulario especifico para manutencao em unidades operacionais.
        </p>
        <p className="app-muted mt-3 text-xs uppercase tracking-[0.16em]">
          Na abertura da OS, registre apenas data e hora inicial do chamado
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${mobileNavOffset ? "pb-40" : "pb-24"} sm:space-y-8 sm:pb-0`}
        aria-busy={enviando}
      >
        {erro ? (
          <div className="app-alert-danger rounded-xl px-4 py-3 text-sm" role="alert" aria-live="assertive">{erro}</div>
        ) : null}

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Abertura da OS"
            description="Registre somente o momento de abertura do chamado. As horas da equipe ficam para a finalizacao da execucao."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Unidade e local"
            description="Identifique a unidade operacional e o ponto exato do servico."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Unidade *
              </legend>
              <div className="flex flex-wrap gap-6 pt-2 text-[var(--text-main)]">
                {[
                  { value: "CR", label: "CR" },
                  { value: "ETA", label: "ETA" },
                  { value: "EEE", label: "E.E.E" },
                  { value: "ETE", label: "ETE" },
                  { value: "CAPITACAO", label: "Captacao" },
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
              label="Local *"
              htmlFor="eta-local"
              input={
                <input
                  id="eta-local"
                  type="text"
                  value={formData.local}
                  onChange={(e) => updateField("local", e.target.value)}
                  placeholder="Especifique o local"
                  className="app-input px-4 py-3"
                />
              }
            />
          </div>
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Responsaveis"
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
            A equipe executora e registrada ao finalizar a execucao, com selecao de
            funcionarios cadastrados no sistema.
          </div>
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Manutencao"
            description="Descreva a natureza do servico e o equipamento envolvido."
          />

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-[var(--text-main)]">
              Tipo de manutencao *
            </legend>
            <div className="flex gap-8 pt-2 text-[var(--text-main)]">
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
            label="Servico *"
            htmlFor="eta-servico"
            input={
              <textarea
                id="eta-servico"
                rows={3}
                value={formData.servico}
                onChange={(e) => updateField("servico", e.target.value)}
                placeholder="Descreva o servico a ser realizado"
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
                placeholder="Equipamento relacionado ao servico"
                className="app-input px-4 py-3"
              />
            }
          />
        </section>

        <section className="app-section-soft rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-5">
          <SectionHeader
            title="Contexto tecnico"
            description="Adicione o contexto inicial para facilitar a continuidade da OS."
          />

          <Campo
            label="Diagnostico"
            htmlFor="eta-diagnostico"
            input={
              <textarea
                id="eta-diagnostico"
                rows={3}
                value={formData.diagnostico}
                onChange={(e) => updateField("diagnostico", e.target.value)}
                placeholder="Diagnostico do problema"
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
          className={`fixed inset-x-0 z-20 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_92%,transparent)] px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none ${
            mobileNavOffset
              ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
              : "bottom-0"
          }`}
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
                  Criar Ordem de Servico ETA/ETE
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
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-[var(--text-main)]">{label}</label>
      {input}
    </div>
  );
}
