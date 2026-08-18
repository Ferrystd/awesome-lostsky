import { expect, test } from "@playwright/test";

const json = (data: unknown) =>
  JSON.stringify({ code: 0, message: "ok", data });

test("shop manager exposes the complete catalog workflow at desktop and 390px", async ({
  page,
}) => {
  test.setTimeout(120_000);
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
          total: 3,
          page: 1,
          limit: 20,
          list: [
            {
              id: 7,
              name: "咨询服务",
              is_active: 1,
              handlers: [
                { entity_id: 21, subject: { name: "青空团队", slug: "team", type: "team" } },
                { entity_id: 22, subject: { name: "一个名称很长用于验证省略显示的协作成员", slug: "member-long", type: "teamMember" } },
                { entity_id: 23, subject: { name: "协作助手", slug: "helper", type: "teamVirtual" } },
              ],
            },
            { id: 8, name: "不限服务", is_active: 1, handlers: [] },
            {
              id: 9,
              name: "虚拟实体服务",
              is_active: 1,
              handlers: [
                { entity_id: 23, subject: { name: "协作助手", slug: "helper", entityable_type: "teamVirtual" } },
              ],
            },
          ],
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
              customer: { nickname: "晚风顾客" },
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
    const content = main.querySelector<HTMLElement>(".manage-page-content")!;
    const page = document.querySelector<HTMLElement>(".manage-page")!;
    const create = main.querySelector<HTMLElement>(".ls-page-primary-action")!;
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
      contentPaddingLeft: getComputedStyle(content).paddingLeft,
      pageGap: pageStyle.rowGap,
      buttonWidth: Math.round(create.getBoundingClientRect().width),
      buttonHeight: Math.round(create.getBoundingClientRect().height),
      buttonBorderRadius: buttonStyle.borderRadius,
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
    mainPaddingLeft: "0px",
    contentPaddingLeft: "28px",
    pageGap: "24px",
    buttonWidth: 136,
    buttonHeight: 44,
    buttonBorderRadius: "10px",
    buttonBackgroundImage: "none",
    headerToolbarGap: 24,
    toolbarTableGap: 24,
    tablePagerGap: 24,
  });
  expect(desktopLayout.toolbarHeight).toBeLessThanOrEqual(72);
  await page.getByRole("link", { name: "服务", exact: true }).click();
  await expect(
    page
      .locator("#shop-manage-main")
      .getByRole("heading", { name: "服务", level: 1 }),
  ).toBeVisible();
  const handlerTags = page.locator(".service-handler-tags:visible");
  await expect(handlerTags.first().locator(".ls-entity-tag")).toHaveCount(2);
  await expect(handlerTags.first().locator(".ls-entity-tag").first()).toContainText("青空团队");
  await expect(handlerTags.first().locator(".ls-entity-tag").first()).toHaveCSS("border-radius", "999px");
  await expect(handlerTags.first().locator(".ls-status-tag")).toContainText("+1");
  const handlerTrack = await handlerTags.first().evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    wrap: getComputedStyle(element).flexWrap,
    colors: [...element.querySelectorAll<HTMLElement>(".ls-entity-tag")].map(tag => ({
      color: getComputedStyle(tag).color,
      background: getComputedStyle(tag).backgroundColor,
    })),
  }));
  expect(handlerTrack.height).toBeLessThanOrEqual(30.5);
  expect(handlerTrack.scrollWidth).toBeLessThanOrEqual(handlerTrack.clientWidth);
  expect(handlerTrack.wrap).toBe("nowrap");
  expect(new Set(handlerTrack.colors.map(item => item.color)).size).toBeGreaterThan(1);
  expect(handlerTrack.colors.every(item => item.color !== "rgb(54, 65, 67)" && item.background !== "rgb(242, 244, 244)")).toBe(true);
  const semanticColors = await Promise.all(["team", "member", "virtual"].map(async tone => {
    const tag = page.locator(`.service-handler-tags:visible .ls-entity-tag[data-entity-tone="${tone}"]`).first();
    await expect(tag).toBeVisible();
    return tag.evaluate(element => getComputedStyle(element).color);
  }));
  expect(new Set(semanticColors).size).toBe(3);
  expect(semanticColors.every(color => color !== "rgb(54, 65, 67)")).toBe(true);
  await expect(handlerTags.filter({ hasText: "不限" }).first().locator(".ls-status-tag")).toBeVisible();
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
  const mobileAction = page.locator("#shop-manage-main .ls-page-primary-action");
  await expect(mobileAction).toHaveCSS("width", "136px");
  await expect(mobileAction).toHaveCSS("height", "44px");
  await expect(mobileAction).toHaveCSS("border-radius", "10px");
  const mobileActionBox = await mobileAction.boundingBox();
  const mobileActionAreaBox = await page.locator("#shop-manage-main .ls-page-header__actions").boundingBox();
  expect(Math.abs((mobileActionAreaBox?.x ?? 0) + (mobileActionAreaBox?.width ?? 0) - (mobileActionBox?.x ?? 0) - (mobileActionBox?.width ?? 0))).toBeLessThan(1);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.goto("http://demo.shop.lostsky.work:5179/manage/services");
  const mobileHandlerTags = page.locator(".service-handler-tags").first();
  await expect(mobileHandlerTags.locator(".ls-entity-tag")).toHaveCount(2);
  expect(await mobileHandlerTags.evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(30.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("shop manager publishes a service package product through the shared forms", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
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
    entities: [
      { entity_id: 1, type: "team", slug: "demo", name: "test团队" },
      { entity_id: 2, type: "teamMember", slug: "member-1", name: "测试的所有者" },
      { entity_id: 3, type: "teamVirtual", slug: "virtual", name: "协作助手" },
    ],
    services: [] as Array<Record<string, unknown>>,
    packages: [] as Array<Record<string, unknown>>,
    campaigns: [] as Array<Record<string, unknown>>,
    customers: [],
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
        options.services = [{ id: 101, name: "咨询服务", is_active: 1, ...payloads.service }];
        data = { id: 101 };
      } else if (path.endsWith("/manage/services/101"))
        data = { id: 101, ...payloads.service, handlers: [] };
      else if (path.endsWith("/manage/packages") && method === "POST") {
        payloads.package = request.postDataJSON();
        options.packages = [{
          id: 102, name: "十次咨询", pricing_mode: 2, is_active: 1,
          pricing_summary: {
            price: "120.00", cost: "20.00", handler_cut: "60.00",
            sender_cut: "25.00", cs_cut: "5.00", team_cut: "10.00",
          },
        }];
        data = { id: 102 };
      } else if (path.endsWith("/manage/packages/102"))
        data = { id: 102, ...payloads.package, is_pricing_locked: Boolean(payloads.product) };
      else if (path.endsWith("/manage/campaigns") && method === "POST") {
        payloads.campaign = request.postDataJSON();
        options.campaigns = [{ id: 103, name: "咨询体验卡", is_active: 1, package: options.packages[0] }];
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
  await page.locator("#service-handlers").click();
  const entityMenu = page.locator(".ls-entity-select-menu");
  await expect(entityMenu.getByText("test团队", { exact: true })).toBeVisible();
  await expect(entityMenu.getByText("团队", { exact: true })).toBeVisible();
  await expect(entityMenu.getByText("@member-1", { exact: true })).toBeVisible();
  for (const name of ["test团队", "测试的所有者", "协作助手"]) {
    await entityMenu.getByText(name, { exact: true }).click();
  }
  await page.keyboard.press("Escape");
  const selectedEntityTags = page.locator("#service-handlers .ls-entity-tag:visible");
  expect(await selectedEntityTags.count()).toBeGreaterThan(0);
  const selectedEntityGeometry = await page.locator("#service-handlers").evaluate((control) => ({
    controlHeight: control.getBoundingClientRect().height,
    tags: [...control.querySelectorAll<HTMLElement>(".ls-entity-tag")]
      .filter(tag => tag.getBoundingClientRect().width > 0)
      .map(tag => ({
        width: tag.getBoundingClientRect().width,
        height: tag.getBoundingClientRect().height,
        nameHeight: tag.querySelector<HTMLElement>(".ls-entity-tag__name")?.getBoundingClientRect().height ?? 0,
      })),
  }));
  expect(selectedEntityGeometry.controlHeight).toBeLessThanOrEqual(44.5);
  expect(selectedEntityGeometry.tags.length).toBeGreaterThan(0);
  expect(selectedEntityGeometry.tags.every(tag => tag.width <= 192.5 && tag.height <= 30.5 && tag.nameHeight <= 20)).toBe(true);
  await page.locator("#service-handlers").hover();
  await page.locator("#service-handlers .n-base-clear").click();
  await expect(page.locator("#service-price input")).toHaveValue("0.00");
  await expect(page.locator("#service-cost input")).toHaveValue("0.00");
  await page.locator("#service-name input").fill("咨询服务");
  const stepInput = page.locator("#service-step input");
  for (const step of ["1", "0.5", "0.25", "1.01"]) {
    await stepInput.fill(step);
    await stepInput.blur();
    await expect(stepInput).toHaveValue(step);
  }
  await page.locator("#service-price input").fill("10");
  await page.locator("#service-cost input").fill("2");
  await page.locator("#service-name input").focus();
  await expect(page.locator("#service-price input")).toHaveValue("10.00");
  await expect(page.locator("#service-cost input")).toHaveValue("2.00");
  await expect(page.locator("#service-handler-cut input")).toHaveValue("4.80");
  await expect(page.locator("#service-sender-cut input")).toHaveValue("2.00");
  await expect(page.locator("#service-cs-cut input")).toHaveValue("0.40");
  await expect(page.locator("#service-team-cut input")).toHaveValue("0.80");
  await page.getByRole("button", { name: "添加核销字段" }).click();
  const redemptionFieldName = page.locator('[id^="field-name-"] input');
  await expect(redemptionFieldName).toHaveCount(1);
  await redemptionFieldName.fill("预约说明");
  await page.getByRole("button", { name: "保存服务" }).click();
  await expect(page).toHaveURL(/\/manage\/services\/101$/);
  const storefrontPreview = page.getByRole("link", { name: "预览商品" });
  await expect(storefrontPreview).toHaveAttribute("href", "/");
  await expect(storefrontPreview).toHaveAttribute("target", "_blank");
  await expect(storefrontPreview).toHaveClass(/ls-page-primary-action/);
  await expect(page.getByRole("button", { name: "停用服务" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存接单池" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存服务" })).toHaveCount(1);
  expect(payloads.service).toMatchObject({
    name: "咨询服务",
    quantity_step: 1.01,
    default_handler_cut: 4.8,
    default_sender_cut: 2,
    default_cs_cut: 0.4,
    default_team_cut: 0.8,
    handler_entity_ids: [],
    redemption_fields: [{ name: "预约说明", sort: 0 }],
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/packages/new");
  const itemSummary = page.locator(".package-item-summary").first();
  await expect(itemSummary).toHaveAttribute("aria-expanded", "true");
  const packageGeometry = await page.locator(".ls-form-list__item").first().evaluate((item) => {
    const content = item.querySelector<HTMLElement>(".ls-form-list__content")!;
    const actions = item.querySelector<HTMLElement>(".ls-form-list__actions")!;
    const groups = [...item.querySelectorAll<HTMLElement>(".package-field-group")].map((group) => {
      const fields = [...group.querySelectorAll<HTMLElement>(".ls-field")];
      return {
        columns: getComputedStyle(group).gridTemplateColumns.split(" ").length,
        fieldWidths: fields.map((field) => Math.round(field.getBoundingClientRect().width)),
        controlTops: fields.map((field) => Math.round(field.querySelector<HTMLElement>(".ls-field__control")!.getBoundingClientRect().top)),
        controlWidths: fields.map((field) => Math.round(field.querySelector<HTMLElement>(".ls-field__control")!.getBoundingClientRect().width)),
      };
    });
    return {
      contentRight: Math.round(content.getBoundingClientRect().right),
      actionsRight: Math.round(actions.getBoundingClientRect().right),
      groups,
    };
  });
  expect(packageGeometry.contentRight).toBeGreaterThanOrEqual(packageGeometry.actionsRight - 1);
  expect(packageGeometry.groups).toHaveLength(3);
  for (const group of packageGeometry.groups) {
    expect(group.columns).toBe(1);
    expect(Math.max(...group.fieldWidths) - Math.min(...group.fieldWidths)).toBeLessThanOrEqual(1);
    expect(Math.max(...group.controlWidths) - Math.min(...group.controlWidths)).toBeLessThanOrEqual(1);
    for (let index = 1; index < group.controlTops.length; index += 1) {
      expect(group.controlTops[index]).toBeGreaterThan(group.controlTops[index - 1]);
    }
  }
  await itemSummary.click();
  await expect(itemSummary).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('[id^="package-service-"]')).toHaveCount(0);
  await itemSummary.click();
  const priceControl = page.locator('[id^="package-price-"]').first();
  await priceControl.evaluate((control) => control.scrollIntoView({ block: "start" }));
  expect(await priceControl.evaluate((control) => {
    const rect = control.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 20));
    return hit !== null && control.contains(hit);
  })).toBe(true);
  await page.locator("#package-name input").fill("十次咨询");
  await page.locator('[id^="package-service-"]').click();
  await page.getByText("咨询服务（次） · 团队公用", { exact: true }).last().click();
  const savePackage = page.getByRole("button", { name: "保存权益包" });
  const packagePrice = page.locator('[id^="package-price-"] input');
  await expect(packagePrice).toHaveValue("10.00");
  await expect(page.locator('[id^="package-cost-"] input')).toHaveValue("2.00");
  await expect(page.locator('[id^="package-handler-cut-"] input')).toHaveValue("4.80");
  await expect(page.locator('[id^="package-sender-cut-"] input')).toHaveValue("2.00");
  await expect(page.locator('[id^="package-cs-cut-"] input')).toHaveValue("0.40");
  await expect(page.locator('[id^="package-team-cut-"] input')).toHaveValue("0.80");
  await expect(page.locator('[id^="package-distribution-"]')).toHaveCount(0);
  await expect(page.getByText("按可分配金额比例", { exact: true })).toHaveCount(0);
  await packagePrice.fill("");
  await packagePrice.press("Tab");
  await expect(savePackage).toBeDisabled();
  expect(pageErrors).toEqual([]);
  await packagePrice.fill("120");
  await page.locator('[id^="package-cost-"] input').fill("20");
  await page.locator("#package-name input").focus();
  await expect(page.locator('[id^="package-handler-cut-"] input')).toHaveValue("60.00");
  await expect(page.locator('[id^="package-sender-cut-"] input')).toHaveValue("25.00");
  await expect(page.locator('[id^="package-cs-cut-"] input')).toHaveValue("5.00");
  await expect(page.locator('[id^="package-team-cut-"] input')).toHaveValue("10.00");
  await savePackage.click();
  await expect(page).toHaveURL(/\/manage\/packages\/102$/);
  expect(pageErrors).toEqual([]);
  expect(payloads.package).toMatchObject({
    name: "十次咨询",
    pricing_mode: 2,
    services: [{
      service_id: 101, quantity: "1.01", valid_days: 30,
      unit_price: "120.00", unit_cost: "20.00",
      unit_handler_cut: "60.00", unit_sender_cut: "25.00", unit_cs_cut: "5.00",
    }],
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/campaigns/new");
  await page.locator("#campaign-name input").fill("咨询体验卡");
  await page.locator("#campaign-package").click();
  await page.getByText("十次咨询 · 团队公用", { exact: true }).last().click();
  await page.getByRole("button", { name: "保存活动" }).click();
  await expect(page).toHaveURL(/\/manage\/campaigns\/103\/codes$/);
  expect(payloads.campaign).toMatchObject({
    name: "咨询体验卡",
    package_id: 102,
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/products/new");
  await page.locator("#product-name input").fill("咨询套餐");
  await page.locator("input#product-cover").fill("/media/consulting.webp");
  await page.locator("#product-kind").click();
  await page.getByText("服务套餐", { exact: true }).last().click();
  await page.locator("#product-package").click();
  await page.locator(".n-base-select-option").filter({ hasText: "十次咨询" }).last().click();
  await expect(page.locator("#product-price input")).toHaveValue("120.00");
  await expect(page.locator("#product-price input")).toBeDisabled();
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page).toHaveURL(/\/manage\/products\/104$/);
  expect(payloads.product).toMatchObject({
    name: "咨询套餐",
    kind: 2,
    benefit_package_id: 102,
    cover_image: "/media/consulting.webp",
    price: 120,
    cost: 20,
    handler_cut: 60,
    sender_cut: 25,
    cs_cut: 5,
    team_cut: 10,
  });
  expect(payloads.handlers).toEqual({ entity_ids: [] });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/packages/102");
  await expect(page.locator("#shop-manage-main").getByRole("heading", { name: "编辑权益包", level: 1 })).toBeVisible();
  await expect(page.locator('[id^="package-price-"] input')).toHaveValue("120.00");
  await expect(page.locator('[id^="package-price-"] input')).toBeDisabled();
  await page.getByRole("button", { name: "复制为新权益包" }).click();
  await expect(page).toHaveURL(/\/manage\/packages\/new\?copy=102$/);
  await expect(page.locator("#shop-manage-main").getByRole("heading", { name: "复制权益包", level: 1 })).toBeVisible();
  await expect(page.locator('[id^="package-price-"] input')).toBeEnabled();
  await expect(page.locator('[id^="package-price-"] input')).toHaveValue("120.00");
  const mobilePackageGeometry = await page.locator(".package-item-fields").first().evaluate((item) => ({
    columns: [...item.querySelectorAll<HTMLElement>(".package-field-group")].map((group) => getComputedStyle(group).gridTemplateColumns.split(" ").length),
    itemWidth: Math.round(item.getBoundingClientRect().width),
    fieldWidths: [...item.querySelectorAll<HTMLElement>(".ls-field")].map((field) => Math.round(field.getBoundingClientRect().width)),
  }));
  expect(mobilePackageGeometry.columns).toEqual([1, 1, 1]);
  expect(mobilePackageGeometry.fieldWidths.every((width) => Math.abs(width - mobilePackageGeometry.itemWidth) <= 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("shop manager adds and saves a name-only redemption field", async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "team", id: 1 } })).toString("base64url")}.x`;
  await page.context().addCookies([{
    name: "lostsky_token",
    value: token,
    domain: ".lostsky.work",
    path: "/",
    sameSite: "Lax",
  }]);

  let servicePayload: Record<string, unknown> | null = null;
  await page.route("http://demo.shop.lostsky.work:5179/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = null;
    if (path.endsWith("/manage/access")) {
      data = { permissions: ["shop.product.read", "shop.product.write"] };
    } else if (path.endsWith("/manage/options")) {
      data = {
        entities: [], services: [], packages: [], campaigns: [], customers: [],
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
    } else if (path.endsWith("/manage/services") && request.method() === "POST") {
      servicePayload = request.postDataJSON();
      data = { id: 101 };
    } else if (path.endsWith("/manage/services/101")) {
      data = { id: 101, ...servicePayload, handlers: [] };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: json(data) });
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/services/new");
  await page.locator("#service-name input").fill("咨询服务");
  await page.getByRole("button", { name: "添加核销字段" }).click();
  const fieldName = page.locator('[id^="field-name-"] input');
  await expect(fieldName).toHaveCount(1);
  await fieldName.fill("预约说明");
  await page.getByRole("button", { name: "保存服务" }).click();
  await expect(page).toHaveURL(/\/manage\/services\/101$/);

  expect(servicePayload).toMatchObject({
    redemption_fields: [{ name: "预约说明", sort: 0 }],
  });
  expect((servicePayload?.redemption_fields as Array<Record<string, unknown>>)[0]).not.toHaveProperty("field_key");
});

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
    } else if (path.endsWith("/personal/products/204/handlers") && method === "POST") {
      payloads.handlers = request.postDataJSON();
    } else if (path.endsWith("/personal/products/204")) {
      data = { id: 204, ...payloads.product, entity_id: 71, handlers: [] };
    } else if (path.endsWith("/personal/products")) {
      data = { total: 1, page: 1, limit: 20, list: [{ id: 204, name: "本人咨询", price: "66.00", is_active: 1, handlers: [] }] };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: json(data) });
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/products/new");
  await expect(page.locator("#shop-manage-main").getByRole("heading", { name: "新建本人商品", level: 1 })).toBeVisible();
  await expect(page.getByText("此商品自动归属当前已领取的 Entity，个人工作台不能转移归属。", { exact: true })).toBeVisible();
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
  const costSection = await page.locator("#product-cost").evaluate((control) =>
    control.closest(".ls-form-section")?.querySelector("h2")?.textContent,
  );
  expect(costSection).toBe("默认分成");
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
    handler_cut: 36,
    sender_cut: 15,
    cs_cut: 3,
    team_cut: 6,
    expected_entity_id: 71,
  });
  expect(payloads.product).not.toHaveProperty("entity_id");
  expect(payloads.handlers).toEqual({ entity_ids: [], expected_entity_id: 71 });

  const preview = page.getByRole("link", { name: "预览前台" });
  await expect(preview).toHaveAttribute("href", "/product/204");
  await expect(preview).toHaveAttribute("target", "_blank");
  await expect(preview).toHaveClass(/ls-page-primary-action/);
  await expect(page.getByRole("button", { name: "下架商品" })).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/products");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Shop personal workspace completes the self-owned card service chain", async ({ page }) => {
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: "teamMember", id: 11 } })).toString("base64url")}.x`;
  await page.context().addCookies([{ name: "lostsky_token", value: token, domain: ".lostsky.work", path: "/", sameSite: "Lax" }]);

  const payloads: Record<string, Record<string, unknown>> = {};
  const sharedService = {
    id: 10, team_id: 1, owner_entity_id: null, owner: null, name: "团队共享咨询", description: "", unit_name: "次",
    quantity_step: "1", default_total_price: "80.00", default_cost: "8.00", default_handler_cut: "40.00",
    default_sender_cut: "16.00", default_cs_cut: "4.00", default_team_cut: "12.00", is_active: 1,
  };
  const ownService = { ...sharedService, id: 201, owner_entity_id: 71, name: "本人复盘", default_total_price: "100.00" };
  const ownPackage = {
    id: 301, owner_entity_id: 71, name: "本人复盘权益包", pricing_mode: 2, is_active: 1,
    pricing_summary: { price: "80.00", cost: "8.00", handler_cut: "40.00", sender_cut: "16.00", cs_cut: "4.00", team_cut: "12.00" },
    services: [{ id: 1, service_id: 10, quantity: "1", valid_days: 30, unit_price: "80.00", unit_cost: "8.00", unit_handler_cut: "40.00", unit_sender_cut: "16.00", unit_cs_cut: "4.00", sort: 0, service: sharedService }],
  };
  const ownCampaign = { id: 401, owner_entity_id: 71, name: "本人复盘卡", package_id: 301, claim_group: "self-card", mode: 1, total_limit: null, per_target_limit: 1, redeem_starts_at: 0, redeem_ends_at: 0, is_active: 1, package: ownPackage };

  await page.route("http://demo.shop.lostsky.work:5179/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    let data: unknown = null;
    if (path.endsWith("/manage/access")) {
      data = { team: { id: 1, slug: "demo", name: "青空协作组" }, identity: { type: "teamMember", entity_id: 71, name: "青空接单人" }, permissions: ["shop.product.self.manage"] };
    } else if (path.endsWith("/personal/products/options")) {
      data = {
        entities: [{ entity_id: 71, name: "当前成员" }], services: [sharedService, ownService], packages: [ownPackage], campaigns: [ownCampaign],
        service_defaults: { default_unit_name: "次", default_quantity_step: "1", default_valid_days: 30, allow_customer_open_dispatch: true, default_handler_rate_percent: 60, default_sender_rate_percent: 25, default_cs_rate_percent: 5 },
      };
    } else if (path.endsWith("/personal/services") && method === "POST") {
      payloads.service = request.postDataJSON(); data = { id: 201 };
    } else if (path.endsWith("/personal/services/201")) {
      data = { ...ownService, ...payloads.service, handlers: [] };
    } else if (path.endsWith("/personal/packages") && method === "POST") {
      payloads.package = request.postDataJSON(); data = { id: 301 };
    } else if (path.endsWith("/personal/packages/301")) {
      data = ownPackage;
    } else if (path.endsWith("/personal/campaigns") && method === "POST") {
      payloads.campaign = request.postDataJSON(); data = { id: 401 };
    } else if (path.endsWith("/personal/campaigns/401/codes") && method === "POST") {
      payloads.codes = request.postDataJSON(); data = [{ id: 501, campaign_id: 401, code: "SELF-CARD-001", code_hint: "SELF…001", use_count: 0, max_uses: 1, expire_time: 0, is_active: 1, create_time: 1786579200 }];
    } else if (path.endsWith("/personal/campaigns/401/codes")) {
      data = { total: 0, page: 1, limit: 20, list: [] };
    } else if (path.endsWith("/personal/campaigns/401")) {
      data = ownCampaign;
    } else if (path.endsWith("/personal/products") && method === "POST") {
      payloads.product = request.postDataJSON(); data = { id: 601 };
    } else if (path.endsWith("/personal/products/601/handlers") && method === "POST") {
      payloads.handlers = request.postDataJSON();
    } else if (path.endsWith("/personal/products/601")) {
      data = { id: 601, ...payloads.product, entity_id: 71, handlers: [], redemption_campaign: ownCampaign };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: json(data) });
  });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/services/new");
  await page.locator("#service-name input").fill("本人复盘");
  await page.locator("#service-unit input").fill("次");
  await page.locator("#service-price input").fill("100");
  await page.getByRole("button", { name: "保存服务" }).click();
  await expect(page).toHaveURL(/\/manage\/personal\/services\/201$/);
  expect(payloads.service).toMatchObject({ name: "本人复盘", expected_entity_id: 71 });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/packages/new");
  await page.locator("#package-name input").fill("本人复盘权益包");
  await page.locator('[id^="package-service-"]').click();
  await page.getByText("团队共享咨询（次） · 团队公用", { exact: true }).click();
  await expect(page.locator('[id^="package-price-"] input')).toHaveValue("80.00");
  await expect(page.locator('[id^="package-price-"] input')).toBeDisabled();
  await expect(page.locator('[id^="package-quantity-"] input')).toBeEnabled();
  await expect(page.getByText(/shop\.product\.self\.package\.reprice/)).toBeVisible();
  await page.getByRole("button", { name: "保存权益包" }).click();
  await expect(page).toHaveURL(/\/manage\/personal\/packages\/301$/);
  expect(payloads.package).toMatchObject({ expected_entity_id: 71, services: [{ service_id: 10, unit_price: "80.00" }] });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/campaigns/new");
  await page.locator("#campaign-name input").fill("本人复盘卡");
  await page.locator("#campaign-package").click();
  await page.getByText("本人复盘权益包 · 本人", { exact: true }).click();
  await page.getByRole("button", { name: "保存活动" }).click();
  await expect(page).toHaveURL(/\/manage\/personal\/campaigns\/401\/codes$/);
  await page.getByRole("button", { name: "发行兑换码" }).click();
  await expect(page.getByText("SELF-CARD-001", { exact: true })).toBeVisible();
  expect(payloads.codes).toMatchObject({ expected_entity_id: 71 });

  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/products/new");
  await page.locator("#product-name input").fill("本人复盘服务卡");
  await page.locator("input#product-cover").fill("/media/self-card.webp");
  await page.locator("#product-kind").click();
  await page.getByText("权益卡密", { exact: true }).click();
  await page.locator("#product-campaign").click();
  await page.getByText("本人复盘卡 · 本人", { exact: true }).click();
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page).toHaveURL(/\/manage\/personal\/products\/601$/);
  expect(payloads.product).toMatchObject({ redemption_campaign_id: 401, expected_entity_id: 71 });

  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("http://demo.shop.lostsky.work:5179/manage/personal/packages/301");
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
