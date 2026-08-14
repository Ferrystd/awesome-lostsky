import { defineComponent, h } from "vue";
import { NInput } from "naive-ui";
import { useQueryClient } from "@tanstack/vue-query";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsWorkspaceOverview from "@lostsky/ui/components/LsWorkspaceOverview.vue";
import { BadgeCheck, BarChart3, House, ReceiptText, ShoppingBag, UserRound } from "@lucide/vue";
import AuthShell from "../../apps/account/src/components/AuthShell.vue";
import SmsCodeField from "../../apps/account/src/components/SmsCodeField.vue";
import AdminShell from "../../apps/admin/src/components/AdminShell.vue";
import ReasonDialog from "../../apps/admin/src/components/ReasonDialog.vue";
import DocumentList from "../../apps/display/src/components/DocumentList.vue";
import EntityList from "../../apps/display/src/components/EntityList.vue";
import ProductList from "../../apps/display/src/components/ProductList.vue";
import ProfileMedia from "../../apps/display/src/components/ProfileMedia.vue";
import PublicDocumentSection from "../../apps/display/src/components/PublicDocumentSection.vue";
import PublicFields from "../../apps/display/src/components/PublicFields.vue";
import AdminPage from "../../apps/team/src/components/AdminPage.vue";
import AdminPageHeader from "../../apps/team/src/components/AdminPageHeader.vue";
import EntityFieldsCard from "../../apps/team/src/components/EntityFieldsCard.vue";
import EntityPermissionsCard from "../../apps/team/src/components/EntityPermissionsCard.vue";
import EntityProfileFields from "../../apps/team/src/components/EntityProfileFields.vue";
import TeamShell from "../../apps/team/src/components/TeamShell.vue";
import TransactionShell from "../../apps/transaction/src/components/TransactionShell.vue";
import PersonalServiceLists from "../../apps/transaction/src/components/PersonalServiceLists.vue";
import ShopManageShell from "../../apps/shop/src/components/ShopManageShell.vue";
import ProductFieldsEditor from "../../apps/shop/src/components/ProductFieldsEditor.vue";
import ResourceOwnerTag from "../../apps/shop/src/components/ResourceOwnerTag.vue";
import {
  previewStates,
  type PreviewState,
  type StoryDefinition,
} from "./story-types";

const layout: PreviewState[] = ["default", "mobile"];
const interactive: PreviewState[] = [
  "default",
  "hover",
  "focus",
  "active",
  "disabled",
  "mobile",
];
const stage = (children: unknown, className = "") =>
  h("div", { class: ["story-stage", className] }, children as never);
const unsupportedDefaults: Record<PreviewState, string> = {
  default: "默认状态为必选项。",
  hover: "该组件没有可悬停的交互目标。",
  focus: "该组件不接收键盘焦点。",
  active: "该组件没有激活或选中状态。",
  disabled: "该组件没有整体禁用或只读状态。",
  loading: "该组件不负责表达加载状态。",
  error: "该组件不负责表达错误或空状态。",
  mobile: "移动端状态为必选项。",
};
const story = (
  name: string,
  supported: PreviewState[],
  render: StoryDefinition["render"],
  reason: StoryDefinition["reason"] = {},
): StoryDefinition => ({
  name,
  supported,
  render,
  reason: Object.fromEntries(
    previewStates
      .filter((state) => !supported.includes(state))
      .map((state) => [state, reason[state] || unsupportedDefaults[state]]),
  ),
});

const imageData =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="960" height="540"%3E%3Cdefs%3E%3ClinearGradient id="g" x2="1" y2="1"%3E%3Cstop stop-color="%23006f66"/%3E%3Cstop offset="1" stop-color="%23223366"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="960" height="540" fill="url(%23g)"/%3E%3Ccircle cx="700" cy="170" r="110" fill="%23ffffff" fill-opacity=".12"/%3E%3C/svg%3E';
const profile = {
  name: "青空成员",
  avatar: null,
  description: "负责内容维护与客户协作。",
  intro_image: imageData,
  intro_video:
    "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=",
  introduction_markdown: "",
  document_tags: [],
};
const entity = {
  slug: "qingkong",
  type: "teamMember" as const,
  name: "青空成员",
  avatar: null,
  description: "内容维护与客户协作",
  roles: [{ name: "内容主理人", description: "维护公开资料" }],
  status_code: "departed" as const,
  status_label: "已离队",
};
const documents = [
  {
    id: 11,
    title: "团队协作指南",
    tags: ["指南"],
    sort: 10,
    update_time: 1_782_633_600,
    entity,
  },
];
const products = [
  {
    id: 1,
    name: "夜航陪伴",
    description: "一段被认真准备的体验。",
    cover_image: imageData,
    price: "39.00",
    href: "//demo.shop.lostsky.work/product/1",
  },
];

