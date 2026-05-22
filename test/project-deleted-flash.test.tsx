import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ProjectDeletedFlash } from "@/app/(app)/projects/project-deleted-flash";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("ProjectDeletedFlash", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    sessionStorage.clear();
  });

  it("fires toast.success with the project name and clears the flash on mount", () => {
    sessionStorage.setItem("flash:project-deleted", "My Project");
    render(<ProjectDeletedFlash />);
    expect(toastMock.success).toHaveBeenCalledWith(
      'Project "My Project" was deleted',
    );
    expect(sessionStorage.getItem("flash:project-deleted")).toBeNull();
  });

  it("does nothing when the flash is not set", () => {
    render(<ProjectDeletedFlash />);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("renders no visible DOM (null return)", () => {
    sessionStorage.setItem("flash:project-deleted", "My Project");
    const { container } = render(<ProjectDeletedFlash />);
    expect(container.firstChild).toBeNull();
  });
});
