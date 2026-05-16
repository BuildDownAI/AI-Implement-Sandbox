import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordForm } from "@/app/(app)/profile/password-form";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(app)/profile/actions", () => ({
  updatePassword: vi.fn(),
}));

describe("PasswordForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders new password and confirm password fields", () => {
    render(<PasswordForm />);
    // Anchor with ^...$ — both labels contain "new password" as a substring,
    // so a loose regex would match both and getByLabelText would throw.
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm new password$/i)).toBeInTheDocument();
  });

  it("password fields enforce the 8-character minimum", () => {
    render(<PasswordForm />);
    expect(screen.getByLabelText(/^new password$/i)).toHaveAttribute(
      "minlength",
      "8",
    );
    expect(screen.getByLabelText(/^confirm new password$/i)).toHaveAttribute(
      "minlength",
      "8",
    );
  });

  it("renders the Update password submit button", () => {
    render(<PasswordForm />);
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("describes the length requirement", () => {
    render(<PasswordForm />);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("displays an error message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Password+must+be+at+least+8+characters",
    );
    render(<PasswordForm />);
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it("displays a success message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams("message=Password+updated");
    render(<PasswordForm />);
    expect(screen.getByText(/password updated/i)).toBeInTheDocument();
  });
});
