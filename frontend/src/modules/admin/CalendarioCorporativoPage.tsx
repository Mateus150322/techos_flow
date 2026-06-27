import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate } from "react-router-dom";
import {
  CalendarDays,
  Edit3,
  ListChecks,
  Plus,
  RotateCcw,
  Save,
  Table2,
  Trash2,
  Users,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdminShell } from "./AdminShell";
import { AdminMetricCard } from "./components/AdminMetricCard";
import {
  listarCalendarioCorporativo,
  listarEscalasPlantao,
  removerDataCalendario,
  removerEscalaPlantao,
  salvarDataCalendario,
  salvarEscalaPlantao,
  type CalendarioPayload,
  type DataCalendarioCorporativo,
  type EscalaPlantao,
  type EscalaPlantaoPayload,
} from "./calendario.service";
import {
  listarFuncionariosDisponiveis,
  type FuncionarioDisponivel,
} from "@/modules/ordensServico/ordensServico.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";

const CALENDARIO_INICIAL: CalendarioPayload = {
  nome: "",
  data: "",
  tipo: "feriado",
  escopo: "estadual",
  estado: "AC",
  municipio: "Rio Branco",
  percentual_hora_extra: 100,
  recorrente: false,
  observacao: "",
  ativo: true,
};

const ESCALA_INICIAL = {
  participante: "",
  descricao: "",
  funcao_escala: "mecanico" as EscalaPlantao["funcao_escala"],
  data_inicio: "",
  data_fim: "",
  observacao: "",
  ativo: true,
};

type GradeEscalaDia = {
  mecanico: string;
  auxiliares: [string, string];
};

