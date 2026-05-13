import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/form";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(auth)/reset-password/actions", () => ({
  updatePassword: vi.fn(),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders the new-password form with both password fields and submit button", () => {
    render(<ResetPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /set a new password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("displays an error message from the URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Password+should+be+at+least+6+characters",
    );
    render(<ResetPasswordForm />);
    expect(
      screen.getByText(/password should be at least 6 characters/i),
    ).toBeInTheDocument();
  });
});
