import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "@/app/(app)/page";

// Mock the entire Supabase server client chain. Each test sets the return value of
// `getClaims` to simulate logged-in vs logged-out state.
const mockGetClaims = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getClaims: mockGetClaims,
    },
  }),
}));

vi.mock("@/app/(auth)/login/actions", () => ({
  logout: vi.fn(),
}));

describe("Home page", () => {
  beforeEach(() => {
    mockGetClaims.mockReset();
  });

  it("renders the Hello World heading", async () => {
    mockGetClaims.mockResolvedValue({ data: null });
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /hello world/i }),
    ).toBeInTheDocument();
  });

  it("mentions AI-Implement", async () => {
    mockGetClaims.mockResolvedValue({ data: null });
    render(await Page());
    expect(screen.getByText(/AI-Implement/i)).toBeInTheDocument();
  });

  it("renders the theme toggle when no user is signed in", async () => {
    mockGetClaims.mockResolvedValue({ data: null });
    render(await Page());
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
  });

  it("shows a Log in link when no user is signed in", async () => {
    mockGetClaims.mockResolvedValue({ data: null });
    render(await Page());
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the user email and a Log out button when signed in", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { email: "test@example.com", sub: "abc-123" } },
    });
    render(await Page());
    expect(screen.getByText(/signed in as test@example\.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /log in/i }),
    ).not.toBeInTheDocument();
  });
});
