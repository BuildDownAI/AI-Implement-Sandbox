import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/(auth)/login/form";

// Per-test mutable holder for the search-params return value.
// `vi.hoisted` lifts this above the `vi.mock` factory so the factory can reference it.
const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

// Server Actions can't be invoked from a test environment; replace with no-ops.
vi.mock("@/app/(auth)/login/actions", () => ({
  login: vi.fn(),
  register: vi.fn(),
  signInWithGithub: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders login mode by default", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it("displays an error message from the URL search params", () => {
    searchParamsHolder.params = new URLSearchParams("error=Invalid+credentials");
    render(<LoginForm />);
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("displays an informational message from the URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "message=Check+your+email+to+confirm",
    );
    render(<LoginForm />);
    expect(screen.getByText(/check your email to confirm/i)).toBeInTheDocument();
  });
});
