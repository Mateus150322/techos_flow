import { useState, type FormEvent } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { criarOrdem } from "../ordensServico.service";

type UnidadeType = "CR" | "ETA" | "EEE" | "ETE" | "CAPITACAO";
type MaintenanceType = "preventiva" | "corretiva";

export default function FormularioETAETETecnico() {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
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
    assignedTo: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      const payload = {
        tipo_servico: "Manutenção ETA/ETE",
        nome_cliente: formData.local || "ETA/ETE",
        prioridade: 2,
        descricao: `
Unidade: ${formData.unidade}
Local: ${formData.local}
Setor: ${formData.setorRequisitante}
Encarregado: ${formData.encarregado}
Equipe: ${formData.equipe}

Tipo Manutenção: ${formData.tipoManutencao}
Serviço: ${formData.servico}
Equipamento: ${formData.equipamento}

Diagnóstico: ${formData.diagnostico}
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
      };

      await criarOrdem(payload);

      alert("OS criada com sucesso!");
      window.location.reload();
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message || "Não foi possível criar a OS.";

      alert(message);
    }
  }

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${titleText}`}>
          Ordem de Serviço - Manutenção ETA/ETE
        </h2>
        <p className={`mt-2 text-sm ${mutedText}`}>
          Formulário específico para serviços de manutenção em estações
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Solicitação</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Data da Chamada *
              </label>
              <input
                type="date"
                value={formData.dataChamada}
                onChange={(e) => setFormData({ ...formData, dataChamada: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Hora Início
              </label>
              <input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Hora Fim
              </label>
              <input
                type="time"
                value={formData.horaFim}
                onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Data Final (opcional)
              </label>
              <input
                type="date"
                value={formData.dataFinal}
                onChange={(e) => setFormData({ ...formData, dataFinal: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Unidade e Local</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Unidade *
              </label>
              <div className="flex flex-wrap gap-6 pt-2">
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
                      onChange={() =>
                        setFormData({ ...formData, unidade: item.value as UnidadeType })
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Local *
              </label>
              <input
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Especifique o local"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Responsáveis</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Setor Requisitante *
              </label>
              <input
                type="text"
                value={formData.setorRequisitante}
                onChange={(e) =>
                  setFormData({ ...formData, setorRequisitante: e.target.value })
                }
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Encarregado *
              </label>
              <input
                type="text"
                value={formData.encarregado}
                onChange={(e) => setFormData({ ...formData, encarregado: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Equipe *
              </label>
              <input
                type="text"
                value={formData.equipe}
                onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                placeholder="Nome dos membros da equipe"
                className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Manutenção</h3>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Tipo de Manutenção *
            </label>
            <div className="flex gap-8 pt-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo_manutencao"
                  checked={formData.tipoManutencao === "preventiva"}
                  onChange={() =>
                    setFormData({ ...formData, tipoManutencao: "preventiva" })
                  }
                />
                <span>Preventiva</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="tipo_manutencao"
                  checked={formData.tipoManutencao === "corretiva"}
                  onChange={() =>
                    setFormData({ ...formData, tipoManutencao: "corretiva" })
                  }
                />
                <span>Corretiva</span>
              </label>
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Serviço *
            </label>
            <textarea
              rows={3}
              value={formData.servico}
              onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
              placeholder="Descreva o serviço a ser realizado"
              className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Equipamento *
            </label>
            <input
              type="text"
              value={formData.equipamento}
              onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
              placeholder="Equipamento relacionado ao serviço"
              className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Execução</h3>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Diagnóstico
            </label>
            <textarea
              rows={3}
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              placeholder="Diagnóstico do problema"
              className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Procedimento
            </label>
            <textarea
              rows={3}
              value={formData.procedimento}
              onChange={(e) => setFormData({ ...formData, procedimento: e.target.value })}
              placeholder="Procedimentos realizados"
              className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Material Utilizado
            </label>
            <textarea
              rows={2}
              value={formData.materialUtilizado}
              onChange={(e) =>
                setFormData({ ...formData, materialUtilizado: e.target.value })
              }
              placeholder="Liste os materiais utilizados"
              className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
            />
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-medium ${titleText}`}>
            Atribuir a Técnico
          </label>
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            className={`w-full rounded-xl border px-4 py-3 ${inputBg}`}
          >
            <option value="">Selecione um técnico (opcional)</option>
            <option value="João Santos">João Santos</option>
            <option value="Ana Costa">Ana Costa</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Criar Ordem de Serviço ETA/ETE
        </button>
      </form>
    </div>
  );
}