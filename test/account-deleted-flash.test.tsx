import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AccountDeletedFlash } from "@/app/(auth)/login/account-deleted-flash";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("AccountDeletedFlash", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    sessionStorage.clear();
  });

  it("fires toast.success and clears the flash on mount when set", () => {
    sessionStorage.setItem("flash:account-deleted", "1");
    render(<AccountDeletedFlash />);
    expect(toastMock.success).toHaveBeenCalledWith(
      "Your account has been deleted",
    );
    expect(sessionStorage.getItem("flash:account-deleted")).toBeNull();
  });

  it("does nothing when the flash is not set", () => {
    render(<AccountDeletedFlash />);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("renders no visible DOM (null return)", () => {
    sessionStorage.setItem("flash:account-deleted", "1");
    const { container } = render(<AccountDeletedFlash />);
    expect(container.firstChild).toBeNull();
  });
});
