import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConnectionStatusBanner } from "./ConnectionStatusBanner";

function setOnlineStatus(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

describe("ConnectionStatusBanner", () => {
  afterEach(() => {
    setOnlineStatus(true);
  });

  it("não aparece quando o aparelho está online", () => {
    setOnlineStatus(true);

    render(<ConnectionStatusBanner />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("avisa quando o aparelho está offline", () => {
    setOnlineStatus(false);

    render(<ConnectionStatusBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sem internet. Exibindo os dados salvos neste aparelho."
    );
  });
});
