import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectsPage from "@/app/(app)/projects/page";

// Mock the terminal call of the Supabase query chain.
// from().select().order().range() — only `range` is awaited, so that's what we mock.
const mockRange = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        order: () => ({
          range: mockRange,
        }),
      }),
    }),
  }),
}));

describe("Projects list page", () => {
  beforeEach(() => {
    mockRange.mockReset();
  });

  const renderPage = async (searchParams: Record<string, string> = {}) => {
    return render(
      await ProjectsPage({
        searchParams: Promise.resolve(searchParams),
      }),
    );
  };

  it("renders an empty state when no projects exist", async () => {
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });
    await renderPage();
    // shadcn's Empty title renders as a styled <div>, not an <h*>, so we
    // assert via text content rather than role="heading".
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create your first project/i }),
    ).toHaveAttribute("href", "/projects/new");
  });

  it("renders a card per project with status badge", async () => {
    mockRange.mockResolvedValue({
      data: [
        {
          id: "1",
          user_id: "u",
          name: "First",
          description: "First description",
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: "u",
          name: "Second",
          description: null,
          status: "draft",
          created_at: "2026-01-02T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
        },
      ],
      count: 2,
      error: null,
    });
    await renderPage();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("First description")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("does not render pagination when the result fits on one page", async () => {
    mockRange.mockResolvedValue({
      data: [
        {
          id: "1",
          user_id: "u",
          name: "Only",
          description: null,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      count: 1,
      error: null,
    });
    await renderPage();
    expect(
      screen.queryByRole("link", { name: /next/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /previous/i }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination Previous + Next when the page is in the middle", async () => {
    mockRange.mockResolvedValue({
      data: [
        {
          id: "1",
          user_id: "u",
          name: "P",
          description: null,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      count: 25,
      error: null,
    });
    await renderPage({ page: "2" });
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute(
      "href",
      "/projects?page=1",
    );
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute(
      "href",
      "/projects?page=3",
    );
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
  });

  it("displays the Supabase query error when the list query fails", async () => {
    mockRange.mockResolvedValue({
      data: null,
      count: null,
      error: { message: "permission denied for table projects" },
    });
    await renderPage();
    expect(
      screen.getByText(/permission denied for table projects/i),
    ).toBeInTheDocument();
  });
});