const authShell = story("AuthShell", layout, () =>
  h(
    AuthShell,
    { title: "欢迎回来", intro: "登录后继续管理你的团队、资料与协作。" },
    {
      default: () =>
        stage(
          [
            h("label", "手机号"),
            h(NInput, { value: "13800138000" }),
            h(LsButton, null, { default: () => "登录" }),
          ],
          "story-form",
        ),
    },
  ),
);

const smsCodeField = story(
  "SmsCodeField",
  interactive,
  (state) =>
    stage(
      h(SmsCodeField, {
        modelValue: "123456",
        phone: state === "disabled" ? "" : "13800138000",
        purpose: "login",
        id: `sms-${state}`,
      }),
    ),
  {
    loading: "发送中的状态由短信请求触发，不暴露外部参数。",
    error: "请求错误只在实际发送失败后出现。",
  },
);

const adminShell = story(
  "AdminShell",
  ["default", "hover", "focus", "active", "mobile"],
  () =>
    h(AdminShell, null, {
      default: () =>
        h("section", { class: "shell-content" }, [
          h("h2", "平台总览"),
          h("p", "查看用户、团队和系统运行状态。"),
          h(LsButton, { "data-preview-target": "" }, { default: () => "查看团队" }),
        ]),
    }),
  {
    disabled: "平台壳层没有整体禁用状态。",
    loading: "页面内容负责表达加载状态。",
    error: "路由内容负责表达错误状态。",
  },
);

const reasonDialog = story(
  "ReasonDialog",
  ["default", "hover", "focus", "active", "disabled", "loading", "mobile"],
  (state) =>
    h(ReasonDialog, {
      show: true,
      title: "确认封禁团队",
      consequence: "封禁后团队成员将无法继续进入工作台。",
      actionLabel: "确认封禁",
      danger: true,
      loading: state === "loading",
    }),
  { error: "字段校验在用户输入后就近显示。" },
);

const documentList = story(
  "DocumentList",
  ["default", "hover", "focus", "active", "error", "mobile"],
  (state) =>
    stage(h(DocumentList, { documents: state === "error" ? [] : documents })),
  { disabled: "公开文档列表只读。", loading: "加载由父级文档区表达。" },
);

const entityList = story(
  "EntityList",
  ["default", "hover", "focus", "active", "error", "mobile"],
  (state) =>
    stage(
      h(EntityList, {
        entities:
          state === "error"
            ? []
            : [
                entity,
                {
                  ...entity,
                  slug: "helper",
                  type: "teamVirtual",
                  name: "协作助手",
                  status_code: null,
                  status_label: null,
                },
              ],
        preview: true,
      }),
    ),
  { disabled: "公开实体列表只读。", loading: "加载由页面表达。" },
);

const productList = story(
  "ProductList",
  ["default", "hover", "focus", "active", "error", "mobile"],
  (state) =>
    stage(h(ProductList, { products: state === "error" ? [] : products })),
  { disabled: "公开商品列表只读。", loading: "加载由页面表达。" },
);

const profileMedia = story(
  "ProfileMedia",
  ["default", "error", "mobile"],
  (state) =>
    stage(
      h(ProfileMedia, {
        profile:
          state === "error" ? { ...profile, intro_video: null } : profile,
      }),
    ),
  {
    hover: "媒体容器没有悬停动作。",
    focus: "媒体不是命令控件。",
    active: "媒体没有选中状态。",
    disabled: "公开媒体只读。",
    loading: "加载由浏览器媒体元素表达。",
  },
);

const publicDocumentSection = story(
  "PublicDocumentSection",
  ["default", "hover", "focus", "active", "loading", "error", "mobile"],
  (state) =>
    stage(
      h(PublicDocumentSection, {
        title: "精选文档",
        description: "团队持续维护的公开说明。",
        documents: state === "error" || state === "loading" ? [] : documents,
        loading: state === "loading",
        error: state === "error",
      }),
    ),
  { disabled: "公开文档区只读。" },
);

const publicFields = story(
  "PublicFields",
  ["default", "error", "mobile"],
  (state) =>
    stage(
      h(PublicFields, {
        fields:
          state === "error"
            ? []
            : [
                {
                  key: "founded",
                  name: "成立年份",
                  value_type: "int",
                  value: 2025,
                },
                {
                  key: "available",
                  name: "当前在线",
                  value_type: "bool",
                  value: 1,
                },
              ],
      }),
    ),
  {
    hover: "公开字段没有悬停动作。",
    focus: "公开字段不是命令控件。",
    active: "公开字段没有选中状态。",
    disabled: "公开字段只读。",
    loading: "加载由页面表达。",
  },
);

