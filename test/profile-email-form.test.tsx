import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailForm } from "@/app/(app)/profile/email-form";

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
  updateEmail: vi.fn(),
}));

describe("EmailForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("renders with the current email as defaultValue", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
  });

  it("renders the Update email submit button", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
  });

  it("describes the secure-email-change flow (both inboxes must confirm)", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByText(/confirmation links will be sent to both/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/both must be clicked to complete the change/i),
    ).toBeInTheDocument();
  });

  it("renders a FieldError under email when state.fieldErrors.email is set", () => {
    actionStateHolder.state = {
      fieldErrors: { email: "Must be a valid email address" },
    };
    render(<EmailForm currentEmail="user@example.com" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /must be a valid email address/i,
    );
  });

  it("renders the same-email error from fieldErrors", () => {
    actionStateHolder.state = {
      fieldErrors: {
        email:
          "Updated email address must be different than your current email address",
      },
    };
    render(<EmailForm currentEmail="user@example.com" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /must be different than your current email address/i,
    );
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Rate limit reached" };
    render(<EmailForm currentEmail="user@example.com" />);
    expect(screen.getByText(/rate limit reached/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fires a success toast when state.message is set", () => {
    actionStateHolder.state = {
      message:
        "Confirmation links sent to both your current and new email addresses. Click both to complete the change.",
    };
    render(<EmailForm currentEmail="user@example.com" />);
    expect(toastMock.success).toHaveBeenCalledWith(
      expect.stringMatching(/confirmation links sent/i),
    );
  });

  it("shows the pending label and disables submit while pending", () => {
    formStatusHolder.pending = true;
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByRole("button", { name: /sending/i }),
    ).toBeDisabled();
  });
});
