import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateProjectForm } from "@/app/(app)/projects/new/form";

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

vi.mock("@/app/(app)/projects/actions", () => ({
  createProject: vi.fn(),
}));

describe("CreateProjectForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
  });

  it("renders the name, description, and status fields", () => {
    render(<CreateProjectForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /status/i }),
    ).toBeInTheDocument();
  });

  it("starts with an empty name and description (uncontrolled defaults)", () => {
    render(<CreateProjectForm />);
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
  });

  it("renders the Create project submit button", () => {
    render(<CreateProjectForm />);
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
  });

  it("links the Cancel button back to the projects list", () => {
    render(<CreateProjectForm />);
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("includes a hidden status input mirroring the Select for FormData submission", () => {
    const { container } = render(<CreateProjectForm />);
    const hiddenStatus = container.querySelector(
      'input[type="hidden"][name="status"]',
    );
    expect(hiddenStatus).toHaveAttribute("value", "draft");
  });

  it("renders a FieldError under name when state.fieldErrors.name is set", () => {
    actionStateHolder.state = {
      fieldErrors: { name: "Name is required" },
    };
    render(<CreateProjectForm />);
    expect(screen.getByRole("alert")).toHaveTextContent(/name is required/i);
  });

  it("renders a FieldError under description when state.fieldErrors.description is set", () => {
    actionStateHolder.state = {
      fieldErrors: { description: "Description must be 1000 characters or less" },
    };
    render(<CreateProjectForm />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /description must be 1000 characters or less/i,
    );
  });

  it("renders a FieldError under status when state.fieldErrors.status is set", () => {
    actionStateHolder.state = {
      fieldErrors: { status: "Status must be draft, active, or archived" },
    };
    render(<CreateProjectForm />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /status must be draft, active, or archived/i,
    );
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Database unavailable" };
    render(<CreateProjectForm />);
    expect(screen.getByText(/database unavailable/i)).toBeInTheDocument();
    // Form-level banner is a <p>, not role=alert. No per-field FieldError in this state.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the pending label and disables submit while pending", () => {
    formStatusHolder.pending = true;
    render(<CreateProjectForm />);
    const button = screen.getByRole("button", { name: /creating/i });
    expect(button).toBeDisabled();
  });
});
