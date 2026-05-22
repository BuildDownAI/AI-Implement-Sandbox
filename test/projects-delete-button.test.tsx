import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DeleteProjectButton } from "@/app/(app)/projects/[projectId]/delete-project-button";

type State = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

const actionStateHolder = vi.hoisted(() => ({
  state: {} as State,
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

vi.mock("@/app/(app)/projects/actions", () => ({
  deleteProject: vi.fn(),
}));

describe("DeleteProjectButton", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    sessionStorage.clear();
  });

  it("renders the destructive Delete trigger button", () => {
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    expect(
      screen.getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it("does not show the confirmation dialog by default", () => {
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens the dialog with the project name in the title when the trigger is clicked", () => {
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    // Title uses curly quotes (&ldquo;/&rdquo;), so match loosely on the words.
    expect(
      screen.getByRole("alertdialog", { name: /delete.*my project/i }),
    ).toBeInTheDocument();
  });

  it("renders Cancel and Delete buttons inside the open dialog", () => {
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it("changes the Delete button label to 'Deleting...' and disables it while pending", () => {
    actionStateHolder.pending = true;
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = screen.getByRole("alertdialog");
    const button = within(dialog).getByRole("button", { name: /deleting/i });
    expect(button).toBeDisabled();
  });

  it("hides the error banner before the user has clicked Delete in this dialog session", () => {
    // Even if state.error is set (e.g. from a previous dialog session that was
    // canceled), opening the dialog fresh should not show the stale error.
    actionStateHolder.state = { error: "Previous failure" };
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.queryByText(/previous failure/i)).not.toBeInTheDocument();
  });

  it("renders the inline error after the user submits and state.error is set", () => {
    actionStateHolder.state = { error: "Permission denied" };
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    // Simulate the user clicking Delete inside the dialog; this flips
    // `submitted` to true and unmasks the error.
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /^delete$/i,
      }),
    );
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
  });

  it("sets the sessionStorage flash with the project name when Delete is clicked", () => {
    // Spy on requestSubmit so we don't actually try to submit a form.
    const requestSubmitSpy = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});

    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /^delete$/i,
      }),
    );

    expect(sessionStorage.getItem("flash:project-deleted")).toBe("My Project");
    expect(requestSubmitSpy).toHaveBeenCalled();

    requestSubmitSpy.mockRestore();
  });

  it("clears the sessionStorage flash if the action returns an error", () => {
    // Pre-set the flash to simulate the optimistic write from a click.
    sessionStorage.setItem("flash:project-deleted", "My Project");
    actionStateHolder.state = { error: "Network error" };
    render(<DeleteProjectButton projectId="p-1" projectName="My Project" />);
    // The useEffect watching state.error fires on mount; the flash is cleared.
    expect(sessionStorage.getItem("flash:project-deleted")).toBeNull();
  });
});
