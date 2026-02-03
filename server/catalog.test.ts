import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("catalog router", () => {
  it("returns categories list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
    expect(categories[0]).toHaveProperty("slug");
  });

  it("returns products list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("slug");
  });

  it("returns full catalog with categories and products", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const catalog = await caller.catalog.full();

    expect(catalog).toHaveProperty("categories");
    expect(catalog).toHaveProperty("products");
    expect(Array.isArray(catalog.categories)).toBe(true);
    expect(Array.isArray(catalog.products)).toBe(true);
    expect(catalog.categories.length).toBeGreaterThan(0);
    expect(catalog.products.length).toBeGreaterThan(0);
  });

  it("returns product by slug with details", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySlug({ slug: "ovo-trufado-tradicional" });

    expect(product).not.toBeNull();
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("prices");
    expect(product).toHaveProperty("flavors");
    expect(product?.name).toBe("Ovo Trufado Tradicional");
  });

  it("returns null for non-existent product slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySlug({ slug: "produto-inexistente" });

    expect(product).toBeNull();
  });
});

describe("flavors router", () => {
  it("returns flavors list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const flavors = await caller.flavors.list();

    expect(Array.isArray(flavors)).toBe(true);
    expect(flavors.length).toBeGreaterThan(0);
    expect(flavors[0]).toHaveProperty("id");
    expect(flavors[0]).toHaveProperty("name");
  });
});
