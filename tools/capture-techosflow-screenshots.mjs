import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.TECHOS_BASE_URL ?? "https://www.techosflow.com.br";
const API_BASE_URL =
  process.env.TECHOS_API_BASE_URL ?? "https://techosflow-production.up.railway.app/api/v1";
const OUT_DIR = process.env.TECHOS_PRINT_DIR ?? "prints-techosflow";
const CDP_URL = process.env.TECHOS_CDP_URL ?? "http://127.0.0.1:9223";

const users = {
  admin: {
    email: process.env.TECHOS_ADMIN_EMAIL,
    password: process.env.TECHOS_ADMIN_PASSWORD,
  },
  atendente: {
    email: process.env.TECHOS_ATENDENTE_EMAIL,
    password: process.env.TECHOS_ATENDENTE_PASSWORD,
  },
  tecnico: {
    email: process.env.TECHOS_TECNICO_EMAIL,
    password: process.env.TECHOS_TECNICO_PASSWORD,
  },
};

const desktop = { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  async navigate(url) {
    const loaded = this.waitEvent("Page.loadEventFired", 20000).catch(() => null);
    await this.send("Page.navigate", { url });
    await loaded;
    await this.waitReady();
  }

  async waitReady() {
    for (let index = 0; index < 80; index += 1) {
      const ready = await this.evaluate("document.readyState === 'complete'");
      if (ready) break;
      await delay(250);
    }
    await delay(1500);
  }

  async setViewport(viewport) {
    await this.send("Emulation.setDeviceMetricsOverride", viewport);
  }

  async screenshot(fileName) {
    await this.waitReady();
    const result = await this.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const filePath = path.join(OUT_DIR, fileName);
    await fs.writeFile(filePath, Buffer.from(result.data, "base64"));
    console.log(filePath);
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
  return page;
}

async function clearSession(page) {
  await page.navigate(`${BASE_URL}/login`);
  await page.evaluate(`localStorage.clear(); sessionStorage.clear(); true;`);
}

async function login(page, credentials) {
  if (!credentials.email || !credentials.password) {
    throw new Error("Credenciais ausentes.");
  }

  await clearSession(page);
  const loginResult = await page.evaluate(`
    (() => {
      const email = ${JSON.stringify(credentials.email)};
      const password = ${JSON.stringify(credentials.password)};
      return fetch(${JSON.stringify(API_BASE_URL)} + '/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            return { ok: false, status: response.status, message: data.message || 'login failed' };
          }

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.token_expires_at) {
            localStorage.setItem('token_expires_at', data.token_expires_at);
          } else {
            localStorage.removeItem('token_expires_at');
          }
          localStorage.setItem('session_validated_at', String(Date.now()));
          window.dispatchEvent(new Event('techosflow:session-changed'));

          const route = data.user?.role === 'tecnico' ? '/tecnico' : '/';
          return { ok: true, route };
        });
    })()
  `);

  if (!loginResult?.ok) {
    throw new Error(`Login falhou: ${loginResult?.status ?? "sem status"} ${loginResult?.message ?? ""}`);
  }

  await page.navigate(`${BASE_URL}${loginResult.route}`);
  await delay(2500);
}

async function clickVisibleButton(page, text) {
  await page.evaluate(`
    (() => {
      const wanted = ${JSON.stringify(text)}.toLowerCase();
      const buttons = [...document.querySelectorAll('button, a')].filter((item) => {
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (item.textContent || '').toLowerCase().includes(wanted);
      });
      buttons[0]?.click();
      return buttons.length;
    })()
  `);
  await delay(1400);
}

async function captureStaticScreens(page) {
  await page.setViewport(desktop);
  await page.navigate(`${BASE_URL}/login`);
  await page.screenshot("01-login-desktop.png");

  await page.navigate(`${BASE_URL}/esqueci-senha`);
  await page.screenshot("02-esqueci-senha-desktop.png");
}

async function captureAdmin(page) {
  await page.setViewport(desktop);
  await login(page, users.admin);
  await page.screenshot("03-admin-dashboard-desktop.png");

  await page.navigate(`${BASE_URL}/ordens-servico`);
  await page.screenshot("04-admin-consultar-os-desktop.png");

  await page.navigate(`${BASE_URL}/admin/relatorios`);
  await page.screenshot("05-admin-relatorios-desktop.png");

  await page.navigate(`${BASE_URL}/admin/horas-extras`);
  await page.screenshot("06-admin-horas-extras-desktop.png");

  await page.navigate(`${BASE_URL}/admin/usuarios`);
  await page.screenshot("07-admin-usuarios-desktop.png");

  await page.setViewport(mobile);
  await page.navigate(`${BASE_URL}/`);
  await page.screenshot("08-admin-dashboard-mobile.png");
}

async function captureAtendente(page) {
  await page.setViewport(desktop);
  await login(page, users.atendente);
  await page.screenshot("09-atendente-dashboard-desktop.png");

  await clickVisibleButton(page, "Criar OS");
  await page.screenshot("10-atendente-criar-os-desktop.png");

  await page.setViewport(mobile);
  await page.navigate(`${BASE_URL}/`);
  await page.screenshot("11-atendente-dashboard-mobile.png");

  await clickVisibleButton(page, "Criar OS");
  await page.screenshot("12-atendente-criar-os-mobile.png");
}

async function captureTecnico(page) {
  await page.setViewport(desktop);
  await login(page, users.tecnico);
  await page.screenshot("13-tecnico-dashboard-desktop.png");

  await clickVisibleButton(page, "Criar OS");
  await page.screenshot("14-tecnico-criar-os-desktop.png");

  await page.setViewport(mobile);
  await page.navigate(`${BASE_URL}/tecnico`);
  await page.screenshot("15-tecnico-dashboard-mobile.png");

  await clickVisibleButton(page, "Criar OS");
  await page.screenshot("16-tecnico-criar-os-mobile.png");
}

await fs.mkdir(OUT_DIR, { recursive: true });
const page = await createPage();

try {
  await captureStaticScreens(page);
  await captureAdmin(page);
  await captureAtendente(page);
  await captureTecnico(page);
} finally {
  await page.close();
}
