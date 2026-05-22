import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordForm } from "@/app/(app)/profile/password-form";

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

vi.mock("@/app/(app)/profile/actions", () => ({
  updatePassword: vi.fn(),
}));

describe("PasswordForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("renders new password and confirm password fields", () => {
    render(<PasswordForm />);
    // Anchor with ^...$ — both labels contain "new password" as a substring,
    // so a loose regex would match both and getByLabelText would throw.
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^confirm new password$/i),
    ).toBeInTheDocument();
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

  it("renders a FieldError under password when state.fieldErrors.password is set", () => {
    actionStateHolder.state = {
      fieldErrors: { password: "Password must be at least 8 characters" },
    };
    render(<PasswordForm />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /password must be at least 8 characters/i,
    );
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Session expired" };
    render(<PasswordForm />);
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fires a success toast when state.message is set", () => {
    actionStateHolder.state = { message: "Password updated" };
    render(<PasswordForm />);
    expect(toastMock.success).toHaveBeenCalledWith("Password updated");
  });

  it("disables the submit button and shows a FieldError when passwords don't match", () => {
    render(<PasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), {
      target: { value: "different" },
    });
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeDisabled();
    expect(screen.getByText(/passwords don'?t match/i)).toBeInTheDocument();
  });

  it("does not show the mismatch FieldError while confirm is still empty", () => {
    render(<PasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    expect(
      screen.queryByText(/passwords don'?t match/i),
    ).not.toBeInTheDocument();
  });

  it("enables submit when passwords match", () => {
    render(<PasswordForm />);
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), {
      target: { value: "abcdefgh" },
    });
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).not.toBeDisabled();
  });

  it("shows the pending label and disables submit while pending", () => {
    formStatusHolder.pending = true;
    render(<PasswordForm />);
    expect(
      screen.getByRole("button", { name: /updating/i }),
    ).toBeDisabled();
  });
});
