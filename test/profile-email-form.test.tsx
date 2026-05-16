import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailForm } from "@/app/(app)/profile/email-form";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(app)/profile/actions", () => ({
  updateEmail: vi.fn(),
}));

describe("EmailForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders with the current email as defaultValue", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(screen.getByLabelText(/email/i)).toHaveValue("user@example.com");
  });

  it("renders the Update email submit button", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
  });

  it("describes the secure-email-change flow (both inboxes must confirm)", () => {
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByText(/confirmation links will be sent to both/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/both must be clicked to complete the change/i),
    ).toBeInTheDocument();
  });

  it("displays an error message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Must+be+a+valid+email+address",
    );
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByText(/must be a valid email address/i),
    ).toBeInTheDocument();
  });

  it("displays a confirmation message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "message=Check+your+inbox+to+confirm+the+email+change.",
    );
    render(<EmailForm currentEmail="user@example.com" />);
    expect(
      screen.getByText(/check your inbox to confirm the email change/i),
    ).toBeInTheDocument();
  });
});
