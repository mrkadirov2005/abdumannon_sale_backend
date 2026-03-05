import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

vi.mock("../routes/AppRoutes", () => ({
  default: () => <div data-testid="app-routes">Routes</div>,
}));

const setNavigatorOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
};

afterEach(() => {
  setNavigatorOnline(true);
  vi.restoreAllMocks();
});

describe("App", () => {
  it("shows an offline indicator when the browser is offline", () => {
    setNavigatorOnline(false);

    render(<App />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-routes")).toBeInTheDocument();
  });

  it("alerts the user on click when offline", () => {
    setNavigatorOnline(false);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<App />);

    fireEvent.click(window);

    expect(alertSpy).toHaveBeenCalledWith(
      "You are offline. Please connect to the network."
    );
  });
});
