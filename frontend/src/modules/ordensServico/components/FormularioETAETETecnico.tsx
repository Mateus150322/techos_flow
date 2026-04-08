import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { criarOrdem } from "../ordensServico.service";

type UnidadeType = "CR" | "ETA" | "EEE" | "ETE" | "CAPITACAO";
type MaintenanceType = "preventiva" | "corretiva";

type Props = {
  onCriada?: () => void;
};

const initialForm = {
  dataChamada: new Date().toISOString().split("T")[0],
  horaInicio: "",
  horaFim: "",
  dataFinal: "",
  unidade: "" as UnidadeType | "",
  local: "",
  setorRequisitante: "",
  encarregado: "",
  equipe: "",
  tipoManutencao: "" as MaintenanceType | "",
  servico: "",
  equipamento: "",
  diagnostico: "",
  procedimento: "",
  materialUtilizado: "",
};

export default function FormularioETAETETecnico({ onCriada }: Props) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState(initialForm);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function updateField<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validarFormulario() {
    if (!formData.dataChamada) return "Informe a data da chamada.";
    if (!formData.unidade) return "Selecione a unidade.";
    if (!formData.local.trim()) return "Informe o local.";
    if (!formData.setorRequisitante.trim()) return "Informe o setor requisitante.";
    if (!formData.encarregado.trim()) return "Informe o encarregado.";
    if (!formData.equipe.trim()) return "Informe a equipe.";
    if (!formData.tipoManutencao) return "Selecione o tipo de manutencao.";
    if (!formData.servico.trim()) return "Descreva o servico.";
    if (!formData.equipamento.trim()) return "Informe o equipamento.";

    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    try {
      setEnviando(true);

      await criarOrdem({
        tipo_servico: "Manutenção ETA/ETE",
        nome_cliente: formData.local || "ETA/ETE",
        prioridade: 2,
        descricao: `
Data Chamada: ${formData.dataChamada}
Hora Inicio: ${formData.horaInicio || "-"}
Hora Fim: ${formData.horaFim || "-"}
Data Final: ${formData.dataFinal || "-"}
Unidade: ${formData.unidade}
Local: ${formData.local}
Setor: ${formData.setorRequisitante}
Encarregado: ${formData.encarregado}
Equipe: ${formData.equipe}

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

      setFormData(initialForm);
      onCriada?.();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Nao foi possivel criar a OS."));
    } finally {
      setEnviando(false);
    }
  }

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400";
  const sectionCard = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
    : "rounded-2xl border border-slate-200 bg-slate-50 p-5";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${titleText}`}>
          Ordem de Servico - Manutencao ETA/ETE
        </h2>
        <p className={`mt-2 text-sm ${mutedText}`}>
          Formulario especifico para manutencao em unidades operacionais.
        </p>
        <p className={`mt-3 text-xs uppercase tracking-[0.16em] ${mutedText}`}>
          Campos principais da abertura tecnica
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {erro && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-red-900 bg-red-950 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {erro}
          </div>
        )}

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Solicitacao</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Registre o horario e a referencia inicial do atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Campo
              label="Data da Chamada *"
              titleText={titleText}
              input={
                <input
                  type="date"
                  value={formData.dataChamada}
                  onChange={(e) => updateField("dataChamada", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />

            <Campo
              label="Hora Inicio"
              titleText={titleText}
              input={
                <input
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => updateField("horaInicio", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />

            <Campo
              label="Hora Fim"
              titleText={titleText}
              input={
                <input
                  type="time"
                  value={formData.horaFim}
                  onChange={(e) => updateField("horaFim", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />

            <Campo
              label="Data Final"
              titleText={titleText}
              input={
                <input
                  type="date"
                  value={formData.dataFinal}
                  onChange={(e) => updateField("dataFinal", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />
          </div>
        </section>

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Unidade e Local</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Identifique a unidade operacional e o ponto exato do servico.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>Unidade *</label>
              <div className="flex flex-wrap gap-6 pt-2">
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
            </div>

            <Campo
              label="Local *"
              titleText={titleText}
              input={
                <input
                  type="text"
                  value={formData.local}
                  onChange={(e) => updateField("local", e.target.value)}
                  placeholder="Especifique o local"
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />
          </div>
        </section>

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Responsaveis</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Informe quem solicitou e quem esta envolvido na equipe.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo
              label="Setor Requisitante *"
              titleText={titleText}
              input={
                <input
                  type="text"
                  value={formData.setorRequisitante}
                  onChange={(e) => updateField("setorRequisitante", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />

            <Campo
              label="Encarregado *"
              titleText={titleText}
              input={
                <input
                  type="text"
                  value={formData.encarregado}
                  onChange={(e) => updateField("encarregado", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                />
              }
            />

            <div className="md:col-span-2">
              <Campo
                label="Equipe *"
                titleText={titleText}
                input={
                  <input
                    type="text"
                    value={formData.equipe}
                    onChange={(e) => updateField("equipe", e.target.value)}
                    placeholder="Nome dos membros da equipe"
                    className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
                  />
                }
              />
            </div>
          </div>
        </section>

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Manutencao</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Descreva a natureza do servico e o equipamento envolvido.
            </p>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Tipo de Manutencao *
            </label>
            <div className="flex gap-8 pt-2">
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
          </div>

          <Campo
            label="Servico *"
            titleText={titleText}
            input={
              <textarea
                rows={3}
                value={formData.servico}
                onChange={(e) => updateField("servico", e.target.value)}
                placeholder="Descreva o servico a ser realizado"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            }
          />

          <Campo
            label="Equipamento *"
            titleText={titleText}
            input={
              <input
                type="text"
                value={formData.equipamento}
                onChange={(e) => updateField("equipamento", e.target.value)}
                placeholder="Equipamento relacionado ao servico"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            }
          />
        </section>

        <section className={sectionCard}>
          <div className="mb-5">
            <h3 className={`text-xl font-semibold ${titleText}`}>Execucao</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Adicione o contexto tecnico inicial para facilitar a continuidade da OS.
            </p>
          </div>

          <Campo
            label="Diagnostico"
            titleText={titleText}
            input={
              <textarea
                rows={3}
                value={formData.diagnostico}
                onChange={(e) => updateField("diagnostico", e.target.value)}
                placeholder="Diagnostico do problema"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            }
          />

          <Campo
            label="Procedimento"
            titleText={titleText}
            input={
              <textarea
                rows={3}
                value={formData.procedimento}
                onChange={(e) => updateField("procedimento", e.target.value)}
                placeholder="Procedimentos realizados"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            }
          />

          <Campo
            label="Material Utilizado"
            titleText={titleText}
            input={
              <textarea
                rows={2}
                value={formData.materialUtilizado}
                onChange={(e) => updateField("materialUtilizado", e.target.value)}
                placeholder="Liste os materiais utilizados"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            }
          />
        </section>

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
      </form>
    </div>
  );
}

function Campo({
  label,
  titleText,
  input,
}: {
  label: string;
  titleText: string;
  input: ReactNode;
}) {
  return (
    <div>
      <label className={`mb-2 block text-sm font-medium ${titleText}`}>{label}</label>
      {input}
    </div>
  );
}