const adminPage = story("AdminPage", layout, () =>
  h(
    AdminPage,
    { width: "content" },
    {
      default: () =>
        stage([h("h2", "客户详情"), h("p", "内容区域遵循详情页最大宽度。")]),
    },
  ),
);

const adminPageHeader = story(
  "AdminPageHeader",
  interactive,
  (state) =>
    stage(
      h(
        AdminPageHeader,
        {
          title: "成员",
          description: "查看团队成员、当前状态与可执行操作。",
          backTo: "/",
          backLabel: "返回工作台",
        },
        {
          actions: () =>
            h(
              LsButton,
              { disabled: state === "disabled" },
              { default: () => "添加成员" },
            ),
        },
      ),
    ),
  { loading: "标题不负责页面加载。", error: "错误由页面内容区域表达。" },
);

const fieldDefinitions = [
  {
    id: 1,
    name: "公开称号",
    field_key: "title",
    value_type: "string",
    input_type: "text",
    is_required: 1,
    is_editable: 1,
    can_edit: true,
  },
  {
    id: 2,
    name: "工作状态",
    field_key: "status",
    value_type: "select",
    input_type: "select",
    options: [
      { label: "可接单", value: "available" },
      { label: "忙碌", value: "busy" },
    ],
    is_editable: 1,
    can_edit: true,
  },
];
const entityFieldsCard = story(
  "EntityFieldsCard",
  [
    "default",
    "hover",
    "focus",
    "active",
    "disabled",
    "loading",
    "error",
    "mobile",
  ],
  (state) =>
    stage(
      h(EntityFieldsCard, {
        fields: fieldDefinitions,
        storedValues: [
          { field_id: 1, value_string: "内容主理人" },
          { field_id: 2, value_string: "available" },
        ],
        mode: state === "disabled" ? "readonly" : "manager",
        loading: state === "loading",
        saving: false,
        error: state === "error" ? new Error("字段暂时无法读取") : undefined,
      }),
    ),
);

const roles = [
  {
    id: 1,
    name: "内容成员",
    role_key: "content",
    description: "维护团队内容",
    permissions: [
      { permission_key: "team.document.read" },
      { permission_key: "team.document.write" },
      { permission_key: "team.customer.read" },
      { permission_key: "chat.conversation.create" },
      { permission_key: "chat.virtual.*.act" },
      { permission_key: "identity.member.*.assume" },
      { permission_key: "identity.member.member-2.assume" },
      { permission_key: "identity.member.member-2" },
    ],
  },
  {
    id: 2,
    name: "客户运营",
    role_key: "customer",
    description: "维护客户资料",
    permissions: [
      { permission_key: "team.customer.read" },
      { permission_key: "identity.member.member-2.assume" },
    ],
  },
];
const entityPermissionsCard = story(
  "EntityPermissionsCard",
  [
    "default",
    "hover",
    "focus",
    "active",
    "disabled",
    "loading",
    "error",
    "mobile",
  ],
  (state) =>
    stage(
      h(EntityPermissionsCard, {
        assignments: [
          { role_id: 1, role: roles[0] },
          { role_id: 2, role: roles[1] },
        ],
        roles,
        effectivePermissions: [
          { key: "team.document.read", label: "查看文档", group: "内容" },
          { key: "team.document.write", label: "维护文档", group: "内容" },
          { key: "team.customer.read", label: "查看客户", group: "客户" },
          { key: "team.customer.read", label: "查看客户", group: "客户" },
          { key: "chat.conversation.create", label: "创建会话", group: "聊天" },
          { key: "chat.virtual.*.act", label: "代表全部虚拟实体参与聊天", group: "聊天" },
          { key: "identity.member.*.assume", label: "领取全部成员身份", group: "实体委托" },
          { key: "identity.member.member-2.assume", label: "领取成员二号身份", group: "实体委托" },
          { key: "identity.member.member-2.assume", label: "领取成员二号身份", group: "实体委托" },
          { key: "identity.member.member-2", label: "覆盖 identity.member.member-2 下全部权限", group: "实体委托" },
          { key: "team.ability", label: "覆盖 team.ability 下全部权限", group: "高级范围" },
        ],
        catalog: [
          {
            name: "内容",
            items: [
              { key: "team.document.read", label: "查看文档" },
              { key: "team.document.write", label: "维护文档" },
            ],
          },
          { name: "客户", items: [{ key: "team.customer.read", label: "查看客户" }] },
          {
            name: "聊天",
            items: [
              { key: "chat.conversation.create", label: "创建会话" },
              { key: "chat.virtual.*.act", label: "代表全部虚拟实体参与聊天" },
            ],
          },
          {
            name: "实体委托",
            items: [
              { key: "identity.member.*.assume", label: "领取全部成员身份" },
              { key: "identity.member.member-2.assume", label: "领取成员二号身份" },
            ],
          },
        ],
        advancedCatalog: [
          { key: "identity.member.member-2", label: "覆盖 identity.member.member-2 下全部权限", covered_keys: ["identity.member.member-2.assume"] },
          { key: "team.ability", label: "覆盖 team.ability 下全部权限", covered_keys: ["team.ability.redeem"] },
        ],
        canEdit: state !== "disabled",
        loading: state === "loading",
        error: state === "error" ? new Error("权限暂时无法读取") : undefined,
      }),
    ),
);

