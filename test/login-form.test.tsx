import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/(auth)/login/form";

// Three separate useActionState slots in this form. Each gets its own
// holder so a test can control login / register / github state independently.
type State = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

const actionMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  signInWithGithub: vi.fn(),
  logout: vi.fn(),
}));

const loginHolder = vi.hoisted(() => ({
  state: {} as State,
  pending: false,
}));

const registerHolder = vi.hoisted(() => ({
  state: {} as State,
  pending: false,
}));

const githubHolder = vi.hoisted(() => ({
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

vi.mock("@/app/(auth)/login/actions", () => actionMocks);

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    // Disambiguate by reference: each useActionState call passes its action,
    // so we can return the right slot's state without relying on call order.
    useActionState: (action: unknown) => {
      if (action === actionMocks.login) {
        return [loginHolder.state, vi.fn(), loginHolder.pending];
      }
      if (action === actionMocks.register) {
        return [registerHolder.state, vi.fn(), registerHolder.pending];
      }
      if (action === actionMocks.signInWithGithub) {
        return [githubHolder.state, vi.fn(), githubHolder.pending];
      }
      return [{}, vi.fn(), false];
    },
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

function resetHolders() {
  loginHolder.state = {};
  loginHolder.pending = false;
  registerHolder.state = {};
  registerHolder.pending = false;
  githubHolder.state = {};
  githubHolder.pending = false;
  formStatusHolder.pending = false;
  toastMock.success.mockReset();
  toastMock.error.mockReset();
}

describe("LoginForm", () => {
  beforeEach(resetHolders);

  describe("mode rendering", () => {
    it("renders login mode by default", () => {
      render(<LoginForm />);
      expect(
        screen.getByRole("heading", { name: /log in/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/confirm password/i),
      ).not.toBeInTheDocument();
    });

    it("shows the GitHub OAuth button and email-form divider", () => {
      render(<LoginForm />);
      expect(
        screen.getByRole("button", { name: /continue with github/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
    });

    it("shows the forgot-password link only in login mode", () => {
      render(<LoginForm />);
      expect(
        screen.getByRole("link", { name: /forgot password/i }),
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("toggles to register mode and reveals the confirm-password field", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      expect(
        screen.getByRole("heading", { name: /create account/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /forgot password/i }),
      ).not.toBeInTheDocument();
    });

    it("toggles back to login mode from register mode", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));
      expect(
        screen.getByRole("heading", { name: /log in/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/confirm password/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("per-field errors", () => {
    it("renders a FieldError under email when loginState.fieldErrors.email is set", () => {
      loginHolder.state = {
        fieldErrors: { email: "Must be a valid email address" },
      };
      render(<LoginForm />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/must be a valid email address/i);
    });

    it("renders a FieldError under password when loginState.fieldErrors.password is set", () => {
      loginHolder.state = {
        fieldErrors: { password: "Password must be at least 8 characters" },
      };
      render(<LoginForm />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/password must be at least 8 characters/i);
    });

    it("does not show login mode's fieldErrors after toggling to register mode", () => {
      loginHolder.state = {
        fieldErrors: { email: "Must be a valid email address" },
      };
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      // The login slot's email error is hidden because registerState now drives the view.
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders FieldErrors from registerState when in register mode", () => {
      registerHolder.state = {
        fieldErrors: { email: "Must be a valid email address" },
      };
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/must be a valid email address/i);
    });
  });

  describe("form-level error banner", () => {
    it("renders the destructive banner when loginState.error is set", () => {
      loginHolder.state = { error: "Invalid login credentials" };
      render(<LoginForm />);
      expect(
        screen.getByText(/invalid login credentials/i),
      ).toBeInTheDocument();
    });

    it("renders the destructive banner when githubState.error is set", () => {
      githubHolder.state = { error: "OAuth provider rejected the request" };
      render(<LoginForm />);
      expect(
        screen.getByText(/oauth provider rejected the request/i),
      ).toBeInTheDocument();
    });

    it("prefers githubState.error over activeState.error when both are set", () => {
      loginHolder.state = { error: "Invalid login credentials" };
      githubHolder.state = { error: "OAuth provider rejected the request" };
      render(<LoginForm />);
      expect(
        screen.getByText(/oauth provider rejected the request/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/invalid login credentials/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("confirm-password match (register mode)", () => {
    it("disables the submit button when passwords don't match", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "abcdefgh" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "different" },
      });
      const submit = screen.getByRole("button", { name: /^register$/i });
      expect(submit).toBeDisabled();
    });

    it("renders a FieldError when confirm is typed and doesn't match", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "abcdefgh" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "different" },
      });
      expect(
        screen.getByText(/passwords don'?t match/i),
      ).toBeInTheDocument();
    });

    it("does not show the mismatch FieldError while confirm is still empty", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "abcdefgh" },
      });
      expect(
        screen.queryByText(/passwords don'?t match/i),
      ).not.toBeInTheDocument();
    });

    it("enables the submit button when passwords match", () => {
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "abcdefgh" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "abcdefgh" },
      });
      const submit = screen.getByRole("button", { name: /^register$/i });
      expect(submit).not.toBeDisabled();
    });
  });

  describe("toast on register success", () => {
    it("fires toast.success when registerState.message is set", () => {
      registerHolder.state = {
        message: "Check your email to confirm your account.",
      };
      render(<LoginForm />);
      expect(toastMock.success).toHaveBeenCalledWith(
        "Check your email to confirm your account.",
      );
    });

    it("does not fire a toast for a loginState.message (not watched)", () => {
      loginHolder.state = { message: "Unrelated message" };
      render(<LoginForm />);
      expect(toastMock.success).not.toHaveBeenCalled();
    });
  });

  describe("pending state", () => {
    it("shows the GitHub button's pending label while submitting", () => {
      formStatusHolder.pending = true;
      render(<LoginForm />);
      // useFormStatus is shared across all SubmitButtons in this mock, so when
      // pending is true every SubmitButton shows its pending label. We assert
      // the GitHub button's specific label is present.
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });

    it("shows 'Signing in...' on the submit button when pending in login mode", () => {
      formStatusHolder.pending = true;
      render(<LoginForm />);
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it("shows 'Creating account...' on the submit button when pending in register mode", () => {
      formStatusHolder.pending = true;
      render(<LoginForm />);
      fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });
});
