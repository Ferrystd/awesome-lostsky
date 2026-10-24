import { expect, test } from "./fixtures";

const json = (data: unknown) =>
  JSON.stringify({ code: 0, message: "ok", data });

test("Shop personal workspace creates an immutable self-owned product through personal APIs", async ({
  page,
}) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "teamMember", id: 11 } })).toString("base64url")}.x`;
  await page.context().addCookies([{
    name: "lostsky_token",
    value: token,
    domain: ".lostsky.work",
    path: "/",
    sameSite: "Lax",
  }]);

  const payloads: Record<string, Record<string, unknown>> = {};
  await page.route("http://demo.shop.lostsky.work:5179/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    let data: unknown = null;
    if (path.endsWith("/manage/access")) {
      data = {
        team: { id: 1, slug: "demo", name: "青空协作组" },
        identity: { type: "teamMember", entity_id: 71, name: "青空接单人", slug: "handler", avatar: "" },
        permissions: ["shop.product.self.manage"],
        abilities: { transaction: { enabled: true, level: 1, expire_time: 0, reason: null, label: "记账" } },
      };
    } else if (path.endsWith("/personal/products/options")) {
      data = {
        entities: [{ entity_id: 71, name: "当前成员" }],
        packages: [],
        campaigns: [],
        service_defaults: {
          default_unit_name: "次",
          default_quantity_step: "1",
          default_valid_days: 30,
          allow_customer_open_dispatch: true,
          default_handler_rate_percent: 60,
          default_sender_rate_percent: 25,
          default_cs_rate_percent: 5,
        },
      };
    } else if (path.endsWith("/personal/products") && method === "POST") {
      payloads.product = request.postDataJSON();
      data = { id: 204 };
    } else if (path.endsWith("/personal/products/204")) {
      data = { id: 204, ...payloads.product, entity_id: 71, handlers: [] };
    } else if (path.endsWith("/personal/products")) {
      data = { total: 1, page: 1, limit: 20, list: [{ id: 204, name: "本人咨询", price: "66.00", is_active: 1, handlers: [] }] };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: json(data) });
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/products/new");
  await expect(page.locator("#shop-manage-main").getByRole("heading", { name: "新建本人商品", level: 1 })).toBeVisible();
  await expect(page.getByText("此商品自动归属当前已领取的人员，个人工作台不能转移归属。", { exact: true })).toBeVisible();
  await expect(page.locator("#product-owner")).toHaveCount(0);
  const activeLayout = await page.locator("#product-active").evaluate((control) => {
    const field = control.closest(".ls-switch-field");
    const controlRect = control.getBoundingClientRect();
    const fieldRect = field?.getBoundingClientRect();
    return {
      controlHeight: Math.round(controlRect.height),
      controlWidth: Math.round(controlRect.width),
      fieldWidth: fieldRect ? Math.round(fieldRect.width) : null,
      rightInset: fieldRect ? Math.round(fieldRect.right - controlRect.right) : null,
    };
  });
  expect(activeLayout.controlHeight).toBeGreaterThanOrEqual(44);
  expect(activeLayout.controlWidth).toBeLessThan(100);
  expect(activeLayout.fieldWidth).toBeGreaterThan(activeLayout.controlWidth * 2);
  expect(activeLayout.rightInset).toBe(12);
  await expect(page.locator("#product-active")).toHaveAttribute("aria-labelledby", "product-active-label");
  const pricingSection = page.locator('[aria-labelledby="product-pricing"]');
  await expect(pricingSection.getByRole("heading", { name: "价格与分成", exact: true })).toBeVisible();
  await expect(pricingSection.locator("#product-cost")).toBeVisible();
  await expect(pricingSection.locator("#product-price")).toBeVisible();
  await page.locator("#product-price input").fill("66");
  await page.locator("#product-cost input").fill("6");
  await page.locator("#product-name input").focus();
  await expect(page.locator("#product-handler-cut input")).toHaveValue("36.00");
  await expect(page.locator("#product-sender-cut input")).toHaveValue("15.00");
  await expect(page.locator("#product-cs-cut input")).toHaveValue("3.00");
  await expect(page.locator("#product-team-cut input")).toHaveValue("6.00");
  await expect(page.locator("#product-team-cut input")).toBeDisabled();
  await page.locator("#product-name input").fill("本人咨询");
  await page.locator("input#product-cover").fill("/media/self-consulting.webp");
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page).toHaveURL(/\/manage\/personal\/products\/204$/);
  expect(payloads.product).toMatchObject({
    name: "本人咨询",
    cover_image: "/media/self-consulting.webp",
    price: 66,
    cost: 6,
    team_cut: 6,
    expected_entity_id: 71,
    handler_entity_ids: [],
  });
  expect(payloads.product).not.toHaveProperty("entity_id");
  expect(payloads.product).not.toHaveProperty("handler_cut");

  const preview = page.getByRole("link", { name: "预览前台" });
  await expect(preview).toHaveAttribute("href", "/product/204");
  await expect(preview).toHaveAttribute("target", "_blank");
  await expect(preview).toBeVisible();
  expect((await preview.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("button", { name: "下架商品" })).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/products");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
test("Shop product forms upload cover images without file.upload permission", async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "team", id: 1 } })).toString("base64url")}.x`;
  await page.context().addCookies([{
    name: "lostsky_token",
    value: token,
    domain: ".lostsky.work",
    path: "/",
    sameSite: "Lax",
  }]);

  let uploadApp = "";
  await page.route("http://demo.shop.lostsky.work:5179/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = null;
    if (path.endsWith("/manage/access")) {
      data = {
        permissions: ["shop.product.write"],
        abilities: {
          file: { enabled: true, level: 1, expire_time: 0, reason: null, label: "文件上传" },
        },
      };
    } else if (path.endsWith("/manage/options")) {
      data = { entities: [], packages: [], campaigns: [], customers: [], services: [] };
    } else if (path.endsWith("/upload")) {
      uploadApp = request.headers()["x-lostsky-app"] ?? "";
      data = { id: 88, url: "//assets.lostsky.work/products/uploaded-cover.webp" };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: json(data) });
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/products/new");
  const coverInput = page.locator("#product-cover-file");
  await expect(page.getByRole("button", { name: "上传封面" })).toBeEnabled();
  await coverInput.setInputFiles({ name: "cover.webp", mimeType: "image/webp", buffer: Buffer.from("cover") });
  await expect(page.locator("input#product-cover")).toHaveValue("//assets.lostsky.work/products/uploaded-cover.webp");
  await expect(page.locator("button:has(svg[data-lostsky-image-upload])")).toBeEnabled();
  expect(uploadApp).toBe("common");
});

