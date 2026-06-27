import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.TECHOS_BASE_URL ?? "http://localhost:5173";
const API_BASE_URL = process.env.TECHOS_API_BASE_URL ?? `${BASE_URL}/api/v1`;
const OUT_DIR = process.env.TECHOS_PRINT_DIR ?? "prints-checklist-local";
const CDP_URL = process.env.TECHOS_CDP_URL ?? "http://127.0.0.1:9223";

const credentials = {
  admin: {
    email: process.env.TECHOS_ADMIN_EMAIL ?? "admin@teste.com",
    password: process.env.TECHOS_ADMIN_PASSWORD ?? "123456",
  },
  atendente: {
    email: process.env.TECHOS_ATENDENTE_EMAIL ?? "atendente@teste.com",
    password: process.env.TECHOS_ATENDENTE_PASSWORD ?? "123456",
  },
  tecnico: {
    email: process.env.TECHOS_TECNICO_EMAIL ?? "tecnico@teste.com",
    password: process.env.TECHOS_TECNICO_PASSWORD ?? "123456",
  },
};

const desktop = { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isoAt(hoursOffset = 0) {
  const date = new Date();
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
}

function fileName(index, label, ext = "png") {
  return `${String(index).padStart(2, "0")}-${label}.${ext}`;
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });

    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }

      if (message.method && this.events.has(message.method)) {
        for (const resolve of this.events.get(message.method)) {
          resolve(message.params ?? {});
        }
        this.events.delete(message.method);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  waitEvent(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const list = this.events.get(method) ?? [];
      list.push(resolve);
      this.events.set(method, list);
      setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeout);
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Runtime exception");
    }

    return result.result?.value;
  }

  async navigate(url, waitMs = 1500) {
    const loaded = this.waitEvent("Page.loadEventFired", 20000).catch(() => null);
    await this.send("Page.navigate", { url });
    await loaded;
    await this.waitReady(waitMs);
  }

  async waitReady(waitMs = 1000) {
    for (let index = 0; index < 80; index += 1) {
      const ready = await this.evaluate("document.readyState === 'complete'");
      if (ready) break;
      await delay(250);
    }
    await delay(waitMs);
  }

  async setViewport(viewport) {
    await this.send("Emulation.setDeviceMetricsOverride", viewport);
  }

  async screenshot(name) {
    await this.waitReady(600);
    const result = await this.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const target = path.join(OUT_DIR, name);
    await fs.writeFile(target, Buffer.from(result.data, "base64"));
    console.log(target);
  }

  async close() {
    this.ws.close();
  }
}

async function createPage() {
  const target = await fetch(`${CDP_URL}/json/new?about:blank`, { method: "PUT" }).then((r) =>
    r.json()
  );
  const page = new CdpPage(target.webSocketDebuggerUrl);
  await page.open();
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Browser.grantPermissions", {
    origin: BASE_URL,
    permissions: ["geolocation"],
  }).catch(() => null);
  await page.send("Emulation.setGeolocationOverride", {
    latitude: -9.97499,
    longitude: -67.8243,
    accuracy: 18,
  }).catch(() => null);
  return page;
}

async function setSession(page, loginResult) {
  await page.navigate(`${BASE_URL}/login`, 500);
  await page.evaluate(`
    (() => {
      localStorage.clear();
      sessionStorage.clear();
      const data = ${JSON.stringify(loginResult)};
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token_expires_at) {
        localStorage.setItem('token_expires_at', data.token_expires_at);
      }
      localStorage.setItem('session_validated_at', String(Date.now()));
      window.dispatchEvent(new Event('techosflow:session-changed'));
      return true;
    })()
  `);
}

async function apiLogin(user) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Login API falhou para ${user.email}: ${response.status} ${data.message ?? ""}`);
  }
  return data;
}

async function apiRequest(token, method, route, body, extraHeaders = {}) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };

  const options = { method, headers };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${route}`, options);
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const errorBody = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");
    throw new Error(
      `API ${method} ${route} falhou: ${response.status} ${JSON.stringify(errorBody)}`
    );
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    blob: await response.arrayBuffer(),
    contentType,
    fileName:
      response.headers
        .get("content-disposition")
        ?.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ?? null,
  };
}

async function loginUi(page, loginResult, route = "/") {
  await setSession(page, loginResult);
  await page.navigate(`${BASE_URL}${route}`, 1700);
}

async function typeValue(page, selector, value) {
  await page.evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const proto = Object.getPrototypeOf(el);
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor?.set) descriptor.set.call(el, ${JSON.stringify(value)});
      else el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
}

