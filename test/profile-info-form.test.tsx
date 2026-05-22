import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileInfoForm } from "@/app/(app)/profile/profile-info-form";
import type { Profile } from "@/app/(app)/profile/queries";

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
  updateProfile: vi.fn(),
}));

const baseProfile: Profile = {
  user_id: "user-1",
  display_name: "Test User",
  avatar_path: null,
  avatar_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("ProfileInfoForm", () => {
  beforeEach(() => {
    actionStateHolder.state = {};
    actionStateHolder.pending = false;
    formStatusHolder.pending = false;
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("renders display name and avatar fields", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByLabelText(/display name/i)).toHaveValue("Test User");
    expect(screen.getByLabelText(/^avatar$/i)).toBeInTheDocument();
  });

  it("renders AvatarFallback initial when no avatar URL", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("file input restricts to the avatar MIME allowlist", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    const input = screen.getByLabelText(/^avatar$/i);
    expect(input).toHaveAttribute(
      "accept",
      "image/png,image/jpeg,image/webp,image/gif",
    );
  });

  it("handles a null display name with an empty input default", () => {
    render(
      <ProfileInfoForm
        profile={{ ...baseProfile, display_name: null }}
      />,
    );
    expect(screen.getByLabelText(/display name/i)).toHaveValue("");
  });

  it("renders a FieldError under display name when state.fieldErrors.display_name is set", () => {
    actionStateHolder.state = {
      fieldErrors: { display_name: "Display name must be 50 characters or less" },
    };
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /display name must be 50 characters or less/i,
    );
  });

  it("renders a FieldError under avatar when state.fieldErrors.avatar is set", () => {
    actionStateHolder.state = {
      fieldErrors: { avatar: "Avatar must be 5 MB or smaller" },
    };
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /avatar must be 5 mb or smaller/i,
    );
  });

  it("shows the client-side avatar error when an oversized file is selected", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    const input = screen.getByLabelText(/^avatar$/i) as HTMLInputElement;
    // Construct an oversized File (6 MB).
    const oversized = new File(["x".repeat(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /avatar must be 5 mb or smaller/i,
    );
  });

  it("shows the client-side avatar error when a disallowed MIME type is selected", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    const input = screen.getByLabelText(/^avatar$/i) as HTMLInputElement;
    const bad = new File(["body"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /avatar must be png, jpeg, webp, or gif/i,
    );
  });

  it("renders the form-level destructive banner when state.error is set", () => {
    actionStateHolder.state = { error: "Storage upload failed" };
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByText(/storage upload failed/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("fires a success toast when state.message is set", () => {
    actionStateHolder.state = { message: "Profile updated" };
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(toastMock.success).toHaveBeenCalledWith("Profile updated");
  });

  it("shows the pending label and disables submit while pending", () => {
    formStatusHolder.pending = true;
    render(<ProfileInfoForm profile={baseProfile} />);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
  });
});
