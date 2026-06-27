import { expect, test } from "@playwright/test";

test("login permanece utilizável sem rolagem horizontal", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "TechOS Flow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );

  expect(overflow).toBe(false);
});

test("PWA publica manifesto e registra service worker", async ({ page }) => {
  await page.goto("/login");

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await page.request.get(manifestHref!);
  expect(manifestResponse.ok()).toBe(true);

  const registration = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    const ready = await navigator.serviceWorker.ready;
    return ready.active?.scriptURL ?? null;
  });

  expect(registration).toContain("sw");
});

test("PWA mantém rotas internas disponíveis sem conexão", async ({
  context,
  page,
}) => {
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto("/esqueci-senha");
  await expect(
    page.getByRole("heading", { name: "Recuperar acesso" })
  ).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Recuperar acesso" })
  ).toBeVisible();
  await context.setOffline(false);
});

test("fluxo autenticado do técnico pode ser validado com credenciais protegidas", async ({
  context,
  page,
}) => {
  const email = process.env.E2E_TECH_EMAIL;
  const password = process.env.E2E_TECH_PASSWORD;
  test.skip(!email || !password, "Credenciais E2E não configuradas.");

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/tecnico$/);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/Sem internet/)).toBeVisible();
  await context.setOffline(false);
});
