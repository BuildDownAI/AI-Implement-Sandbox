import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "@/app/(app)/page";

const mockGetClaims = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getClaims: mockGetClaims,
    },
  }),
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

  it("shows a Log in link when no user is signed in", async () => {
    mockGetClaims.mockResolvedValue({ data: null });
    render(await Page());
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the signed-in email when a user is present, and no Log in link", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { email: "test@example.com", sub: "abc-123" } },
    });
    render(await Page());
    expect(
      screen.getByText(/signed in as test@example\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /log in/i }),
    ).not.toBeInTheDocument();
  });
});
