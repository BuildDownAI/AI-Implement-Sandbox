import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileInfoForm } from "@/app/(app)/profile/profile-info-form";
import type { Profile } from "@/app/(app)/profile/queries";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
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
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders display name and avatar fields", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByLabelText(/display name/i)).toHaveValue("Test User");
    expect(screen.getByLabelText(/^avatar$/i)).toBeInTheDocument();
  });

  it("renders AvatarFallback initial when no avatar URL", () => {
    render(<ProfileInfoForm profile={baseProfile} />);
    // Initial "T" from "Test User"
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

  it("displays an error message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Avatar+must+be+5+MB+or+smaller",
    );
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(
      screen.getByText(/avatar must be 5 mb or smaller/i),
    ).toBeInTheDocument();
  });

  it("displays a success message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams("message=Profile+updated");
    render(<ProfileInfoForm profile={baseProfile} />);
    expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
  });
});