test("team can inspect and redeem an Ability card then refresh current state", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "lostsky_token",
      value: "e2e-token",
      domain: ".lostsky.work",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  let redeemed = false;
  let redeemPayload: Record<string, unknown> | null = null;
  await page.route(
    "http://demo.team.lostsky.work:5175/api/**",
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      let data: unknown = null;
      if (path.endsWith("/access"))
        data = { permissions: ["team.ability.redeem"], abilities: {} };
      else if (path.endsWith("/ability/card/inspect"))
        data = {
          campaign: { id: 5, name: "首月体验", mode: 2 },
          abilities: [{ ability_key: "file", level: 1, duration_days: 30 }],
        };
      else if (path.endsWith("/ability/card/redeem")) {
        redeemPayload = request.postDataJSON();
        redeemed = true;
      } else if (path.endsWith("/ability"))
        data = [
          {
            key: "file",
            label: "文件",
            enabled: redeemed,
            level: redeemed ? 1 : 0,
            expire_time: redeemed ? 1_900_000_000 : 0,
            reason: redeemed ? null : "missing",
            source: redeemed ? "grant" : "none",
          },
          {
            key: "shop",
            label: "商城",
            enabled: false,
            level: 0,
            expire_time: 0,
            reason: "missing",
            source: "none",
          },
        ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: json(data),
      });
    },
  );

  await page.goto("http://demo.team.lostsky.work:5175/abilities");
  await expect(
    page
      .locator("#workspace")
      .getByRole("heading", { name: "团队能力", level: 1 }),
  ).toBeVisible();
  const levelRightEdges = await page.locator(".ability-level").evaluateAll((levels) =>
    levels.map((level) => level.getBoundingClientRect().right),
  );
  expect(new Set(levelRightEdges).size).toBe(1);
  if (page.viewportSize()?.width && page.viewportSize()!.width >= 640) {
    const statusCenters = await page.locator(".ability-status").evaluateAll((statuses) =>
      statuses.map((status) => {
        const bounds = status.getBoundingClientRect();
        return bounds.left + bounds.width / 2;
      }),
    );
    expect(new Set(statusCenters).size).toBe(1);
  }
  await page.getByPlaceholder("LS-XXXX-XXXX-…").fill("LS-DEMO-CARD");
  await page.getByRole("button", { name: "检查兑换码" }).click();
  await expect(
    page.getByRole("heading", { name: "首月体验", level: 2 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认兑换" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "确认兑换" })
    .click();
  await expect
    .poll(() => redeemPayload)
    .toMatchObject({ code: "LS-DEMO-CARD" });
  await expect(page.getByText("等级 1")).toBeVisible();
});

test("platform admin creates an Ability package from the fixed catalog", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "lostsky_token",
      value: "e2e-token",
      domain: ".lostsky.work",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  let packagePayload: Record<string, unknown> | null = null;
  await page.route("http://admin.lostsky.work:5180/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = null;
    if (path.endsWith("/session"))
      data = {
        is_super_admin: false,
        permissions: ["admin.entitlement.read", "admin.entitlement.write"],
      };
    else if (path.endsWith("/entitlements/ability-catalog"))
      data = [
        { key: "doc", label: "文档", levels: [1] },
        { key: "file", label: "文件", levels: [1, 2, 3] },
        { key: "transaction", label: "流水", levels: [1] },
        { key: "shop", label: "商城", levels: [1] },
      ];
    else if (path.endsWith("/entitlements/packages/9"))
      data = {
        id: 9,
        name: "首月免费",
        is_active: 1,
        abilities: [
          { id: 1, ability_key: "file", level: 1, duration_days: 30 },
        ],
      };
    else if (
      path.endsWith("/entitlements/packages") &&
      request.method() === "POST"
    ) {
      packagePayload = request.postDataJSON();
      data = { id: 9 };
    } else if (path.endsWith("/entitlements/packages"))
      data = { total: 0, page: 1, limit: 20, list: [] };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: json(data),
    });
  });

  await page.goto("http://admin.lostsky.work:5180/entitlements/packages/new");
  await page.getByPlaceholder("请输入").first().fill("首月免费");
  await page.locator(".n-select").first().click();
  await page.getByText("文件", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存权益包" }).click();
  await expect
    .poll(() => packagePayload)
    .toMatchObject({
      name: "首月免费",
      abilities: [{ ability_key: "file", level: 1, duration_days: 30 }],
    });
  await expect(page).toHaveURL(/\/entitlements\/packages\/9$/);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
});