const memberProfile = {
  nickname: "青空成员",
  avatar: "",
  description: "负责内容维护与客户协作。",
  intro_image: "",
  intro_video: "",
  introduction_markdown: "## 自我介绍\n\n今天也在认真维护团队资料。",
};
const entityProfileFields = story(
  "EntityProfileFields",
  ["default", "hover", "focus", "active", "disabled", "loading", "mobile"],
  (state) =>
    stage(
      h(EntityProfileFields, {
        modelValue: { ...memberProfile },
        draftKey: "",
        idPrefix: "preview-profile",
        nameKey: "nickname",
        nameLabel: "团队昵称",
        uploadFile: async () => "//assets.lostsky.work/avatar.png",
        uploadDisabledReason:
          state === "disabled" ? "当前团队未开通文件上传" : "",
        uploading: state === "loading",
        editorReady: true,
      }),
      "story-stage--profile",
    ),
  { error: "保存错误由所属成员表单表达。" },
);

const teamShell = story(
  "TeamShell",
  ["default", "hover", "focus", "active", "mobile"],
  () =>
    h(TeamShell, null, {
      default: () =>
        h("section", { class: "shell-content" }, [
          h("h2", "团队概览"),
          h("p", "实体、成员、通知和文档集中在同一工作台。"),
          h(
            LsButton,
            { "data-preview-target": "" },
            { default: () => "打开成员列表" },
          ),
        ]),
    }),
  {
    disabled: "工作台壳层没有整体禁用状态。",
    loading: "内部导航保持稳定，内容区域负责加载。",
    error: "内容错误不替换工作台壳层。",
  },
);

const transactionShell = story(
  "TransactionShell",
  layout,
  () =>
    h(TransactionShell, null, {
      default: () =>
        h(LsWorkspaceOverview, {
          eyebrow: "记账团队工作台",
          title: "青空协作组",
          description: "从流水到核销和客户协作，按经营任务进入对应区域。",
          actions: [{ key: "personal", label: "进入个人工作台", to: "/personal", icon: UserRound, primary: true }],
          entries: [
            { key: "transactions", label: "流水", description: "查看团队收入、支出与调整记录。", to: "/", icon: ReceiptText },
            { key: "stats", label: "经营统计", description: "查看团队收入结构与业绩汇总。", to: "/stats", icon: BarChart3 },
            { key: "services", label: "服务核销", description: "处理服务实例并记录核销过程。", to: "/services", icon: BadgeCheck },
          ],
          scopeNotes: ["概览不请求流水或统计数据。"],
        }),
    }),
  {
    disabled: "工作台壳层没有整体禁用状态。",
    loading: "内容区域负责加载。",
    error: "内容错误不替换工作台壳层。",
  },
);

const personalServiceLists = story(
  "PersonalServiceLists",
  ["default", "loading", "mobile"],
  (state) => stage(h(PersonalServiceLists, {
    offers: [{ id: 8, status: 1, quantity: "0.5", create_time: 1786400000, total_price: "60.00", handler_cut: "48.00", service: { name: "候选人面试" }, customer: { profile: { name: "示例客户" } }, entitlement: { quantity_step: "0.5000", unit_name: "人" }, redemption_fields: [{ id: 1, name: "微信号", value_type: "string", input_type: "text", fill_stage: "customer", is_required: 1, value: "candidate-a" }] }],
    available: [{ id: 21, quantity: "1.0", status: 2, expire_time: 0, service: { name: "咨询服务" }, customer: { profile: { name: "示例客户" } }, entitlement: { quantity_step: "0.5000", unit_name: "小时" }, redemption_fields: [{ id: 2, name: "预约说明", value_type: "string", input_type: "text", fill_stage: "customer", is_required: 1, value: "凌晨时段" }] }],
    assigned: [{ id: 18, quantity: "2.0", status: 2, status_label: "核销中", expire_time: 0, service: { name: "方案复盘" }, customer: { profile: { name: "示例客户" } }, entitlement: { quantity_step: "0.5000", unit_name: "小时" } }],
    acting: state === "loading",
  }), state === "mobile" ? "story-stage--mobile" : ""),
  { disabled: "列表不提供整体禁用状态。", error: "读取错误由页面级异步状态表达。" },
);

