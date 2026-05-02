import { describe, expect, it } from "vitest";
import {
  buildProductPayload,
  getPropertiesToFill,
  validateProductInput,
} from "./products";

describe("admin product helpers", () => {
  it("validates required title and price", () => {
    expect(validateProductInput({ title: "", price: 10 })).toBe(
      "Product name is required."
    );
    expect(validateProductInput({ title: "Ring", price: 0 })).toBe(
      "Price must be a number greater than 0."
    );
  });

  it("builds trimmed payload", () => {
    expect(
      buildProductPayload({
        title: "  Ring  ",
        description: "desc",
        price: "10",
        quantity: "2",
        images: ["a"],
        category: "cat-1",
        properties: { brand: "X" },
      }).title
    ).toBe("Ring");
  });

  it("collects properties from category and parents", () => {
    const properties = getPropertiesToFill(
      [
        {
          _id: "parent",
          properties: [{ name: "brand", values: ["A"] }],
        },
        {
          _id: "child",
          parent: { _id: "parent" },
          properties: [{ name: "color", values: ["gold"] }],
        },
      ],
      "child"
    );

    expect(properties.map((item) => item.name)).toEqual(["color", "brand"]);
  });
});
