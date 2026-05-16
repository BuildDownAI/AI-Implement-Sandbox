import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DeleteAccountButton } from "@/app/(app)/profile/delete-account-button";

vi.mock("@/app/(app)/profile/actions", () => ({
  deleteAccount: vi.fn(),
}));

describe("DeleteAccountButton", () => {
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
    // The dialog's accessible name comes from AlertDialogTitle.
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
    expect(
      within(dialog).getByText(/cannot be undone/i),
    ).toBeInTheDocument();
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
});
