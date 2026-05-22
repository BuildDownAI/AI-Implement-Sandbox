import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/form";

type State = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

const actionStateHolder = vi.hoisted(() => ({
  state: {} as State,
  pending: false,
}));

const formStatusHolder = vi.hoisted(() => ({
  pending: false,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: () => [
      actionStateHolder.state,
      vi.fn(),
      actionStateHolder.pending,
    ],
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormStatus: () => ({ pending: formStatusHolder.pending }),
  };
});

vi.mock("@/app/(auth)/reset-password/actions", () => ({
  updatePassword: vi.fn(),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
  });

  it("renders the heading, both password fields, and submit button", () => {
    render(<ResetPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /set a new password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("renders a FieldError under password when state.fieldErrors.password is set", () => {
    actionStateHolder.state = {
      fieldErrors: { password: "Password must be at least 8 characters" },
    };
    render(<ResetPasswordForm />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/password must be at least 8 characters/i);
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Session expired" };
    render(<ResetPasswordForm />);
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    // No per-field alert — only the form-level <p> banner.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the submit button and shows a FieldError when passwords don't match", () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: "different" },
    });
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/passwords don'?t match/i),
    ).toBeInTheDocument();
  });

  it("does not show the mismatch FieldError while confirm is still empty", () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    expect(
      screen.queryByText(/passwords don'?t match/i),
    ).not.toBeInTheDocument();
  });

  it("enables the submit button when passwords match", () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: "abcdefgh" },
    });
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).not.toBeDisabled();
  });

  it("shows the pending label and disables submit while pending", () => {
    formStatusHolder.pending = true;
    render(<ResetPasswordForm />);
    const button = screen.getByRole("button", { name: /updating/i });
    expect(button).toBeDisabled();
  });
});
