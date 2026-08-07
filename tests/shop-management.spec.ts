import { expect, test } from "@playwright/test";

const json = (data: unknown) =>
  JSON.stringify({ code: 0, message: "ok", data });

test("shop manager exposes the complete catalog workflow at desktop and 390px", async ({
  page,
}) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "team", id: 1 } })).toString("base64url")}.x`;
  await page.context().addCookies([
    {
      name: "lostsky_token",
      value: token,
      domain: ".lostsky.work",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  const permissions = [
    "shop.product.read",
    "shop.product.write",
    "shop.product.delete",
    "shop.order.read",
    "shop.order.write",
  ];
  await page.route(
    "http://demo.shop.lostsky.work:5179/api/**",
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = null;
      if (path.endsWith("/manage/access")) data = { permissions };
      else if (path.includes("/manage/options"))
        data = {
          entities: [],
          services: [],
          packages: [],
          campaigns: [],
          customers: [],
        };
      else if (path.endsWith("/manage/services"))
        data = {
          total: 1,
          page: 1,
          limit: 20,
          list: [{ id: 7, name: "咨询服务", is_active: 1, handlers: [] }],
        };
      else if (path.endsWith("/manage/packages"))
        data = {
          total: 1,
          page: 1,
          limit: 20,
          list: [
            {
              id: 8,
              name: "十次咨询",
              is_active: 1,
              services: [
                {
                  quantity: 10,
                  valid_days: 365,
                  service: { name: "咨询服务" },
                },
              ],
            },
          ],
        };
      else if (path.endsWith("/manage/campaigns"))
        data = {
          total: 1,
          page: 1,
          limit: 20,
          list: [
            {
              id: 9,
              name: "咨询体验卡",
              mode: 1,
              is_active: 1,
              package: { name: "十次咨询" },
            },
          ],
        };
      else if (path.includes("/order"))
        data = {
          total: 1,
          page: 1,
          limit: 20,
          list: [
            {
              id: 12,
              product_name: "咨询订单",
              quantity: 1,
              total_price: "199.00",
              status: 1,
              create_time: 1_785_000_000,
              customer: { nickname: "晚风客户" },
            },
          ],
        };
      else if (path.endsWith("/product"))
        data = {
          total: 1,
          page: 1,
          limit: 20,
          list: [
            {
              id: 3,
              name: "咨询套餐",
              price: "199.00",
              kind: 2,
              is_active: 1,
              handlers: [],
            },
          ],
        };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: json(data),
      });
    },
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/products");
  await expect(
    page
      .locator("#shop-manage-main")
      .getByRole("heading", { name: "商品", level: 1 }),
  ).toBeVisible();
  const desktopLayout = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("#shop-manage-main")!;
    const page = document.querySelector<HTMLElement>(".manage-page")!;
    const create = main.querySelector<HTMLElement>("button")!;
    const heading = main.querySelector<HTMLElement>("h1")!;
    const pageHeader = main.querySelector<HTMLElement>(".ls-page-header")!;
    const toolbar = main.querySelector<HTMLElement>(".ls-list-toolbar")!;
    const table = main.querySelector<HTMLElement>(".ls-responsive-data-table")!;
    const pager = main.querySelector<HTMLElement>(".pager")!;
    const mainStyle = getComputedStyle(main);
    const pageStyle = getComputedStyle(page);
    const buttonStyle = getComputedStyle(create);
    return {
      mainLeft: Math.round(main.getBoundingClientRect().left),
      headingLeft: Math.round(heading.getBoundingClientRect().left),
      mainPaddingLeft: mainStyle.paddingLeft,
      pageGap: pageStyle.rowGap,
      buttonHeight: Math.round(create.getBoundingClientRect().height),
      buttonBackgroundImage: buttonStyle.backgroundImage,
      toolbarHeight: Math.round(toolbar.getBoundingClientRect().height),
      headerToolbarGap: Math.round(
        toolbar.getBoundingClientRect().top -
          pageHeader.getBoundingClientRect().bottom,
      ),
      toolbarTableGap: Math.round(
        table.getBoundingClientRect().top -
          toolbar.getBoundingClientRect().bottom,
      ),
      tablePagerGap: Math.round(
        pager.getBoundingClientRect().top -
          table.getBoundingClientRect().bottom,
      ),
    };
  });
  expect(desktopLayout).toMatchObject({
    mainLeft: 248,
    headingLeft: 276,
    mainPaddingLeft: "28px",
    pageGap: "24px",
    buttonBackgroundImage: "none",
    headerToolbarGap: 24,
    toolbarTableGap: 24,
    tablePagerGap: 24,
  });
  expect(desktopLayout.buttonHeight).toBeLessThanOrEqual(44);
  expect(desktopLayout.toolbarHeight).toBeLessThanOrEqual(72);
  await page.getByRole("link", { name: "服务", exact: true }).click();
  await expect(
    page
      .locator("#shop-manage-main")
      .getByRole("heading", { name: "服务", level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "权益包", exact: true }).click();
  await expect(page.getByText("十次咨询", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "卡活动", exact: true }).click();
  await expect(page.getByText("咨询体验卡", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "订单", exact: true }).click();
  await expect(page.getByText("咨询订单", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/products");
  await expect(
    page
      .locator("#shop-manage-main")
      .getByRole("heading", { name: "商品", level: 1 }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
});

test("shop manager publishes a service package product through the shared forms", async ({
  page,
}) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "team", id: 1 } })).toString("base64url")}.x`;
  await page.context().addCookies([
    {
      name: "lostsky_token",
      value: token,
      domain: ".lostsky.work",
      path: "/",
      sameSite: "Lax",
    },
  ]);

  const permissions = [
    "shop.product.read",
    "shop.product.write",
    "shop.product.delete",
    "shop.order.read",
    "shop.order.write",
  ];
  const payloads: Record<string, Record<string, unknown>> = {};
  const options = {
    entities: [],
    services: [] as Array<{ id: number; name: string; is_active: number }>,
    packages: [] as Array<{ id: number; name: string; is_active: number }>,
    campaigns: [] as Array<{ id: number; name: string; is_active: number }>,
    customers: [],
  };

  await page.route(
    "http://demo.shop.lostsky.work:5179/api/**",
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      let data: unknown = null;

      if (path.endsWith("/manage/access")) data = { permissions };
      else if (path.endsWith("/manage/options")) data = options;
      else if (path.endsWith("/manage/services") && method === "POST") {
        payloads.service = request.postDataJSON();
        options.services = [{ id: 101, name: "咨询服务", is_active: 1 }];
        data = { id: 101 };
      } else if (path.endsWith("/manage/services/101"))
        data = { id: 101, ...payloads.service, handlers: [] };
      else if (path.endsWith("/manage/packages") && method === "POST") {
        payloads.package = request.postDataJSON();
        options.packages = [{ id: 102, name: "十次咨询", is_active: 1 }];
        data = { id: 102 };
      } else if (path.endsWith("/manage/packages/102"))
        data = { id: 102, ...payloads.package };
      else if (path.endsWith("/manage/campaigns") && method === "POST") {
        payloads.campaign = request.postDataJSON();
        options.campaigns = [{ id: 103, name: "咨询体验卡", is_active: 1 }];
        data = { id: 103 };
      } else if (path.endsWith("/manage/campaigns/103/codes"))
        data = { total: 0, page: 1, limit: 20, list: [] };
      else if (path.endsWith("/manage/campaigns/103"))
        data = { id: 103, ...payloads.campaign };
      else if (path.endsWith("/product") && method === "POST") {
        payloads.product = request.postDataJSON();
        data = { id: 104 };
      } else if (path.endsWith("/product/104/handlers") && method === "POST") {
        payloads.handlers = request.postDataJSON();
      } else if (path.endsWith("/product/104"))
        data = { id: 104, ...payloads.product, handlers: [] };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: json(data),
      });
    },
  );

  await page.goto("http://demo.shop.lostsky.work:5179/manage/services/new");
  await page.locator("#service-name input").fill("咨询服务");
  await page.getByRole("button", { name: "保存服务" }).click();
  await expect(page).toHaveURL(/\/manage\/services\/101$/);
  expect(payloads.service).toMatchObject({ name: "咨询服务" });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/packages/new");
  await page.locator("#package-name input").fill("十次咨询");
  await page.locator('[id^="package-service-"]').click();
  await page.getByText("咨询服务", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存权益包" }).click();
  await expect(page).toHaveURL(/\/manage\/packages\/102$/);
  expect(payloads.package).toMatchObject({
    name: "十次咨询",
    services: [{ service_id: 101, quantity: 1, valid_days: 30 }],
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/campaigns/new");
  await page.locator("#campaign-name input").fill("咨询体验卡");
  await page.locator("#campaign-package").click();
  await page.getByText("十次咨询", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存活动" }).click();
  await expect(page).toHaveURL(/\/manage\/campaigns\/103\/codes$/);
  expect(payloads.campaign).toMatchObject({
    name: "咨询体验卡",
    package_id: 102,
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/products/new");
  await page.locator("#product-name input").fill("咨询套餐");
  await page
    .locator("#product-cover .n-input input")
    .fill("/media/consulting.webp");
  await page.locator("#product-kind").click();
  await page.getByText("服务套餐", { exact: true }).last().click();
  await page.locator("#product-package").click();
  await page.getByText("十次咨询", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page).toHaveURL(/\/manage\/products\/104$/);
  expect(payloads.product).toMatchObject({
    name: "咨询套餐",
    kind: 2,
    benefit_package_id: 102,
    cover_image: "/media/consulting.webp",
  });
  expect(payloads.handlers).toEqual({ entity_ids: [] });
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
