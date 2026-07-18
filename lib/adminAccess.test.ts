import { describe, it, expect, beforeAll } from "vitest";

// adminAccess parses env at module load, so configure it before importing.
beforeAll(() => {
  process.env.ADMIN_EMAILS = "boss@shop.com, Shared@shop.com";
  process.env.EMPLOYEE_EMAILS = "clerk@shop.com, shared@shop.com";
});

describe("adminAccess roles", () => {
  it("assigns roles and lets admin win over employee for a shared email", async () => {
    const { getUserRole, isAllowedEmail, isAdminEmail, isEmployeeEmail } =
      await import("./adminAccess");

    expect(getUserRole("boss@shop.com")).toBe("admin");
    expect(getUserRole("clerk@shop.com")).toBe("employee");
    // Listed in both -> admin always wins, and is excluded from employees.
    expect(getUserRole("shared@shop.com")).toBe("admin");
    expect(getUserRole("stranger@shop.com")).toBeNull();

    // Case-insensitive matching.
    expect(getUserRole("BOSS@SHOP.COM")).toBe("admin");

    expect(isAdminEmail("boss@shop.com")).toBe(true);
    expect(isEmployeeEmail("clerk@shop.com")).toBe(true);
    expect(isEmployeeEmail("shared@shop.com")).toBe(false);

    expect(isAllowedEmail("clerk@shop.com")).toBe(true);
    expect(isAllowedEmail("stranger@shop.com")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
  });
});