async function clickByText(page, text) {
  await page.evaluate(`
    (() => {
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase();
      const wanted = normalize(${JSON.stringify(text)});
      const items = [...document.querySelectorAll('button, a, [role="button"], option')].filter((item) => {
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && normalize(item.textContent).includes(wanted);
      });
      items[0]?.click();
      return items.length;
    })()
  `);
  await delay(1300);
}

async function clickFirst(page, selector) {
  await page.evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      el?.click();
      return !!el;
    })()
  `);
  await delay(800);
}

async function selectValue(page, selector, value) {
  await typeValue(page, selector, value);
}

async function scrollToTop(page) {
  await page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' }); true;");
  await delay(600);
}

async function scrollToBottom(page) {
  await page.evaluate("window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); true;");
  await delay(600);
}

async function scrollToText(page, text) {
  await page.evaluate(`
    (() => {
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase();
      const wanted = normalize(${JSON.stringify(text)});
      const elements = [...document.querySelectorAll('h1,h2,h3,p,div,section,label,button')];
      const el = elements.find((item) => normalize(item.textContent).includes(wanted));
      el?.scrollIntoView({ block: 'center', behavior: 'instant' });
      return !!el;
    })()
  `);
  await delay(700);
}

async function fillGeneralOsForm(page, suffix) {
  await selectValue(page, "#tipoServico", "manutencao");
  await selectValue(page, "#prioridade", "2");
  await typeValue(page, "#nomeCliente", `Cliente Checklist ${suffix}`);
  await typeValue(page, "#descricao", `OS geral criada para checklist ${suffix}.`);
  await typeValue(page, "#logradouro", "Rua Checklist");
  await typeValue(page, "#numero", "123");
  await typeValue(page, "#complemento", "Casa");
  await typeValue(page, "#bairro", "Centro");
  await typeValue(page, "#cidade", "Rio Branco");
  await typeValue(page, "#estado", "AC");
  await typeValue(page, "#cep", "69900000");
}

async function fillEtaForm(page, suffix) {
  await selectValue(page, "#eta-prioridade", "2");
  await clickFirst(page, 'input[name="unidade"][value="ETE"]');
  await typeValue(page, "#eta-local", `ETE Checklist ${suffix}`);
  await typeValue(page, "#eta-setor-requisitante", "Operacao");
  await typeValue(page, "#eta-encarregado", "Encarregado Teste");
  await clickFirst(page, 'input[name="tipo_manutencao"][value="corretiva"]');
  await typeValue(page, "#eta-servico", "Teste de criacao de OS ETA/ETE para checklist.");
  await typeValue(page, "#eta-equipamento", "Bomba de recalque");
  await typeValue(page, "#eta-diagnostico", "Diagnostico inicial de teste.");
  await typeValue(page, "#eta-procedimento", "Procedimento planejado de teste.");
  await typeValue(page, "#eta-material-utilizado", "Sem material aplicado no teste.");
}

function generalOsPayload(label) {
  return {
    data_abertura: isoAt(-3),
    tipo_servico: "manutencao",
    nome_cliente: `Cliente Checklist ${label}`,
    prioridade: 2,
    descricao: `OS de checklist ${label}.`,
    endereco: {
      logradouro: "Rua Checklist",
      numero: "123",
      complemento: "Casa",
      bairro: "Centro",
      cidade: "Rio Branco",
      estado: "AC",
      cep: "69900000",
    },
  };
}

function etaOsPayload(label) {
  return {
    data_abertura: isoAt(-3),
    tipo_servico: "Manutencao ETA/ETE",
    nome_cliente: `ETE Checklist ${label}`,
    prioridade: 2,
    descricao: [
      "Unidade: ETE",
      `Local operacional: ETE Checklist ${label}`,
      "Setor requisitante: Operacao",
      "Encarregado: Encarregado Teste",
      "Tipo de manutencao: Corretiva",
      "Servico: Checklist de criacao ETA/ETE.",
      "Equipamento: Bomba de recalque",
    ].join("\n"),
    endereco: {
      logradouro: `ETE Checklist ${label}`,
      numero: "SN",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  };
}

async function createPreparedData(tokens, users) {
  const osForAccept = await apiRequest(
    tokens.atendente,
    "POST",
    "/ordens-servico",
    generalOsPayload(`aceitar-${stamp}`)
  );

  const osForNaoExecutada = await apiRequest(
    tokens.atendente,
    "POST",
    "/ordens-servico",
    generalOsPayload(`nao-executada-${stamp}`)
  );
  await apiRequest(tokens.tecnico, "POST", `/ordens-servico/${osForNaoExecutada.id}/aceitar`);

  const osForFinalizacao = await apiRequest(
    tokens.tecnico,
    "POST",
    "/ordens-servico",
    etaOsPayload(`finalizar-${stamp}`)
  );
  const inicio = await apiRequest(tokens.tecnico, "POST", `/ordens-servico/${osForFinalizacao.id}/iniciar`, {
    data_inicio: isoAt(-2),
    observacao: "Inicio para checklist de finalizacao.",
  });

  const osForAnexos = await apiRequest(
    tokens.tecnico,
    "POST",
    "/ordens-servico",
    etaOsPayload(`anexos-${stamp}`)
  );
  const anexosInicio = await apiRequest(tokens.tecnico, "POST", `/ordens-servico/${osForAnexos.id}/iniciar`, {
    data_inicio: isoAt(-4),
    observacao: "Inicio para checklist de anexos.",
  });
  await apiRequest(tokens.tecnico, "POST", `/ordens-servico/${osForAnexos.id}/execucoes/finalizar`, {
    execucao_id: anexosInicio.execucao.id,
    data_fim: isoAt(-1),
    observacao: "Finalizacao para checklist com evidencias.",
    funcionarios: [
      {
        funcionario_id: users.tecnico.id,
        data_inicio: isoAt(-4),
        data_fim: isoAt(-1),
      },
    ],
  });

  await uploadEvidence(tokens.tecnico, osForAnexos.id, "evidencia-uma.png");
  await uploadEvidence(tokens.tecnico, osForAnexos.id, "evidencia-duas-a.png");
  await uploadEvidence(tokens.tecnico, osForAnexos.id, "evidencia-duas-b.png");

  const pdf = await apiRequest(tokens.admin, "GET", `/ordens-servico/${osForAnexos.id}/relatorio/pdf`);
  const pdfPath = path.join(OUT_DIR, fileName(19, "pdf-detalhado-os", "pdf"));
  await fs.writeFile(pdfPath, Buffer.from(pdf.blob));
  console.log(pdfPath);

  return {
    osForAccept,
    osForNaoExecutada,
    osForFinalizacao,
    execucaoForFinalizacao: inicio.execucao,
    osForAnexos,
  };
}

async function uploadEvidence(token, osId, name) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  const form = new FormData();
  form.append("arquivo", new File([png], name, { type: "image/png" }));
  form.append("tipo", "foto");
  form.append("latitude", "-9.97499");
  form.append("longitude", "-67.8243");
  form.append("precisao_metros", "18");
  form.append("geolocalizacao_capturada_em", new Date().toISOString());
  form.append("rua_capturada", "Rua Checklist");
  form.append("bairro_capturado", "Centro");
  form.append("cidade_capturada", "Rio Branco");
  form.append("estado_capturado", "AC");
  form.append("endereco_capturado", "Rua Checklist, Centro, Rio Branco - AC");
  return apiRequest(token, "POST", `/ordens-servico/${osId}/anexos`, form);
}

async function captureLoginAndRecovery(page, logins) {
  await page.setViewport(desktop);
  await page.navigate(`${BASE_URL}/login`);
  await page.screenshot(fileName(1, "login-valido-tela"));

  await typeValue(page, 'input[type="email"]', credentials.admin.email);
  await typeValue(page, 'input[type="password"]', "senha-errada");
  await clickByText(page, "Entrar");
  await page.screenshot(fileName(2, "login-senha-errada"));

  await page.navigate(`${BASE_URL}/esqueci-senha`);
  await typeValue(page, 'input[type="email"]', credentials.admin.email);
  await clickByText(page, "Enviar");
  await page.screenshot(fileName(3, "recuperacao-senha"));

  await loginUi(page, logins.admin, "/");
  await page.screenshot(fileName(4, "dashboard-admin-grafico-status"));
}

async function captureUsuarios(page, logins, tokens) {
  await loginUi(page, logins.admin, "/admin/usuarios");
  await clickByText(page, "Novo usuario");
  await typeValue(page, 'input[type="text"]', `Usuario Checklist ${stamp}`);
  await typeValue(page, 'input[type="email"]', `checklist-${stamp}@teste.com`);
  await selectValue(page, "select", "atendente");
  await page.evaluate(`
    (() => {
      const fields = [...document.querySelectorAll('input[type="password"]')];
      for (const el of fields) {
        const proto = Object.getPrototypeOf(el);
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        setter?.call(el, 'Senha@123456A');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    })()
  `);
  await typeValue(page, 'input[type="number"]', "25");
  await clickByText(page, "Criar usuario");
  await page.waitReady(2200);

  const list = await apiRequest(tokens.admin, "GET", `/usuarios?q=checklist-${stamp}&per_page=1`);
  const created = list.data?.[0];
  if (created?.id) {
    await apiRequest(tokens.admin, "PUT", `/usuarios/${created.id}`, {
      name: `Usuario Checklist Editado ${stamp}`,
      is_active: false,
    });
  }

  await page.navigate(`${BASE_URL}/admin/usuarios`);
  await typeValue(page, 'input[placeholder="Buscar usuários..."], input[placeholder="Buscar usuarios..."]', `checklist-${stamp}`);
  await page.waitReady(1600);
  await page.screenshot(fileName(5, "usuarios-cadastro-edicao-desativacao"));
}

async function captureCreateOs(page, logins) {
  await loginUi(page, logins.atendente, "/ordens-servico/nova");
  await fillGeneralOsForm(page, stamp);
  await page.screenshot(fileName(6, "criar-os-atendente"));

  await loginUi(page, logins.tecnico, "/tecnico");
  await clickByText(page, "Criar OS");
  await page.waitReady(1000);
  await fillEtaForm(page, stamp);
  await page.screenshot(fileName(7, "criar-os-eta-ete-tecnico"));
}

async function captureOsWorkflows(page, logins, tokens, prepared) {
  await loginUi(page, logins.admin, "/ordens-servico");
  await selectValue(page, "select", "aberta");
  await page.waitReady(1200);
  await page.screenshot(fileName(8, "consultar-os-por-status"));

  await loginUi(page, logins.tecnico, `/ordens-servico/${prepared.osForAccept.id}`);
  await scrollToText(page, "Acoes da OS");
  await page.screenshot(fileName(9, "tecnico-aceitar-os-antes"));
  await apiRequest(tokens.tecnico, "POST", `/ordens-servico/${prepared.osForAccept.id}/aceitar`);
  await page.navigate(`${BASE_URL}/ordens-servico/${prepared.osForAccept.id}`, 1800);
  await scrollToTop(page);
  await page.screenshot(fileName(9, "tecnico-aceitar-os-sucesso"));

  await clickByText(page, "Iniciar execucao");
  await page.waitReady(1800);
  await scrollToTop(page);
  await page.screenshot(fileName(10, "tecnico-iniciar-execucao"));

  await loginUi(page, logins.tecnico, `/ordens-servico/${prepared.osForFinalizacao.id}`);
  await scrollToText(page, "Equipe da execucao");
  await page.screenshot(fileName(11, "finalizacao-adicionar-participante-antes"));
  await clickByText(page, "Adicionar participante");
  await page.waitReady(1000);
  await page.screenshot(fileName(11, "finalizacao-adicionar-participante-depois"));

  await page.navigate(`${BASE_URL}/ordens-servico/${prepared.osForFinalizacao.id}`, 1800);
  await scrollToText(page, "Equipe da execucao");
  const date = dateDaysFromNow(1);
  await page.evaluate(`
    (() => {
      const dates = [...document.querySelectorAll('input[type="date"]')].slice(0, 2);
      const times = [...document.querySelectorAll('input[type="time"]')].slice(0, 2);
      dates.forEach((input) => {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
        setter?.call(input, ${JSON.stringify(date)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      times.forEach((input, index) => {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
        setter?.call(input, index === 0 ? '08:00' : '10:00');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return true;
    })()
  `);
  await typeValue(page, 'textarea[aria-label="Observação opcional ao finalizar a execução"]', "Finalizacao correta para checklist.");
  await page.screenshot(fileName(12, "finalizar-os-data-fim-correta"));
  await clickByText(page, "Finalizar execucao");
  await page.waitReady(2500);
  await scrollToTop(page);
  await page.screenshot(fileName(13, "mensagem-sucesso-finalizar-os"));

  await loginUi(page, logins.tecnico, `/ordens-servico/${prepared.osForNaoExecutada.id}`);
  await scrollToText(page, "Acoes da OS");
  await typeValue(page, 'textarea[aria-label="Motivo pelo qual a ordem de serviço não foi executada"]', "Local indisponivel para acesso no teste de checklist.");
  await page.screenshot(fileName(14, "marcar-os-nao-executada-form"));
  await clickByText(page, "Marcar como nao executada");
  await page.waitReady(2000);
  await scrollToTop(page);
  await page.screenshot(fileName(14, "marcar-os-nao-executada-sucesso"));
}

async function captureEvidenceAndReports(page, logins, prepared, tokens) {
  await loginUi(page, logins.tecnico, `/ordens-servico/${prepared.osForAnexos.id}`);
  await scrollToText(page, "Nova evidencia");
  await page.screenshot(fileName(15, "enviar-evidencia-foto"));
  await scrollToText(page, "Anexos");
  await page.screenshot(fileName(16, "enviar-varias-fotos"));

  await page.setViewport(mobile);
  await page.navigate(`${BASE_URL}/ordens-servico/${prepared.osForAnexos.id}`, 1800);
  await scrollToText(page, "Geolocalizacao da evidencia");
  await page.screenshot(fileName(17, "geolocalizacao-celular"));

  await page.setViewport(desktop);
  await page.navigate(`${BASE_URL}/ordens-servico/${prepared.osForAnexos.id}`, 1800);
  await scrollToText(page, "Anexos");
  await page.screenshot(fileName(18, "anexos-fotos-detalhes-os"));

  await loginUi(page, logins.admin, `/ordens-servico/${prepared.osForAnexos.id}`);
  await scrollToTop(page);
  await page.screenshot(fileName(19, "pdf-detalhado-os-botao"));

  await page.navigate(`${BASE_URL}/admin/relatorios`, 1800);
  await clickByText(page, "Gerar relatorio");
  await page.waitReady(2000);
  await scrollToText(page, "Data de emissao");
  await page.screenshot(fileName(20, "relatorio-administrativo"));
  await scrollToText(page, "Exportar");
  await page.screenshot(fileName(21, "exportar-relatorio-csv-xlsx-pdf"));

  for (const format of ["csv", "xlsx", "pdf"]) {
    try {
      const exported = await apiRequest(tokens.admin, "GET", `/relatorios/ordens-servico/exportar/${format}`);
      const exportedPath = path.join(OUT_DIR, fileName(21, `relatorio-administrativo-${format}`, format));
      await fs.writeFile(exportedPath, Buffer.from(exported.blob));
      console.log(exportedPath);
    } catch (error) {
      await fs
        .rm(path.join(OUT_DIR, fileName(21, `relatorio-administrativo-${format}`, format)), {
          force: true,
        })
        .catch(() => null);
      const errorPath = path.join(OUT_DIR, fileName(21, `relatorio-administrativo-${format}-erro`, "txt"));
      await fs.writeFile(errorPath, String(error.message ?? error));
      console.log(errorPath);
    }
  }

  await page.navigate(`${BASE_URL}/admin/horas-extras`, 1800);
  await clickByText(page, "Aplicar filtros");
  await page.waitReady(1800);
  await page.screenshot(fileName(22, "relatorio-horas-extras"));
  await scrollToText(page, "50");
  await page.screenshot(fileName(23, "validar-hora-extra-50-100-banco"));

  await loginUi(page, logins.atendente, "/admin/usuarios");
  await page.waitReady(1500);
  await page.screenshot(fileName(24, "usuario-sem-permissao-area-restrita"));

  await page.setViewport(mobile);
  await loginUi(page, logins.tecnico, `/ordens-servico/${prepared.osForAnexos.id}`);
  await scrollToText(page, "Anexos");
  await page.screenshot(fileName(25, "celular-detalhes-finalizar-foto"));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  await fetch(`${BASE_URL}/`, { method: "HEAD" }).catch(() => {
    throw new Error(`Frontend local nao respondeu em ${BASE_URL}. Abra o frontend com npm run dev.`);
  });

  await fetch(`${CDP_URL}/json/version`).catch(() => {
    throw new Error(`Chrome CDP nao respondeu em ${CDP_URL}. Abra o Chrome headless com remote debugging.`);
  });

  const logins = {
    admin: await apiLogin(credentials.admin),
    atendente: await apiLogin(credentials.atendente),
    tecnico: await apiLogin(credentials.tecnico),
  };

  const tokens = {
    admin: logins.admin.token,
    atendente: logins.atendente.token,
    tecnico: logins.tecnico.token,
  };

  const users = {
    admin: logins.admin.user,
    atendente: logins.atendente.user,
    tecnico: logins.tecnico.user,
  };

  const prepared = await createPreparedData(tokens, users);
  const page = await createPage();

  try {
    await captureLoginAndRecovery(page, logins);
    await captureUsuarios(page, logins, tokens);
    await captureCreateOs(page, logins);
    await captureOsWorkflows(page, logins, tokens, prepared);
    await captureEvidenceAndReports(page, logins, prepared, tokens);
  } finally {
    await page.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
