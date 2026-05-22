import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DeleteAccountButton } from "@/app/(app)/profile/delete-account-button";

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

vi.mock("@/app/(app)/profile/actions", () => ({
  deleteAccount: vi.fn(),
}));

describe("DeleteAccountButton", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    sessionStorage.clear();
  });

  it("renders the destructive Delete account trigger button", () => {
    render(<DeleteAccountButton />);
    expect(
      screen.getByRole("button", { name: /delete account/i }),
    ).toBeInTheDocument();
  });

  it("does not show the confirmation dialog by default", () => {
    render(<DeleteAccountButton />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens the confirmation dialog when the trigger is clicked", () => {
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(
      screen.getByRole("alertdialog", { name: /delete your account/i }),
    ).toBeInTheDocument();
  });

  it("describes the destructive consequences in the dialog", () => {
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/permanently delete/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("has both Cancel and Delete account buttons inside the dialog", () => {
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /delete account/i }),
    ).toBeInTheDocument();
  });

  it("changes the Delete button label to 'Deleting...' and disables it while pending", () => {
    actionStateHolder.pending = true;
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: /deleting/i }),
    ).toBeDisabled();
  });

  it("hides the error banner before the user has clicked Delete in this dialog session", () => {
    actionStateHolder.state = { error: "Previous RPC failure" };
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.queryByText(/previous rpc failure/i)).not.toBeInTheDocument();
  });

  it("renders the inline error after the user submits and state.error is set", () => {
    actionStateHolder.state = { error: "RPC failed" };
    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    // Click the Delete inside the dialog to flip `submitted` true.
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /delete account/i,
      }),
    );
    expect(screen.getByText(/rpc failed/i)).toBeInTheDocument();
  });

  it("sets the sessionStorage flash when Delete is clicked", () => {
    const requestSubmitSpy = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});

    render(<DeleteAccountButton />);
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: /delete account/i,
      }),
    );

    expect(sessionStorage.getItem("flash:account-deleted")).toBe("1");
    expect(requestSubmitSpy).toHaveBeenCalled();

    requestSubmitSpy.mockRestore();
  });

  it("clears the sessionStorage flash if the action returns an error", () => {
    sessionStorage.setItem("flash:account-deleted", "1");
    actionStateHolder.state = { error: "Network error" };
    render(<DeleteAccountButton />);
    expect(sessionStorage.getItem("flash:account-deleted")).toBeNull();
  });
});
