import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/app/(app)/header";

const pathnameHolder = vi.hoisted(() => ({ value: "/projects" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameHolder.value,
}));

vi.mock("@/app/(auth)/login/actions", () => ({
  logout: vi.fn(),
}));

const authedProfile = {
  display_name: "Alice Park",
  avatar_url: null,
};

describe("Header", () => {
  beforeEach(() => {
    pathnameHolder.value = "/projects";
  });

  it("renders the brand link pointing to /", () => {
    render(<Header profile={null} email={null} />);
    expect(
      screen.getByRole("link", { name: /ai-implement sandbox/i }),
    ).toHaveAttribute("href", "/");
  });

  it("renders the theme toggle in both auth states", () => {
    const { rerender } = render(<Header profile={null} email={null} />);
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument();

    rerender(<Header profile={authedProfile} email="alice@example.com" />);
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument();
  });

  describe("authenticated", () => {
    it("renders Projects and Profile inline nav links", () => {
      render(<Header profile={authedProfile} email="alice@example.com" />);
      expect(
        screen.getByRole("link", { name: /^projects$/i }),
      ).toHaveAttribute("href", "/projects");
      expect(
        screen.getByRole("link", { name: /^profile$/i }),
      ).toHaveAttribute("href", "/profile");
    });

    it("marks the active route with aria-current=page", () => {
      pathnameHolder.value = "/projects";
      render(<Header profile={authedProfile} email="alice@example.com" />);
      expect(
        screen.getByRole("link", { name: /^projects$/i }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        screen.getByRole("link", { name: /^profile$/i }),
      ).not.toHaveAttribute("aria-current");
    });

    it("treats nested project routes as the Projects link being active", () => {
      pathnameHolder.value = "/projects/abc-123/edit";
      render(<Header profile={authedProfile} email="alice@example.com" />);
      expect(
        screen.getByRole("link", { name: /^projects$/i }),
      ).toHaveAttribute("aria-current", "page");
    });

    it("renders the avatar fallback initial from display_name", () => {
      render(<Header profile={authedProfile} email="alice@example.com" />);
      expect(
        screen.getByRole("button", { name: /open user menu/i }),
      ).toHaveTextContent("A");
    });

    it("falls back to the email's first letter when display_name is null", () => {
      render(
        <Header
          profile={{ display_name: null, avatar_url: null }}
          email="bob@example.com"
        />,
      );
      expect(
        screen.getByRole("button", { name: /open user menu/i }),
      ).toHaveTextContent("B");
    });

    it("opens the user menu, showing email and a Log out item", () => {
      render(<Header profile={authedProfile} email="alice@example.com" />);
      // Radix DropdownMenuTrigger ignores plain click/pointerdown in jsdom
      // because its mouse-branch checks pointerType === "mouse", which jsdom
      // doesn't populate. Keyboard activation (Enter on a focused trigger) is
      // the reliable path — Radix wires Space/Enter through the same opener.
      const trigger = screen.getByRole("button", { name: /open user menu/i });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "Enter" });
      // Radix portals the menu into document.body — query via screen, not container.
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /log out/i }),
      ).toBeInTheDocument();
    });

    it("does not render a Log in link in the authed state", () => {
      render(<Header profile={authedProfile} email="alice@example.com" />);
      expect(
        screen.queryByRole("link", { name: /^log in$/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("unauthenticated", () => {
    it("does not render the primary nav", () => {
      render(<Header profile={null} email={null} />);
      expect(
        screen.queryByRole("navigation", { name: /primary/i }),
      ).not.toBeInTheDocument();
    });

    it("does not render the user menu trigger", () => {
      render(<Header profile={null} email={null} />);
      expect(
        screen.queryByRole("button", { name: /open user menu/i }),
      ).not.toBeInTheDocument();
    });

    it("renders a Log in link pointing to /login", () => {
      render(<Header profile={null} email={null} />);
      expect(
        screen.getByRole("link", { name: /^log in$/i }),
      ).toHaveAttribute("href", "/login");
    });
  });
});
