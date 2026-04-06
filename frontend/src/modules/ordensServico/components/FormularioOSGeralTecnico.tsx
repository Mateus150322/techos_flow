import { useState, type FormEvent } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { criarOrdem } from "../ordensServico.service";
import { useTheme } from "@/shared/hooks/useTheme";

type Props = {
  onCriada?: () => void;
};

type FormData = {
  tipoServico: string;
  nomeCliente: string;
  prioridade: number;
  descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

export default function FormularioOSGeralTecnico({ onCriada }: Props) {
  const { isDark } = useTheme();

  const [form, setForm] = useState<FormData>({
    tipoServico: "",
    nomeCliente: "",
    prioridade: 2,
    descricao: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function formatarCep(value: string) {
    const apenasNumeros = value.replace(/\D/g, "").slice(0, 8);
    if (apenasNumeros.length <= 5) return apenasNumeros;
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    try {
      setEnviando(true);

      await criarOrdem({
        tipo_servico: form.tipoServico,
        nome_cliente: form.nomeCliente,
        prioridade: Number(form.prioridade),
        descricao: form.descricao,
        endereco: {
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado.toUpperCase(),
          cep: form.cep.replace(/\D/g, ""),
        },
      });

      setForm({
        tipoServico: "",
        nomeCliente: "",
        prioridade: 2,
        descricao: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      });

      onCriada?.();
    } catch (error: any) {
      console.error(error);
      setErro(
        error?.response?.data?.message ||
          "Não foi possível criar a ordem de serviço."
      );
    } finally {
      setEnviando(false);
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
        <h2 className={`text-2xl font-semibold ${titleText}`}>Nova Ordem de Serviço</h2>
        <p className={`mt-2 text-sm ${mutedText}`}>
          Preencha os dados para criar uma nova OS
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Tipo de Serviço *
            </label>
            <select
              value={form.tipoServico}
              onChange={(e) => updateField("tipoServico", e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="">Selecione o tipo</option>
              <option value="manutencao">Manutenção</option>
              <option value="instalacao">Instalação</option>
              <option value="vistoria">Vistoria</option>
              <option value="leitura">Leitura</option>
              <option value="reparo">Reparo</option>
            </select>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${titleText}`}>
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={form.nomeCliente}
              onChange={(e) => updateField("nomeCliente", e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </div>
        </div>

        <div className="max-w-sm">
          <label className={`mb-2 block text-sm font-medium ${titleText}`}>
            Prioridade *
          </label>
          <select
            value={form.prioridade}
            onChange={(e) => updateField("prioridade", Number(e.target.value))}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          >
            <option value={1}>Alta</option>
            <option value={2}>Média</option>
            <option value={3}>Baixa</option>
          </select>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-medium ${titleText}`}>
            Descrição do Serviço *
          </label>
          <textarea
            rows={4}
            value={form.descricao}
            onChange={(e) => updateField("descricao", e.target.value)}
            placeholder="Descreva o serviço a ser realizado"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />
        </div>

        <div className="space-y-4">
          <h3 className={`text-xl font-semibold ${titleText}`}>Endereço do Cliente</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Logradouro *
              </label>
              <input
                type="text"
                value={form.logradouro}
                onChange={(e) => updateField("logradouro", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Número *
              </label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => updateField("numero", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Complemento
              </label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => updateField("complemento", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Bairro *
              </label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => updateField("bairro", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Cidade *
              </label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                Estado *
              </label>
              <input
                type="text"
                maxLength={2}
                value={form.estado}
                onChange={(e) => updateField("estado", e.target.value.toUpperCase())}
                className={`w-full rounded-xl border px-4 py-3 uppercase outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${titleText}`}>
                CEP *
              </label>
              <input
                type="text"
                maxLength={9}
                value={form.cep}
                onChange={(e) => updateField("cep", formatarCep(e.target.value))}
                placeholder="00000-000"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
          </div>
        </div>

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
              Criar Ordem de Serviço
            </>
          )}
        </button>
      </form>
    </div>
  );
}