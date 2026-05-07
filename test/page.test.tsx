import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

describe("Home page", () => {
  it("renders the Hello World heading", () => {
    render(<Page />);
    expect(
      screen.getByRole("heading", { name: /hello world/i }),
    ).toBeInTheDocument();
  });

  it("mentions AI-Implement", () => {
    render(<Page />);
    expect(screen.getByText(/AI-Implement/i)).toBeInTheDocument();
  });

  it("renders the theme toggle button", () => {
    render(<Page />);
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
  });
});
