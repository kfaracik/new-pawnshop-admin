import { describe, it, expect, beforeAll, vi } from "vitest";

// Isolate role logic from the database: no DB staff members in these cases.
vi.mock("@/lib/staff", () => ({
  getStaffRole: vi.fn(async () => null),
}));

beforeAll(() => {
  process.env.ADMIN_EMAILS = "boss@shop.com, Shared@shop.com";
  process.env.EMPLOYEE_EMAILS = "clerk@shop.com, shared@shop.com";
});

describe("adminAccess roles (env bootstrap)", () => {
  it("resolves bootstrap roles, admin wins for a shared email", async () => {
    const { resolveUserRole, isAllowedEmail, isBootstrapAdmin, isBootstrapEmployee } =
      await import("./adminAccess");

    expect(await resolveUserRole("boss@shop.com")).toBe("admin");
    expect(await resolveUserRole("clerk@shop.com")).toBe("employee");
    // Listed in both -> admin always wins, and excluded from employees.
    expect(await resolveUserRole("shared@shop.com")).toBe("admin");
    expect(await resolveUserRole("stranger@shop.com")).toBeNull();
    // Case-insensitive.
    expect(await resolveUserRole("BOSS@SHOP.COM")).toBe("admin");

    expect(isBootstrapAdmin("boss@shop.com")).toBe(true);
    expect(isBootstrapEmployee("clerk@shop.com")).toBe(true);
    expect(isBootstrapEmployee("shared@shop.com")).toBe(false);

    expect(await isAllowedEmail("clerk@shop.com")).toBe(true);
    expect(await isAllowedEmail("stranger@shop.com")).toBe(false);
    expect(await isAllowedEmail(null)).toBe(false);
  });

  it("DB staff role applies for non-bootstrap emails and admin env still wins", async () => {
    const staff = await import("@/lib/staff");
    const { resolveUserRole } = await import("./adminAccess");

    // A DB-managed employee that is not in any env list.
    vi.mocked(staff.getStaffRole).mockResolvedValueOnce("admin");
    expect(await resolveUserRole("new-hire@shop.com")).toBe("admin");

    // Even if DB somehow returns a role for a bootstrap admin, env admin wins
    // (DB is never consulted because bootstrap short-circuits first).
    vi.mocked(staff.getStaffRole).mockResolvedValueOnce("employee");
    expect(await resolveUserRole("boss@shop.com")).toBe("admin");
  });
});