export default function CalendarioCorporativoPage() {
  const currentUser = useCurrentUser();
  const { isDark } = useTheme();
  const anoAtual = new Date().getFullYear();
  const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const calendarioFormRef = useRef<HTMLFormElement>(null);
  const escalaFormRef = useRef<HTMLFormElement>(null);

  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState(mesAtual);
  const [datas, setDatas] = useState<DataCalendarioCorporativo[]>([]);
  const [escalas, setEscalas] = useState<EscalaPlantao[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [editingDataId, setEditingDataId] = useState<string | null>(null);
  const [editingEscalaId, setEditingEscalaId] = useState<string | null>(null);
  const [calendarioForm, setCalendarioForm] = useState<CalendarioPayload>(CALENDARIO_INICIAL);
  const [escalaForm, setEscalaForm] = useState(ESCALA_INICIAL);
  const [gradeEscala, setGradeEscala] = useState<Record<string, GradeEscalaDia>>({});
  const [calendarioSections, setCalendarioSections] = useState<string[]>(["nova-data", "datas"]);
  const [escalaSections, setEscalaSections] = useState<string[]>([
    "grade",
    "nova-escala",
    "escalas",
  ]);

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const softCard = isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-slate-50" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";
  const primaryButton = isDark
    ? "bg-slate-100 text-slate-950 hover:bg-white"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const secondaryButton = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const dangerButton = isDark
    ? "border-red-900 bg-red-950/40 text-red-200 hover:bg-red-950"
    : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";

  const anosDisponiveis = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => String(anoAtual - 2 + index)).sort((a, b) =>
        a > b ? -1 : 1
      ),
    [anoAtual]
  );
  const diasDaGrade = useMemo(() => (mes ? montarDiasDoMes(ano, mes) : []), [ano, mes]);
  const escalasPorDiaFuncao = useMemo(() => agruparEscalasMensais(escalas), [escalas]);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const [calendarioResponse, escalasResponse, funcionariosResponse] = await Promise.all([
        listarCalendarioCorporativo(ano),
        listarEscalasPlantao(ano, mes),
        listarFuncionariosDisponiveis(),
      ]);

      setDatas(calendarioResponse.data ?? []);
      setEscalas(escalasResponse.data ?? []);
      setFuncionarios(funcionariosResponse ?? []);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar o calendário corporativo."));
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!mes) {
      setGradeEscala({});
      return;
    }

    const proximaGrade: Record<string, GradeEscalaDia> = {};

    for (const dia of diasDaGrade) {
      const mecanico = escalasPorDiaFuncao.get(`${dia.data}|mecanico`)?.[0];
      const auxiliares = escalasPorDiaFuncao.get(`${dia.data}|auxiliar_mecanica`) ?? [];

      proximaGrade[dia.data] = {
        mecanico: mecanico ? participanteValue(mecanico) : "",
        auxiliares: [
          auxiliares[0] ? participanteValue(auxiliares[0]) : "",
          auxiliares[1] ? participanteValue(auxiliares[1]) : "",
        ],
      };
    }

    setGradeEscala(proximaGrade);
  }, [diasDaGrade, escalasPorDiaFuncao, mes]);

  useEffect(() => {
    if (!erro && !sucesso) {
      return;
    }

    window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      feedbackRef.current?.focus({ preventScroll: true });
    });
  }, [erro, sucesso]);

  function scrollToCalendarioForm() {
    window.requestAnimationFrame(() => {
      calendarioFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function scrollToEscalaForm() {
    window.requestAnimationFrame(() => {
      escalaFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function abrirSecaoCalendario(secao: string) {
    setCalendarioSections((prev) => (prev.includes(secao) ? prev : [...prev, secao]));
  }

  function abrirSecaoEscala(secao: string) {
    setEscalaSections((prev) => (prev.includes(secao) ? prev : [...prev, secao]));
  }

  async function handleSalvarData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      await salvarDataCalendario(calendarioForm, editingDataId);
      setSucesso(editingDataId ? "Data atualizada com sucesso." : "Data cadastrada com sucesso.");
      resetCalendarioForm();
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível salvar a data do calendário."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSalvarEscala(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const [tipoVinculo, participanteId] = escalaForm.participante.split(":");

    if (!tipoVinculo || !participanteId) {
      setErro("Selecione um participante para a escala.");
      return;
    }

    const payload: EscalaPlantaoPayload = {
      participante_id: participanteId,
      tipo_vinculo: tipoVinculo as FuncionarioDisponivel["tipo_vinculo"],
      descricao: escalaForm.descricao,
      funcao_escala: escalaForm.funcao_escala,
      data_inicio: escalaForm.data_inicio,
      data_fim: escalaForm.data_fim,
      observacao: escalaForm.observacao,
      ativo: escalaForm.ativo,
    };

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      await salvarEscalaPlantao(payload, editingEscalaId);
      setSucesso(editingEscalaId ? "Escala atualizada com sucesso." : "Escala cadastrada com sucesso.");
      resetEscalaForm();
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível salvar a escala de plantão."));
    } finally {
      setSaving(false);
    }
  }

  function atualizarGradeDia(
    data: string,
    campo: "mecanico" | "auxiliar_1" | "auxiliar_2",
    value: string
  ) {
    setGradeEscala((prev) => {
      const atual = prev[data] ?? criarGradeDiaVazia();
      const proximo: GradeEscalaDia = {
        mecanico: atual.mecanico,
        auxiliares: [...atual.auxiliares] as [string, string],
      };

      if (campo === "mecanico") {
        proximo.mecanico = value;
      } else if (campo === "auxiliar_1") {
        proximo.auxiliares[0] = value;
      } else {
        proximo.auxiliares[1] = value;
      }

      return {
        ...prev,
        [data]: proximo,
      };
    });
  }

  function limparGradeMensal() {
    const proximaGrade: Record<string, GradeEscalaDia> = {};

    for (const dia of diasDaGrade) {
      proximaGrade[dia.data] = criarGradeDiaVazia();
    }

    setGradeEscala(proximaGrade);
  }

  async function handleSalvarGradeMensal() {
    if (!mes) {
      setErro("Selecione um mês para salvar a grade mensal.");
      abrirSecaoEscala("grade");
      return;
    }

    try {
      setSavingGrade(true);
      setErro("");
      setSucesso("");

      for (const dia of diasDaGrade) {
        const valores = gradeEscala[dia.data] ?? criarGradeDiaVazia();
        await sincronizarFuncaoDaGrade(dia.data, "mecanico", [valores.mecanico]);
        await sincronizarFuncaoDaGrade(dia.data, "auxiliar_mecanica", valores.auxiliares);
      }

      setSucesso("Grade mensal salva com sucesso.");
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível salvar a grade mensal."));
    } finally {
      setSavingGrade(false);
    }
  }

  async function sincronizarFuncaoDaGrade(
    data: string,
    funcaoEscala: "mecanico" | "auxiliar_mecanica",
    selecionados: string[]
  ) {
    const registrosAtuais = escalasPorDiaFuncao.get(`${data}|${funcaoEscala}`) ?? [];
    const selecionadosUnicos = selecionados.filter(Boolean).filter((value, index, array) => array.indexOf(value) === index);
    const limite = Math.max(registrosAtuais.length, selecionadosUnicos.length);

    for (let index = 0; index < limite; index += 1) {
      const selecionado = selecionadosUnicos[index];
      const registro = registrosAtuais[index];

      if (!selecionado && registro) {
        await removerEscalaPlantao(registro.id);
        continue;
      }

      if (!selecionado) {
        continue;
      }

      const [tipoVinculo, participanteId] = selecionado.split(":");

      if (!tipoVinculo || !participanteId) {
        continue;
      }

      await salvarEscalaPlantao(
        {
          participante_id: participanteId,
          tipo_vinculo: tipoVinculo as FuncionarioDisponivel["tipo_vinculo"],
          descricao: `Plantão mensal - ${funcaoEscalaLabel(funcaoEscala)}`,
          funcao_escala: funcaoEscala,
          data_inicio: `${data}T00:00`,
          data_fim: `${data}T23:59`,
          ativo: true,
          observacao: "Gerado pela grade mensal.",
        },
        registro?.id
      );
    }
  }

  function resetCalendarioForm() {
    setEditingDataId(null);
    setCalendarioForm({
      ...CALENDARIO_INICIAL,
      data: `${ano}-01-01`,
    });
    abrirSecaoCalendario("nova-data");
    scrollToCalendarioForm();
  }

  function resetEscalaForm() {
    setEditingEscalaId(null);
    setEscalaForm(ESCALA_INICIAL);
    abrirSecaoEscala("nova-escala");
    scrollToEscalaForm();
  }

  function editarData(item: DataCalendarioCorporativo) {
    setEditingDataId(item.id);
    setCalendarioForm({
      nome: item.nome,
      data: item.data,
      tipo: item.tipo,
      escopo: item.escopo,
      estado: item.estado ?? "",
      municipio: item.municipio ?? "",
      percentual_hora_extra: item.percentual_hora_extra,
      recorrente: item.recorrente,
      observacao: item.observacao ?? "",
      ativo: item.ativo,
    });
    abrirSecaoCalendario("nova-data");
    scrollToCalendarioForm();
  }

  function editarEscala(item: EscalaPlantao) {
    setEditingEscalaId(item.id);
    setEscalaForm({
      participante: `${item.tipo_vinculo}:${item.participante_id}`,
      descricao: item.descricao,
      funcao_escala: item.funcao_escala ?? "mecanico",
      data_inicio: toDatetimeLocal(item.data_inicio),
      data_fim: toDatetimeLocal(item.data_fim),
      observacao: item.observacao ?? "",
      ativo: item.ativo,
    });
    abrirSecaoEscala("nova-escala");
    scrollToEscalaForm();
  }

  async function excluirData(id: string) {
    try {
      setErro("");
      setSucesso("");
      await removerDataCalendario(id);
      setSucesso("Data removida do calendário.");
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível remover a data."));
    }
  }

  async function excluirEscala(id: string) {
    try {
      setErro("");
      setSucesso("");
      await removerEscalaPlantao(id);
      setSucesso("Escala removida.");
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível remover a escala."));
    }
  }

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  const totalFeriados = datas.filter((item) => item.tipo === "feriado").length;
  const totalPontos = datas.filter((item) => item.tipo === "ponto_facultativo").length;
  const totalEscalasAtivas = escalas.filter((item) => item.ativo).length;

  return (
    <AdminShell currentUser={currentUser} activeTab="calendario">
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          value={totalFeriados}
          label="Feriados cadastrados"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-blue-500"
          hint={`Ano ${ano}`}
        />
        <AdminMetricCard
          value={totalPontos}
          label="Pontos facultativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-amber-500"
          hint="Usados no cálculo de horas"
        />
        <AdminMetricCard
          value={totalEscalasAtivas}
          label="Escalas ativas"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Plantões planejados"
        />
      </section>

      <section className={`mb-6 rounded-3xl border p-4 shadow-sm sm:p-6 ${cardBg}`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-2xl font-semibold ${titleText}`}>Calendário Corporativo</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Cadastre feriados e pontos facultativos usados no cálculo de horas extras.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Ano</span>
              <select
                value={ano}
                onChange={(event) => setAno(event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                {anosDisponiveis.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Mês das escalas</span>
              <select
                value={mes}
                onChange={(event) => setMes(event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="">Ano inteiro</option>
                {MESES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div ref={feedbackRef} tabIndex={-1} className="outline-none">
          {erro ? <Alert type="error" message={erro} isDark={isDark} /> : null}
          {sucesso ? <Alert type="success" message={sucesso} isDark={isDark} /> : null}
        </div>

        <Accordion
          type="multiple"
          value={calendarioSections}
          onValueChange={setCalendarioSections}
          className="overflow-hidden rounded-2xl border border-[var(--border)] px-4 sm:px-5"
        >
          <AccordionItem value="nova-data">
            <AccordionTrigger>
              <TituloSecao
                icone={<Plus className="h-4 w-4" />}
                titulo={editingDataId ? "Editar data especial" : "Nova data especial"}
                descricao="Feriados e pontos facultativos usados no calculo de horas"
              />
            </AccordionTrigger>
            <AccordionContent>
              <form
                ref={calendarioFormRef}
                onSubmit={handleSalvarData}
                className={`scroll-mt-24 rounded-2xl border p-4 sm:p-5 ${softCard}`}
              >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={`text-lg font-semibold ${titleText}`}>
              {editingDataId ? "Editar data especial" : "Nova data especial"}
            </h3>
            <button
              type="button"
              onClick={resetCalendarioForm}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${secondaryButton}`}
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <Field label="Descrição" className="lg:col-span-2" titleText={titleText}>
              <input
                value={calendarioForm.nome}
                onChange={(event) => setCalendarioForm((prev) => ({ ...prev, nome: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </Field>

            <Field label="Data" titleText={titleText}>
              <input
                type="date"
                value={calendarioForm.data}
                onChange={(event) => setCalendarioForm((prev) => ({ ...prev, data: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </Field>

            <Field label="Percentual" titleText={titleText}>
              <select
                value={calendarioForm.percentual_hora_extra}
                onChange={(event) =>
                  setCalendarioForm((prev) => ({
                    ...prev,
                    percentual_hora_extra: Number(event.target.value),
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value={0}>Sem adicional</option>
                <option value={50}>50%</option>
                <option value={100}>100%</option>
              </select>
            </Field>

            <Field label="Tipo" titleText={titleText}>
              <select
                value={calendarioForm.tipo}
                onChange={(event) =>
                  setCalendarioForm((prev) => ({
                    ...prev,
                    tipo: event.target.value as CalendarioPayload["tipo"],
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="feriado">Feriado</option>
                <option value="ponto_facultativo">Ponto facultativo</option>
              </select>
            </Field>

            <Field label="Escopo" titleText={titleText}>
              <select
                value={calendarioForm.escopo}
                onChange={(event) =>
                  setCalendarioForm((prev) => ({
                    ...prev,
                    escopo: event.target.value as CalendarioPayload["escopo"],
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="nacional">Nacional</option>
                <option value="estadual">Estadual</option>
                <option value="municipal">Municipal</option>
                <option value="interno">Interno</option>
              </select>
            </Field>

            <Field label="UF" titleText={titleText}>
              <input
                value={calendarioForm.estado ?? ""}
                maxLength={2}
                onChange={(event) =>
                  setCalendarioForm((prev) => ({ ...prev, estado: event.target.value.toUpperCase() }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </Field>

            <Field label="Município" titleText={titleText}>
              <input
                value={calendarioForm.municipio ?? ""}
                onChange={(event) => setCalendarioForm((prev) => ({ ...prev, municipio: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <Field label="Observação" titleText={titleText}>
              <input
                value={calendarioForm.observacao ?? ""}
                onChange={(event) => setCalendarioForm((prev) => ({ ...prev, observacao: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </Field>

            <Toggle
              label="Recorrente"
              checked={Boolean(calendarioForm.recorrente)}
              onChange={(checked) => setCalendarioForm((prev) => ({ ...prev, recorrente: checked }))}
              titleText={titleText}
            />

            <Toggle
              label="Ativo"
              checked={Boolean(calendarioForm.ativo)}
              onChange={(checked) => setCalendarioForm((prev) => ({ ...prev, ativo: checked }))}
              titleText={titleText}
            />
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButton}`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar data"}
            </button>
          </div>
              </form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="datas">
            <AccordionTrigger>
              <TituloSecao
                icone={<ListChecks className="h-4 w-4" />}
                titulo="Datas cadastradas"
                descricao={`${datas.length} registro${datas.length === 1 ? "" : "s"} no filtro atual`}
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3">
          {loading ? (
            <EmptyState text="Carregando datas..." className={softCard} mutedText={mutedText} />
          ) : datas.length === 0 ? (
            <EmptyState text="Nenhuma data cadastrada para o filtro atual." className={softCard} mutedText={mutedText} />
          ) : (
            datas.map((item) => (
              <DataCalendarioCard
                key={item.id}
                item={item}
                cardBg={softCard}
                titleText={titleText}
                mutedText={mutedText}
                secondaryButton={secondaryButton}
                dangerButton={dangerButton}
                onEdit={() => editarData(item)}
                onDelete={() => void excluirData(item.id)}
              />
            ))
          )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className={`rounded-3xl border p-4 shadow-sm sm:p-6 ${cardBg}`}>
        <div className="mb-5 flex min-w-0 items-start gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-2xl font-semibold ${titleText}`}>Escalas de Plantão</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Planeje plantões e permita que o relatório identifique horas executadas em escala.
            </p>
          </div>
        </div>

        <Accordion
          type="multiple"
          value={escalaSections}
          onValueChange={setEscalaSections}
          className="overflow-hidden rounded-2xl border border-[var(--border)] px-4 sm:px-5"
        >
          <AccordionItem value="grade">
            <AccordionTrigger>
              <TituloSecao
                icone={<Table2 className="h-4 w-4" />}
                titulo="Grade mensal da escala"
                descricao="Modelo mensal com dia, semana, mecanico e auxiliares"
              />
            </AccordionTrigger>
            <AccordionContent>
              <section className={`rounded-2xl border p-4 sm:p-5 ${softCard}`}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${titleText}`}>Grade mensal da escala</h3>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Modelo mensal com dia, semana, mecânico e auxiliares.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={limparGradeMensal}
                disabled={!mes || savingGrade}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${secondaryButton}`}
              >
                <RotateCcw className="h-4 w-4" />
                Limpar grade
              </button>
              <button
                type="button"
                onClick={() => void handleSalvarGradeMensal()}
                disabled={!mes || savingGrade}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButton}`}
              >
                <Save className="h-4 w-4" />
                {savingGrade ? "Salvando grade..." : "Salvar grade mensal"}
              </button>
            </div>
          </div>

          {!mes ? (
            <EmptyState
              text="Selecione um mês para montar a grade mensal."
              className={softCard}
              mutedText={mutedText}
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 xl:block">
                <table className="w-full table-fixed text-sm">
                  <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600"}>
                    <tr>
                      <th scope="col" className="w-16 p-3 text-left font-semibold">Dia</th>
                      <th scope="col" className="w-28 p-3 text-left font-semibold">Semana</th>
                      <th scope="col" className="p-3 text-left font-semibold">Mecânico</th>
                      <th scope="col" className="p-3 text-left font-semibold">Auxiliar de mecânica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasDaGrade.map((dia) => (
                      <tr
                        key={dia.data}
                        className={`border-t border-slate-200 dark:border-slate-800 ${
                          dia.fimDeSemana
                            ? "bg-orange-100/80 dark:bg-orange-950/40"
                            : isDark
                              ? "bg-slate-900"
                              : "bg-white"
                        }`}
                      >
                        <td className={`p-3 font-semibold ${titleText}`}>{dia.dia}</td>
                        <td className={`p-3 ${titleText}`}>{dia.semana}</td>
                        <td className="p-3">
                          <ParticipanteSelect
                            value={gradeEscala[dia.data]?.mecanico ?? ""}
                            funcionarios={funcionarios}
                            inputBg={inputBg}
                            label="Mecânico"
                            onChange={(value) => atualizarGradeDia(dia.data, "mecanico", value)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="grid gap-2">
                            <ParticipanteSelect
                              value={gradeEscala[dia.data]?.auxiliares[0] ?? ""}
                              funcionarios={funcionarios}
                              inputBg={inputBg}
                              label="Auxiliar principal"
                              onChange={(value) => atualizarGradeDia(dia.data, "auxiliar_1", value)}
                            />
                            <ParticipanteSelect
                              value={gradeEscala[dia.data]?.auxiliares[1] ?? ""}
                              funcionarios={funcionarios}
                              inputBg={inputBg}
                              label="Auxiliar extra"
                              onChange={(value) => atualizarGradeDia(dia.data, "auxiliar_2", value)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 xl:hidden">
                {diasDaGrade.map((dia) => (
                  <GradeDiaCard
                    key={dia.data}
                    dia={dia}
                    grade={gradeEscala[dia.data] ?? criarGradeDiaVazia()}
                    funcionarios={funcionarios}
                    inputBg={inputBg}
                    cardBg={dia.fimDeSemana ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40" : softCard}
                    titleText={titleText}
                    mutedText={mutedText}
                    onChange={atualizarGradeDia}
                  />
                ))}
              </div>
            </>
          )}
              </section>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nova-escala">
            <AccordionTrigger>
              <TituloSecao
                icone={<Plus className="h-4 w-4" />}
                titulo={editingEscalaId ? "Editar escala pontual" : "Nova escala pontual"}
                descricao="Cadastro manual para plantao fora da grade mensal"
              />
            </AccordionTrigger>
            <AccordionContent>
              <form
                ref={escalaFormRef}
                onSubmit={handleSalvarEscala}
                className={`scroll-mt-24 rounded-2xl border p-4 sm:p-5 ${softCard}`}
              >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={`text-lg font-semibold ${titleText}`}>
              {editingEscalaId ? "Editar escala" : "Nova escala"}
            </h3>
            <button
              type="button"
              onClick={resetEscalaForm}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${secondaryButton}`}
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Participante" titleText={titleText}>
              <select
                value={escalaForm.participante}
                onChange={(event) => setEscalaForm((prev) => ({ ...prev, participante: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              >
                <option value="">Selecione</option>
                {funcionarios.map((funcionario) => (
                  <option
                    key={`${funcionario.tipo_vinculo}:${funcionario.id}`}
                    value={`${funcionario.tipo_vinculo}:${funcionario.id}`}
                  >
                    {funcionario.name} ({funcionario.funcao})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Função na escala" titleText={titleText}>
              <select
                value={escalaForm.funcao_escala}
                onChange={(event) =>
                  setEscalaForm((prev) => ({
                    ...prev,
                    funcao_escala: event.target.value as EscalaPlantao["funcao_escala"],
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="mecanico">Mecânico</option>
                <option value="auxiliar_mecanica">Auxiliar de mecânica</option>
                <option value="outro">Outro</option>
              </select>
            </Field>

            <Field label="Descrição" titleText={titleText}>
              <input
                value={escalaForm.descricao}
                onChange={(event) => setEscalaForm((prev) => ({ ...prev, descricao: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </Field>

            <Field label="Início" titleText={titleText}>
              <input
                type="datetime-local"
                value={escalaForm.data_inicio}
                onChange={(event) => setEscalaForm((prev) => ({ ...prev, data_inicio: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </Field>

            <Field label="Fim" titleText={titleText}>
              <input
                type="datetime-local"
                value={escalaForm.data_fim}
                onChange={(event) => setEscalaForm((prev) => ({ ...prev, data_fim: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <Field label="Observação" titleText={titleText}>
              <input
                value={escalaForm.observacao}
                onChange={(event) => setEscalaForm((prev) => ({ ...prev, observacao: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </Field>

            <Toggle
              label="Ativa"
              checked={escalaForm.ativo}
              onChange={(checked) => setEscalaForm((prev) => ({ ...prev, ativo: checked }))}
              titleText={titleText}
            />
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButton}`}
            >
              <Plus className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar escala"}
            </button>
          </div>
              </form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="escalas">
            <AccordionTrigger>
              <TituloSecao
                icone={<ListChecks className="h-4 w-4" />}
                titulo="Escalas cadastradas"
                descricao={`${escalas.length} registro${escalas.length === 1 ? "" : "s"} no filtro atual`}
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3">
          {loading ? (
            <EmptyState text="Carregando escalas..." className={softCard} mutedText={mutedText} />
          ) : escalas.length === 0 ? (
            <EmptyState text="Nenhuma escala cadastrada para o filtro atual." className={softCard} mutedText={mutedText} />
          ) : (
            escalas.map((item) => (
              <EscalaCard
                key={item.id}
                item={item}
                cardBg={softCard}
                titleText={titleText}
                mutedText={mutedText}
                secondaryButton={secondaryButton}
                dangerButton={dangerButton}
                onEdit={() => editarEscala(item)}
                onDelete={() => void excluirEscala(item.id)}
              />
            ))
          )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </AdminShell>
  );
}

const MESES = [
  ["01", "Janeiro"],
  ["02", "Fevereiro"],
  ["03", "Março"],
  ["04", "Abril"],
  ["05", "Maio"],
  ["06", "Junho"],
  ["07", "Julho"],
  ["08", "Agosto"],
  ["09", "Setembro"],
  ["10", "Outubro"],
  ["11", "Novembro"],
  ["12", "Dezembro"],
] as const;

type DiaGradeMensal = {
  data: string;
  dia: string;
  semana: string;
  fimDeSemana: boolean;
};

function TituloSecao({
  descricao,
  icone,
  titulo,
}: {
  descricao: string;
  icone: ReactNode;
  titulo: string;
}) {
  return (
    <span className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-[var(--primary)]">
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-semibold text-[var(--text-main)]">
          {titulo}
        </span>
        <span className="app-muted mt-1 block break-words text-xs font-normal leading-5">
          {descricao}
        </span>
      </span>
    </span>
  );
}

function Field({
  children,
  className = "",
  label,
  titleText,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  titleText: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={`mb-2 block text-sm font-medium ${titleText}`}>{label}</span>
      {children}
    </label>
  );
}

function ParticipanteSelect({
  funcionarios,
  inputBg,
  label,
  onChange,
  value,
}: {
  funcionarios: FuncionarioDisponivel[];
  inputBg: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full min-w-0 rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
    >
      <option value="">Sem escala</option>
      {funcionarios.map((funcionario) => (
        <option
          key={`${funcionario.tipo_vinculo}:${funcionario.id}`}
          value={`${funcionario.tipo_vinculo}:${funcionario.id}`}
        >
          {funcionario.name} ({funcionario.funcao})
        </option>
      ))}
    </select>
  );
}

function GradeDiaCard({
  cardBg,
  dia,
  funcionarios,
  grade,
  inputBg,
  mutedText,
  onChange,
  titleText,
}: {
  cardBg: string;
  dia: DiaGradeMensal;
  funcionarios: FuncionarioDisponivel[];
  grade: GradeEscalaDia;
  inputBg: string;
  mutedText: string;
  onChange: (
    data: string,
    campo: "mecanico" | "auxiliar_1" | "auxiliar_2",
    value: string
  ) => void;
  titleText: string;
}) {
  return (
    <article className={`rounded-3xl border p-4 ${cardBg}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className={`text-base font-semibold ${titleText}`}>Dia {dia.dia}</h4>
          <p className={`text-sm ${mutedText}`}>{dia.semana}</p>
        </div>
        {dia.fimDeSemana ? <Badge text="Fim de semana" /> : null}
      </div>

      <div className="grid gap-3">
        <Field label="Mecânico" titleText={titleText}>
          <ParticipanteSelect
            value={grade.mecanico}
            funcionarios={funcionarios}
            inputBg={inputBg}
            label={`Mecânico do dia ${dia.dia}`}
            onChange={(value) => onChange(dia.data, "mecanico", value)}
          />
        </Field>

        <Field label="Auxiliar principal" titleText={titleText}>
          <ParticipanteSelect
            value={grade.auxiliares[0]}
            funcionarios={funcionarios}
            inputBg={inputBg}
            label={`Auxiliar principal do dia ${dia.dia}`}
            onChange={(value) => onChange(dia.data, "auxiliar_1", value)}
          />
        </Field>

        <Field label="Auxiliar extra" titleText={titleText}>
          <ParticipanteSelect
            value={grade.auxiliares[1]}
            funcionarios={funcionarios}
            inputBg={inputBg}
            label={`Auxiliar extra do dia ${dia.dia}`}
            onChange={(value) => onChange(dia.data, "auxiliar_2", value)}
          />
        </Field>
      </div>
    </article>
  );
}

function Toggle({
  checked,
  label,
  onChange,
  titleText,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  titleText: string;
}) {
  return (
    <label className={`flex min-h-12 items-center gap-3 rounded-2xl px-2 ${titleText}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function Alert({
  isDark,
  message,
  type,
}: {
  isDark: boolean;
  message: string;
  type: "error" | "success";
}) {
  const className =
    type === "error"
      ? isDark
        ? "border-red-900 bg-red-950 text-red-300"
        : "border-red-200 bg-red-50 text-red-700"
      : isDark
        ? "border-emerald-900 bg-emerald-950 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${className}`} role={type === "error" ? "alert" : "status"}>
      {message}
    </div>
  );
}

function EmptyState({
  className,
  mutedText,
  text,
}: {
  className: string;
  mutedText: string;
  text: string;
}) {
  return <div className={`rounded-3xl border p-6 text-center text-sm ${className} ${mutedText}`}>{text}</div>;
}

function DataCalendarioCard({
  cardBg,
  dangerButton,
  item,
  mutedText,
  onDelete,
  onEdit,
  secondaryButton,
  titleText,
}: {
  cardBg: string;
  dangerButton: string;
  item: DataCalendarioCorporativo;
  mutedText: string;
  onDelete: () => void;
  onEdit: () => void;
  secondaryButton: string;
  titleText: string;
}) {
  return (
    <article className={`min-w-0 rounded-3xl border p-4 ${cardBg}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`min-w-0 break-words text-base font-semibold ${titleText}`}>{item.nome}</h3>
            <Badge text={item.tipo === "feriado" ? "Feriado" : "Ponto facultativo"} />
            <Badge text={item.ativo ? "Ativo" : "Inativo"} tone={item.ativo ? "success" : "neutral"} />
          </div>
          <p className={`mt-2 break-words text-sm ${mutedText}`}>
            {formatDate(item.data)} | {escopoLabel(item.escopo)}
            {item.estado ? ` | ${item.estado}` : ""}
            {item.municipio ? ` | ${item.municipio}` : ""} | Adicional {item.percentual_hora_extra}%
          </p>
          {item.observacao ? <p className={`mt-1 break-words text-sm ${mutedText}`}>{item.observacao}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onEdit}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${secondaryButton}`}
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${dangerButton}`}
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}

function EscalaCard({
  cardBg,
  dangerButton,
  item,
  mutedText,
  onDelete,
  onEdit,
  secondaryButton,
  titleText,
}: {
  cardBg: string;
  dangerButton: string;
  item: EscalaPlantao;
  mutedText: string;
  onDelete: () => void;
  onEdit: () => void;
  secondaryButton: string;
  titleText: string;
}) {
  return (
    <article className={`min-w-0 rounded-3xl border p-4 ${cardBg}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`min-w-0 break-words text-base font-semibold ${titleText}`}>{item.participante_nome}</h3>
            <Badge text={funcaoEscalaLabel(item.funcao_escala)} />
            <Badge text={item.ativo ? "Ativa" : "Inativa"} tone={item.ativo ? "success" : "neutral"} />
          </div>
          <p className={`mt-2 break-words text-sm ${mutedText}`}>{item.descricao}</p>
          <p className={`mt-1 break-words text-sm ${mutedText}`}>
            {formatDateTime(item.data_inicio)} até {formatDateTime(item.data_fim)}
          </p>
          {item.observacao ? <p className={`mt-1 break-words text-sm ${mutedText}`}>{item.observacao}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onEdit}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${secondaryButton}`}
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition sm:w-auto ${dangerButton}`}
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}

function Badge({ text, tone = "info" }: { text: string; tone?: "info" | "success" | "neutral" }) {
  const classes = {
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[tone]}`}>{text}</span>;
}

function escopoLabel(escopo: DataCalendarioCorporativo["escopo"]) {
  return {
    nacional: "Nacional",
    estadual: "Estadual",
    municipal: "Municipal",
    interno: "Interno",
  }[escopo];
}

function funcaoEscalaLabel(funcao: EscalaPlantao["funcao_escala"]) {
  return {
    mecanico: "Mecânico",
    auxiliar_mecanica: "Auxiliar de mecânica",
    outro: "Outro",
  }[funcao] ?? "Mecânico";
}

function criarGradeDiaVazia(): GradeEscalaDia {
  return {
    mecanico: "",
    auxiliares: ["", ""],
  };
}

function participanteValue(escala: EscalaPlantao) {
  return `${escala.tipo_vinculo}:${escala.participante_id}`;
}

function montarDiasDoMes(ano: string, mes: string): DiaGradeMensal[] {
  const anoNumero = Number(ano);
  const mesNumero = Number(mes);

  if (!anoNumero || !mesNumero) {
    return [];
  }

  const totalDias = new Date(anoNumero, mesNumero, 0).getDate();
  const dias: DiaGradeMensal[] = [];

  for (let dia = 1; dia <= totalDias; dia += 1) {
    const data = `${ano}-${String(mesNumero).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const dataLocal = new Date(`${data}T00:00:00`);
    const semana = dataLocal.toLocaleDateString("pt-BR", { weekday: "long" });

    dias.push({
      data,
      dia: String(dia).padStart(2, "0"),
      semana: semana.charAt(0).toUpperCase() + semana.slice(1),
      fimDeSemana: [0, 6].includes(dataLocal.getDay()),
    });
  }

  return dias;
}

function agruparEscalasMensais(escalas: EscalaPlantao[]) {
  const grupos = new Map<string, EscalaPlantao[]>();

  for (const escala of escalas) {
    if (escala.funcao_escala !== "mecanico" && escala.funcao_escala !== "auxiliar_mecanica") {
      continue;
    }

    const data = escala.data_inicio.slice(0, 10);
    const chave = `${data}|${escala.funcao_escala}`;
    const grupo = grupos.get(chave) ?? [];

    grupo.push(escala);
    grupos.set(chave, grupo);
  }

  for (const [chave, grupo] of grupos.entries()) {
    grupos.set(
      chave,
      grupo.sort((a, b) => a.participante_nome.localeCompare(b.participante_nome))
    );
  }

  return grupos;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function toDatetimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