const shopManageShell = story(
  "ShopManageShell",
  layout,
  () =>
    h(ShopManageShell, null, {
      default: () =>
        h(LsWorkspaceOverview, {
          eyebrow: "商品团队工作台",
          title: "青空协作组",
          description: "集中维护商品、订单与履约配置。",
          actions: [{ key: "personal", label: "进入个人工作台", to: "/manage/personal", icon: UserRound, primary: true }],
          entries: [
            { key: "products", label: "商品", description: "维护可售商品、处理人和核销字段。", to: "/manage/products", icon: ShoppingBag },
            { key: "orders", label: "订单", description: "查看团队订单并持续推进履约状态。", to: "/manage/orders", icon: ReceiptText },
            { key: "team", label: "团队模式", description: "返回团队经营配置。", to: "/manage", icon: House },
          ],
          scopeNotes: ["概览不请求商品或订单数据。"],
        }),
    }),
  {
    disabled: "商城管理壳层没有整体禁用状态。",
    loading: "内容区域负责表达加载状态。",
    error: "内容错误不替换商城管理壳层。",
  },
);

const resourceOwnerTag = story(
  "ResourceOwnerTag",
  layout,
  state => stage(h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap" }, [
    h(ResourceOwnerTag, { resource: { owner_entity_id: null, owner: null } }),
    h(ResourceOwnerTag, { resource: { owner_entity_id: 71, owner: { name: "青空接单人", slug: "handler", type: "teamMember" } } }),
    h(ResourceOwnerTag, { resource: { owner_entity_id: 88, owner: { name: "服务助手", slug: "service-bot", type: "teamVirtual" } } }),
  ]), state === "mobile" ? "story-stage--mobile" : ""),
  {
    disabled: "归属标签不提供禁用交互。",
    loading: "归属数据由所属列表负责加载。",
    error: "缺失 Owner 摘要时组件使用 Entity ID 作为可识别回退。",
  },
);

const ProductFieldsEditorHost = defineComponent({
  setup() {
    const client = useQueryClient();
    const key = ["product-fields", "team", 901];
    client.setQueryDefaults(key, { staleTime: Infinity });
    client.setQueryData(key, [{
      id: 31,
      field_key: "appointment_note",
      name: "预约说明",
      value_type: "string",
      input_type: "textarea",
      options: [],
      fill_stage: "customer",
      is_customer_visible: 1,
      is_required: 1,
      is_active: 1,
      sort: 0,
    }]);
    return () => h(ProductFieldsEditor, { productId: 901, scope: "team" });
  },
});

const productFieldsEditor = story(
  "ProductFieldsEditor",
  ["default", "hover", "focus", "active", "mobile"],
  state => stage(h(ProductFieldsEditorHost), state === "mobile" ? "story-stage--mobile" : ""),
  {
    disabled: "字段权限由所属商品编辑页控制。",
    loading: "读取状态由组件内的查询骨架表达，不作为静态夹具。",
    error: "读取失败由组件内的区域错误表达，不作为静态夹具。",
  },
);

export const appStories: Record<string, StoryDefinition> = {
  AuthShell: authShell,
  SmsCodeField: smsCodeField,
  AdminShell: adminShell,
  ReasonDialog: reasonDialog,
  DocumentList: documentList,
  EntityList: entityList,
  ProductList: productList,
  ProfileMedia: profileMedia,
  PublicDocumentSection: publicDocumentSection,
  PublicFields: publicFields,
  AdminPage: adminPage,
  AdminPageHeader: adminPageHeader,
  EntityFieldsCard: entityFieldsCard,
  EntityPermissionsCard: entityPermissionsCard,
  EntityProfileFields: entityProfileFields,
  TeamShell: teamShell,
  TransactionShell: transactionShell,
  PersonalServiceLists: personalServiceLists,
  ProductFieldsEditor: productFieldsEditor,
  ResourceOwnerTag: resourceOwnerTag,
  ShopManageShell: shopManageShell,
};
