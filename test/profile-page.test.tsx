import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage from "@/app/(app)/profile/page";

const mockGetClaims = vi.hoisted(() => vi.fn());
const mockGetProfile = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getClaims: mockGetClaims },
  }),
}));

vi.mock("@/app/(app)/profile/queries", () => ({
  getProfile: mockGetProfile,
}));

vi.mock("@/app/(app)/profile/actions", () => ({
  updateProfile: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

const baseProfile = {
  user_id: "user-1",
  display_name: "Test User",
  avatar_path: null,
  avatar_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("Profile page", () => {
  beforeEach(() => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockGetClaims.mockReset();
  });

  it("always renders Profile info and Danger zone, regardless of provider", async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-1",
          email: "user@example.com",
          app_metadata: { provider: "email" },
        },
      },
    });
    render(await ProfilePage());
    expect(screen.getByText(/^profile info$/i)).toBeInTheDocument();
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
  });

  it("shows Email and Password cards for email-provider users", async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-1",
          email: "user@example.com",
          app_metadata: { provider: "email" },
        },
      },
    });
    render(await ProfilePage());
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sign-in method/i)).not.toBeInTheDocument();
  });

  it("hides Email and Password cards for OAuth users, shows Sign-in method instead", async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-1",
          email: "user@github.com",
          app_metadata: { provider: "github" },
        },
      },
    });
    render(await ProfilePage());

    expect(
      screen.queryByRole("button", { name: /update email/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /update password/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/sign-in method/i)).toBeInTheDocument();
    // Provider name appears in the description, capitalized
    expect(screen.getByText(/Github/)).toBeInTheDocument();
  });

  it("defaults to email-provider behavior when provider claim is missing", async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-1",
          email: "user@example.com",
          // no app_metadata.provider — fallback should treat as "email"
        },
      },
    });
    render(await ProfilePage());
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
  });
});
