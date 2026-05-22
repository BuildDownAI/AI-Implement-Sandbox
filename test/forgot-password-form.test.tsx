import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/form";

// Holders are referenced inside the vi.mock factories below. They're declared
// via vi.hoisted so they exist when the mocks initialize (vi.mock is hoisted
// above imports). Per-test state mutation works through these.
const actionStateHolder = vi.hoisted(() => ({
  state: {} as {
    error?: string;
    fieldErrors?: Record<string, string>;
    message?: string;
  },
  pending: false,
}));

const formStatusHolder = vi.hoisted(() => ({
  pending: false,
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
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

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/app/(auth)/forgot-password/actions", () => ({
  resetPassword: vi.fn(),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("renders the heading, email field, and submit button", () => {
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("heading", { name: /reset password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders a per-field FieldError when state.fieldErrors.email is set", () => {
    actionStateHolder.state = {
      fieldErrors: { email: "Must be a valid email address" },
    };
    render(<ForgotPasswordForm />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/must be a valid email address/i);
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Email rate limit reached" };
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/email rate limit reached/i)).toBeInTheDocument();
    // The form-level banner is a <p>, not role=alert. queryByRole confirms
    // no per-field FieldError is rendered in this state.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fires a success toast when state.message is set", () => {
    actionStateHolder.state = {
      message: "If an account exists for that email, a reset link has been sent.",
    };
    render(<ForgotPasswordForm />);
    expect(toastMock.success).toHaveBeenCalledWith(
      "If an account exists for that email, a reset link has been sent.",
    );
  });

  it("does not fire a toast when state.message is undefined", () => {
    render(<ForgotPasswordForm />);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows the pending label while pending", () => {
    formStatusHolder.pending = true;
    render(<ForgotPasswordForm />);
    // pendingLabel="Sending..." on SubmitButton overrides the "Send" text.
    const button = screen.getByRole("button", { name: /sending/i });
    expect(button).toBeDisabled();
  });
});
