import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UsersPage from "@/app/users/page";

describe("Users page", () => {
  it("renders an email input", () => {
    render(<UsersPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders a password input", () => {
    render(<UsersPage />);
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders a Log in submit button by default", () => {
    render(<UsersPage />);
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument();
  });

  it("shows Log in heading by default", () => {
    render(<UsersPage />);
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
  });

  it("switches to register mode when Register is clicked", () => {
    render(<UsersPage />);
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("switches back to login mode when Log in toggle is clicked", () => {
    render(<UsersPage />);
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));
    expect(screen.getByRole("heading", { name: /^log in$/i })).toBeInTheDocument();
  });
});
