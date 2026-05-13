import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/form";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(auth)/forgot-password/actions", () => ({
  resetPassword: vi.fn(),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders the reset-request form with email field and submit button", () => {
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /reset password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("displays an error message from the URL search params", () => {
    searchParamsHolder.params = new URLSearchParams("error=Rate+limit+reached");
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/rate limit reached/i)).toBeInTheDocument();
  });

  it("displays the generic success message regardless of email validity", () => {
    searchParamsHolder.params = new URLSearchParams(
      "message=If+an+account+exists+for+that+email%2C+a+reset+link+has+been+sent.",
    );
    render(<ForgotPasswordForm />);
    expect(
      screen.getByText(/if an account exists for that email/i),
    ).toBeInTheDocument();
  });
});
