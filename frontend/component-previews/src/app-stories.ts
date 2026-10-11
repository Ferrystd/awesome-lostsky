import TeamNoticeRow from '../../apps/team/src/components/TeamNoticeRow.vue';
import WeiboAccountField from '../../apps/weibo/src/components/WeiboAccountField.vue';
import TeamSettingsGroup from '../../apps/team/src/components/TeamSettingsGroup.vue';
import TeamCategoryLayout from '../../apps/team/src/components/TeamCategoryLayout.vue';
import TeamCategoryNavigation from '../../apps/team/src/components/TeamCategoryNavigation.vue';
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue';
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue';
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue';
import WeiboCommentFields from '../../apps/weibo/src/components/WeiboCommentFields.vue';
import WeiboFeedCommentComposer from '../../apps/weibo/src/components/WeiboFeedCommentComposer.vue';
import JoinApplicationFields from '../../apps/team/src/components/JoinApplicationFields.vue';
import TeamSectionNav from '../../apps/team/src/components/TeamSectionNav.vue';
import TeamShareLinks from '../../apps/team/src/components/TeamShareLinks.vue';
import MemberSelfDeparture from '../../apps/team/src/components/MemberSelfDeparture.vue';
import ChatGroupMembers from '../../apps/team/src/components/ChatGroupMembers.vue';
import ChatGroupMessages from '../../apps/team/src/components/ChatGroupMessages.vue';
import { defineComponent, h, ref } from "vue";
import { NInput } from "naive-ui";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsWorkspaceOverview from "@lostsky/ui/components/LsWorkspaceOverview.vue";
import { BadgeCheck, BarChart3, CircleDollarSign, House, ReceiptText, ShoppingBag, UserRound } from "@lucide/vue";
import AuthShell from "../../apps/account/src/components/AuthShell.vue";
import SmsCodeField from "../../apps/account/src/components/SmsCodeField.vue";
import AdminShell from "../../apps/admin/src/components/AdminShell.vue";
import ReasonDialog from "../../apps/admin/src/components/ReasonDialog.vue";
import SiteMemberFields from "../../apps/admin/src/components/SiteMemberFields.vue";
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
import PersonTickRanking from "../../apps/transaction/src/components/PersonTickRanking.vue";
import ServiceCompletionFields from "../../apps/transaction/src/components/ServiceCompletionFields.vue";
import TransactionFlowTrend from "../../apps/transaction/src/components/TransactionFlowTrend.vue";
import ShopManageShell from "../../apps/shop/src/components/ShopManageShell.vue";
import ServiceFieldsEditor from "../../apps/shop/src/components/ServiceFieldsEditor.vue";
import ProductVariantEditor from "../../apps/shop/src/components/ProductVariantEditor.vue";
import ServiceCompletionSettings from "../../apps/shop/src/components/ServiceCompletionSettings.vue";
import { newProductVariant, type ProductVariantDraft } from "../../apps/shop/src/product-variants";
import ResourceOwnerTag from "../../apps/shop/src/components/ResourceOwnerTag.vue";
import WeiboShell from "../../apps/weibo/src/components/WeiboShell.vue";
import AccountHealthSummary from "../../apps/weibo/src/components/AccountHealthSummary.vue";
import TaskStatusSummary from "../../apps/weibo/src/components/TaskStatusSummary.vue";
import OperationRecordList from "../../apps/weibo/src/components/OperationRecordList.vue";
import TeamOverviewDashboard from "../../apps/weibo/src/components/TeamOverviewDashboard.vue";
import MediaPreparation from "../../apps/weibo/src/components/MediaPreparation.vue";
import type { ServiceRedemptionFieldDraft } from "../../apps/shop/src/types";
import type { ServiceField } from "../../apps/transaction/src/types";
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
  description: "负责内容维护与顾客协作。",
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
  description: "内容维护与顾客协作",
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
        phone: "13800138000",
        disabled: state === "disabled",
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
  { disabled: "公开人员列表只读。", loading: "加载由页面表达。" },
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
        stage([h("h2", "顾客详情"), h("p", "内容区域遵循详情页最大宽度。")]),
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
      { permission_key: "team.document.customer.*.manage" },
      { permission_key: "team.customer.read" },
      { permission_key: "chat.group.manage" },
      { permission_key: "identity.virtual.*.assume" },
      { permission_key: "identity.member.*.assume" },
      { permission_key: "identity.member.member-2.assume" },
      { permission_key: "identity.member.member-2" },
    ],
  },
  {
    id: 2,
    name: "顾客运营",
    role_key: "customer",
    description: "维护顾客资料",
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
          { key: "team.document.read", label: "查看全部文档", group: "文档管理" },
          { key: "team.document.customer.*.manage", label: "管理全部顾客文档", group: "文档管理" },
          { key: "team.customer.read", label: "查看顾客", group: "顾客" },
          { key: "team.customer.read", label: "查看顾客", group: "顾客" },
          { key: "chat.group.manage", label: "管理团队群聊", group: "聊天" },
          { key: "identity.virtual.*.assume", label: "切换为虚拟人员身份", group: "聊天" },
          { key: "identity.member.*.assume", label: "领取全部成员身份", group: "人员委托" },
          { key: "identity.member.member-2.assume", label: "领取成员二号身份", group: "人员委托" },
          { key: "identity.member.member-2.assume", label: "领取成员二号身份", group: "人员委托" },
          { key: "identity.member.member-2", label: "覆盖 identity.member.member-2 下全部权限", group: "人员委托" },
          { key: "team.ability", label: "覆盖 team.ability 下全部权限", group: "高级范围" },
        ],
        catalog: [
          {
            name: "文档管理",
            items: [
              { key: "team.document.read", label: "查看全部文档" },
              { key: "team.document.customer.*.manage", label: "管理全部顾客文档" },
            ],
          },
          { name: "顾客", items: [{ key: "team.customer.read", label: "查看顾客" }] },
          {
            name: "聊天",
            items: [
              { key: "chat.group.manage", label: "管理团队群聊" },
              { key: "identity.virtual.*.assume", label: "切换为虚拟人员身份" },
            ],
          },
          {
            name: "人员委托",
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
  description: "负责内容维护与顾客协作。",
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
          h("p", "人员、成员、通知和文档集中在同一工作台。"),
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
          description: "从流水到核销和顾客协作，按经营任务进入对应区域。",
          actions: [{ key: "personal", label: "进入个人工作台", to: "/personal", icon: UserRound, primary: true }],
          entries: [
            { key: "transactions", label: "团队流水", description: "查看团队收入、支出与调整记录。", to: "/", icon: ReceiptText },
            { key: "stats", label: "经营统计", description: "查看团队收入结构与业绩汇总。", to: "/stats", icon: BarChart3 },
            { key: "services", label: "权益核销", description: "处理服务实例并记录核销过程。", to: "/services", icon: BadgeCheck },
            { key: "balances", label: "顾客余额", description: "查看余额、明细并按权限执行充值。", to: "/balances", icon: CircleDollarSign },
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
  ["default", "hover", "focus", "active", "loading", "error", "mobile"],
  (state) => stage(h(PersonalServiceLists, {
    offers: state === "error" ? [] : [{ id: 8, status: 1, quantity: "0.5", create_time: 1786400000, total_price: "60.00", handler_cut: "48.00", service: { name: "候选人面试与岗位匹配沟通" }, customer: { profile: { name: "示例顾客" } }, entitlement: { quantity_step: "0.5000", unit_name: "人" }, redemption_fields: [{ id: 1, name: "微信号", value_type: "string", input_type: "text", fill_stage: "customer", is_required: 1, value: "candidate-a" }, { id: 3, name: "沟通重点", value_type: "string", input_type: "text", fill_stage: "customer", is_required: 0, value: "确认晚间工作时间与擅长品类" }] }],
    available: state === "error" ? [] : [{ id: 21, quantity: "1.0", status: 2, expire_time: 0, handler_cut: "80.00", service: { name: "咨询服务" }, customer: { profile: { name: "示例顾客" } }, entitlement: { quantity_step: "0.5000", unit_name: "小时" }, redemption_fields: [{ id: 2, name: "预约说明", value_type: "string", input_type: "text", fill_stage: "customer", is_required: 1, value: "凌晨时段" }] }],
    assigned: state === "error" ? [] : [{ id: 18, quantity: "2.0", status: 2, status_label: "核销中", started_at: 1786403600, expire_time: 0, service: { name: "方案复盘" }, customer: { profile: { name: "示例顾客" } }, entitlement: { quantity_step: "0.5000", unit_name: "小时" } }],
    acting: state === "loading",
  }), state === "mobile" ? "story-stage--mobile" : ""),
  { disabled: "列表不提供整体禁用状态。", error: "空数据状态显示三组来源说明；读取错误仍由页面级异步状态表达。" },
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

const weiboShell = story("WeiboShell", layout, () => h(WeiboShell, null, {
  default: () => h("section", { class: "shell-content" }, [h("h2", "调度态势中心"), h("p", "账号健康、任务状态与最近执行在同一工作台中完成。")]),
}), { disabled: "工作台页面始终可访问。", loading: "页面内容负责加载。", error: "页面内容负责错误恢复。" });
const weiboAccountField = story("WeiboAccountField", [...interactive, "loading", "error"], state => stage(h(WeiboAccountField, {
  id: `preview-account-${state}`, modelValue: state === 'active' ? 1 : null,
  accounts: [{ id: 1, binding_id: 1, entity_id: 11, uid: '10001', screen_name: '当前评论账号', health: 'Valid', checked_at: null }],
  loading: state === 'loading', error: state === 'error' ? '暂时无法读取账号' : '', disabledReason: state === 'disabled' ? '当前账号不可用' : '',
})));
const weiboFeedCommentComposer = story("WeiboFeedCommentComposer", [...interactive, "loading", "error"], state => stage(h(WeiboFeedCommentComposer, {
  idPrefix: `preview-comment-${state}`, modelValue: state === 'active' ? '团队常用评论' : '',
  presets: state === 'loading' ? [] : [{ id: 1, scope: 'team', content: '团队常用评论' }, { id: 2, scope: 'personal', content: '个人常用评论' }, { id: 3, scope: 'team', content: '很长的团队预设评论，用来检查气泡截断后仍能选入完整正文' }],
  loading: state === 'loading', error: state === 'error' ? '暂时无法读取预设' : '', disabledReason: state === 'disabled' ? '预设读取受限' : '',
  sending: state === 'loading', submitReason: state === 'disabled' ? '请选择评论使用的微博账号' : '',
})));
const weiboCommentFields = story("WeiboCommentFields", [...interactive, "loading", "error"], state => stage(h(WeiboCommentFields, {
  idPrefix: `preview-fields-${state}`, modelValue: state === 'active' ? '可继续修改的评论正文' : '',
  presets: [{ id: 1, scope: 'team', content: '团队常用评论' }],
  loading: state === 'loading', error: state === 'error' ? '暂时无法读取预设' : '', disabledReason: state === 'disabled' ? '预设读取受限' : '',
})));

const accountHealthSummary = story("AccountHealthSummary", layout, () => stage(h(AccountHealthSummary, { accounts: [
  { id: 1, binding_id: 1, entity_id: 3, uid: "123456", screen_name: "青空账号", health: "Valid", checked_at: 1787500000 },
  { id: 2, binding_id: 2, entity_id: 3, uid: "654321", screen_name: "备用账号", health: "Unknown", checked_at: 1787500200 },
] })));
const taskStatusSummary = story("TaskStatusSummary", layout, () => stage(h(TaskStatusSummary, { tasks: [
  { id: 1, owner_entity_id: null, operation_type: "Post", topic: { name: "光遇陪玩", display_tag: "#光遇陪玩[超话]#" }, content: "今日排期", account_ids: [1], media_ids: [], start_at: 1787500000, min_interval: 3600, max_interval: 7200, version: 1, status: "Active", block_reason: null, next_run_at: 1787503600 },
] })));
const operationRecordList = story("OperationRecordList", layout, () => stage(h(OperationRecordList, { operations: [
  { id: 1, operation_type: "Post", source: "Schedule", status: "Succeeded", content_summary: "今日排期已更新", target_id: null, reason: "Ok", remote_message: null, started_at: 1787500000, finished_at: 1787500002 },
  { id: 2, operation_type: "Checkin", source: "Schedule", status: "Succeeded", content_summary: "#光遇陪玩[超话]#", target_id: "100808fixture", reason: "Ok", remote_message: "签到成功", started_at: 1787586400, finished_at: 1787586401 },
] })));
const teamOverviewDashboard = story("TeamOverviewDashboard", layout, state => stage(h(TeamOverviewDashboard, {
  accounts: [
    { id: 1, binding_id: 1, entity_id: 3, uid: "123456", screen_name: "青空账号", health: "Valid", checked_at: 1787500000 },
    { id: 2, binding_id: 2, entity_id: 3, uid: "654321", screen_name: "备用账号", health: "Unknown", checked_at: 1787500200 },
  ],
  tasks: [
    { id: 1, owner_entity_id: null, operation_type: "Post", topic: { name: "光遇陪玩", display_tag: "#光遇陪玩[超话]#" }, content: "今日排期", account_ids: [1], media_ids: [], start_at: 1787500000, min_interval: 3600, max_interval: 7200, version: 1, status: "Active", block_reason: null, next_run_at: 1787503600 },
    { id: 2, owner_entity_id: null, operation_type: "Checkin", topic: { name: "青空计划", display_tag: "#青空计划[超话]#" }, content: "", account_ids: [2], media_ids: [], start_at: 1787500000, min_interval: 86400, max_interval: 86400, version: 1, status: "BlockedLogin", block_reason: "账号需要重新登录", next_run_at: null },
  ],
  operations: [
    { id: 3, operation_type: "Post", source: "Schedule", status: "Unknown", content_summary: "夜间内容排期", target_id: null, reason: "ResponseUnknown", remote_message: "远端结果未确认", started_at: 1787500000, finished_at: null },
  ],
}), state === "mobile" ? "story-stage--mobile" : ""), {
  disabled: "团队 Dashboard 本身不因 Ability 缺失禁用。",
  loading: "加载态由 OverviewView 传入并在真实页面覆盖。",
  error: "错误态由 OverviewView 传入并在真实页面覆盖。",
});
const mediaPreparation = story("MediaPreparation", layout, () => stage(h(MediaPreparation, {
  prefix: "",
  personal: false,
  expectedEntityId: 3,
  accountId: 1,
  modelValue: [12, 13],
})));

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
    error: "缺失 Owner 摘要时组件使用人员ID 作为可识别回退。",
  },
);

const ServiceFieldsEditorHost = defineComponent({
  setup() {
    const fields = ref<ServiceRedemptionFieldDraft[]>([{
      key: "field-31",
      id: 31,
      name: "预约说明",
      value_type: "string",
      input_type: "textarea",
      options_text: "",
      fill_stage: "customer",
      is_customer_visible: 1,
      is_required: 1,
      is_active: 1,
      sort: 0,
    }]);
    return () => h(ServiceFieldsEditor, {
      modelValue: fields.value,
      "onUpdate:modelValue": value => fields.value = value,
    });
  },
});

const serviceFieldsEditor = story(
  "ServiceFieldsEditor",
  ["default", "hover", "focus", "active", "mobile"],
  state => stage(h(ServiceFieldsEditorHost), state === "mobile" ? "story-stage--mobile" : ""),
  {
    disabled: "字段权限由所属服务编辑页控制。",
    loading: "字段与服务详情一同读取，由所属页面表达加载状态。",
    error: "字段与服务详情一同读取，由所属页面表达错误状态。",
  },
);

const ProductVariantEditorHost = defineComponent({
  setup() {
    const draft = ref<ProductVariantDraft>({ ...newProductVariant(60), name: '体验规格', kind: 4, price: '30.00', handler_cut: '24.00', sender_cut: '4.50' });
    return () => h(ProductVariantEditor, {
      modelValue: draft.value,
      'onUpdate:modelValue': value => draft.value = value,
      prefix: 'preview-variant', products: [], entities: [], distributionLocked: false,
      distributionRates: { handler: 80, sender: 15, customerService: 0 },
      upload: async () => '/fixture.webp',
    });
  },
});
const productVariantEditor = story('ProductVariantEditor', ['default', 'hover', 'focus', 'active', 'mobile'],
  state => stage(h(ProductVariantEditorHost), state === 'mobile' ? 'story-stage--mobile' : ''),
  { disabled: '保存权限由主商品页面控制。', loading: '数据加载由主商品页面表达。', error: '提交错误由主商品页面表达。' });

const ServiceCompletionFieldsHost = defineComponent({
  setup() {
    const values = ref<Record<number, unknown>>({ 42: "已完成服务并回访" });
    const fields: ServiceField[] = [
      { id: 42, name: "服务结果", value_type: "text", input_type: "textarea", fill_stage: "manager", is_required: 1 },
      { id: 43, name: "完成日期", value_type: "date", input_type: "text", fill_stage: "manager", is_required: 0 },
    ];
    return () => h(ServiceCompletionFields, {
      modelValue: values.value,
      "onUpdate:modelValue": value => values.value = value,
      fields,
    });
  },
});

const ServiceCompletionSettingsHost = defineComponent({
  setup() {
    const unused = ref<number | null>(120);
    const confirmation = ref<number | null>(60);
    return () => h(ServiceCompletionSettings, {
      idPrefix: 'preview-completion', unusedMinutes: unused.value, confirmationMinutes: confirmation.value,
      'onUpdate:unusedMinutes': value => unused.value = value,
      'onUpdate:confirmationMinutes': value => confirmation.value = value,
    });
  },
});
const serviceCompletionSettings = story('ServiceCompletionSettings', ['default', 'hover', 'focus', 'active', 'mobile'],
  state => stage(h(ServiceCompletionSettingsHost), state === 'mobile' ? 'story-stage--mobile' : ''),
  { disabled: '权限由所属表单控制。', loading: '配置随表单读取。', error: '非法时长由表单校验并阻止保存。' });

const serviceCompletionFields = story(
  "ServiceCompletionFields",
  ["default", "focus", "mobile"],
  state => stage(h(ServiceCompletionFieldsHost), state === "mobile" ? "story-stage--mobile" : ""),
  {
    disabled: "字段是否可填写由所属核销任务控制。",
    loading: "字段定义随核销详情一同加载。",
    error: "提交错误由所属核销任务就近显示。",
  },
);

const personTickRanking = story(
  "PersonTickRanking",
  layout,
  state => stage(h(PersonTickRanking, {
    metricLabel: "履约业绩",
    moneyMetric: true,
    rows: [
      { key: 1, name: "青空成员", value: 12860 },
      { key: 2, name: "协作助手", value: 9840 },
      { key: 3, name: "云端成员", value: 6720 },
      { key: 4, name: "夜航成员", value: 4310 },
    ],
  })),
);

const transactionFlowTrend = story(
  "TransactionFlowTrend",
  layout,
  state => stage(h(TransactionFlowTrend, {
    periodLabel: "2026年8月",
    points: Array.from({ length: 12 }, (_, index) => ({
      key: `2026-08-${String(index + 1).padStart(2, "0")}`,
      label: `8/${index + 1}`,
      value: [620, 980, 760, 1380, 1040, 1680, 1420, 2140, 1860, 2320, 1940, 2680][index],
    })),
  })),
);

export const appStories: Record<string, StoryDefinition> = {
  TeamNoticeRow: story('TeamNoticeRow', ['default', 'hover', 'focus', 'active', 'mobile'], state => h(LsResourceList, {}, { default: () => h(TeamNoticeRow, { title: '团队协作安排更新', summary: state === 'active' ? '' : '请查看本周工作安排并确认参与人员。', recipient: '收件人员 #18', time: '2026年10月12日 09:30', unread: state !== 'active', to: '/notices/sent/detail?id=1' }) })),
  TeamCategoryNavigation: { ...story('TeamCategoryNavigation', ['default', 'hover', 'focus', 'active', 'mobile'], state => h(defineComponent({ setup() {
    const current = ref('entity');
    return () => h('div', { style: { container: 'team-category-layout / inline-size', minWidth: '0' } }, h(TeamCategoryNavigation, { horizontal: state !== 'active', label: state === 'active' ? '设置分类' : '通知分类', style: state === 'active' ? { width: '11.5rem' } : undefined, current: current.value, panelId: 'preview-settings', items: state === 'active' ? [{ key: 'entity', label: '人员', dirty: true }, { key: 'chat', label: '聊天', dirty: true }] : [{ key: 'entity', label: '站内通知', to: '/notices/team' }, { key: 'sent', label: '已发送通知', to: '/notices/sent' }], onSelect: key => { current.value = key } }));
  }}))), desktopWidth: 1024 },
  TeamCategoryLayout: { ...story('TeamCategoryLayout', [...interactive, 'loading', 'error'], state => h(defineComponent({ setup() {
    if (state === 'active') return () => h(TeamCategoryLayout, { horizontal: true, label: '通知分类', current: 'team', items: [{ key: 'sent', label: '已发送通知', to: '/notices/sent' }, { key: 'team', label: '平台通知', to: '/notices/team' }] }, { default: () => h(LsResourceList, { 'aria-label': '站内通知列表' }, { default: () => [h(TeamNoticeRow, { title: '团队服务更新', summary: '新的团队协作功能已上线，请查看更新说明。', time: '2026年10月12日 09:30', unread: true, to: '/notices/team/detail?id=1' }), h(TeamNoticeRow, { title: '工作安排提醒', time: '2026年10月11日 10:00', unread: false, to: '/notices/team/detail?id=2' })] }) });
    const current = ref('entity');
    const values = ref<Record<string, boolean>>({ entity: false, chat: true, display: false });
    const items = [{ key: 'entity', label: '人员', dirty: false }, { key: 'chat', label: '聊天', dirty: true }, { key: 'display', label: '展示', dirty: false }];
    return () => h(TeamCategoryLayout, { label: '设置分类', current: current.value, items, onSelect: key => { current.value = key } }, { default: () => h(TeamSettingsGroup, {
      app: { app_name: current.value, label: items.find(item => item.key === current.value)!.label, description: '管理团队的业务规则。', order: 1, settings: [{ key: 'enabled', label: '允许查找团队', description: '允许通过团队标识找到当前团队。', type: 'boolean', control: 'switch', order: 1, default: false, value: false }] },
      values: { enabled: values.value[current.value] }, loading: state === 'loading', disabled: state === 'disabled' || state === 'loading', saved: false, error: state === 'error' ? '保存失败，请稍后重试。' : '', restricted: false, onUpdate: (_key, value) => { values.value[current.value] = Boolean(value) },
    }) });
  }}))), desktopWidth: 1024 },
  TeamSettingsGroup: story('TeamSettingsGroup', [...interactive, 'loading', 'error'], state => stage(h(TeamSettingsGroup, {
    app: { app_name: 'entity', label: '人员', description: '管理人员查找与加入规则。', order: 1, settings: [
      { key: 'searchable', label: '允许查找团队', description: '允许通过团队标识找到当前团队。', type: 'boolean', control: 'switch', order: 1, default: false, value: false },
      { key: 'priority', label: '搜索优先级', description: '选择团队与成员设置冲突时的处理方式。', type: 'enum', control: 'radio', order: 2, default: 'team', value: 'team', options: [{ value: 'team', label: '团队优先', description: '遵循团队设置。' }, { value: 'member', label: '成员优先', description: '使用成员自行选择的查找规则。' }] },
    ] },
    values: { searchable: state === 'active', priority: 'team' }, loading: state === 'loading', disabled: state === 'disabled' || state === 'loading', restricted: false, saved: state === 'active', error: state === 'error' ? '保存失败，请稍后重试。' : '',
  }), state === 'mobile' ? 'story-stage--mobile' : '')),
  SiteMemberFields: story('SiteMemberFields', interactive, state => h(defineComponent({ setup() {
    const member = ref({ name: '青空', role: '运营负责人', description: '负责团队运营与服务交付。', tags: ['运营', '服务'], initials: 'LS', avatar: '', visible: true });
    return () => stage(h(SiteMemberFields, { member: member.value, index: 0, readonly: state === 'disabled' }));
  }})), { loading: '人员资料加载由页面处理。', error: '保存校验和读取错误由页面处理。' }),
  ChatGroupMembers: story('ChatGroupMembers', [...previewStates], state => stage(h(ChatGroupMembers, {
    participants: state === 'error' ? [] : [
      { slug: 'qingkong', name: '青空', left_at: null },
      { slug: 'former-member', name: '已离开成员', left_at: 1788220800 },
    ],
    invitations: state === 'error' ? [] : [{ slug: 'xiaoyu', name: '小雨' }],
    busy: state === 'loading',
    disabledReason: state === 'disabled' ? '缺少群成员管理权限' : '',
  }))),
  ChatGroupMessages: story('ChatGroupMessages', [...previewStates], state => stage(h(ChatGroupMessages, {
    messages: state === 'error' ? [] : [
      { id: 1, content: '本周排班已更新，请大家确认。', sender: { name: '青空' }, create_time: 1788220800, revoked_at: null },
      { id: 2, content: null, sender: { name: '小雨' }, create_time: 1788220860, revoked_at: 1788220920 },
    ],
    busy: state === 'loading',
    disabledReason: state === 'disabled' ? '缺少群消息管理权限' : '',
    hasOlder: state !== 'error',
  }))),
  JoinApplicationFields: story('JoinApplicationFields', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], (state) => h(defineComponent({ setup() {
    const values = ref({ nickname: '青空' });
    return () => h(JoinApplicationFields, { fields: [{ id: 1, field_key: 'nickname', name: '团队昵称', input_type: 'text', is_apply_required: 1 }, { id: 2, field_key: 'intro', name: '入职介绍', input_type: 'textarea' }], modelValue: values.value, 'onUpdate:modelValue': value => { values.value = value as typeof values.value }, uploadFile: async () => '1', disabled: state === 'disabled' });
  }})), { loading: '字段加载由页面承担，上传期间由上传控件显示忙碌状态。', error: '字段读取失败由页面呈现；上传失败在字段末尾显示。' }),
  TeamShareLinks: story('TeamShareLinks', ['default', 'hover', 'focus', 'active', 'mobile'], () => h(TeamShareLinks), { disabled: '公开链接不按业务权限禁用。', loading: '团队快照就绪后显示链接。', error: '复制失败使用全局短时反馈。' }),
  MemberSelfDeparture: story('MemberSelfDeparture', ['default', 'hover', 'focus', 'active', 'loading', 'error', 'mobile'], () => h(AdminPageHeader, { title: '资料', description: '所有内容均属于当前已领取的人员；切换身份后会自动重新核对。' }, { actions: () => h(MemberSelfDeparture) }), { disabled: '加载时阻止提交；身份与团队设置限制由服务端返回。' }),
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
  TeamSectionNav: {
    name: 'TeamSectionNav',
    supported: ['default', 'hover', 'focus', 'active', 'mobile'],
    reason: { disabled: '入口始终可用。', loading: '加载由列表承载。', error: '错误由列表承载。' },
    render: () => h(TeamSectionNav, { label: '审核分类', items: [{ to: '/', label: '加入与复职' }, { to: '/departure-review', label: '离队' }] }),
  },
  TeamShell: teamShell,
  TransactionShell: transactionShell,
  PersonalServiceLists: personalServiceLists,
  PersonTickRanking: personTickRanking,
  ServiceCompletionFields: serviceCompletionFields,
  TransactionFlowTrend: transactionFlowTrend,
  ServiceFieldsEditor: serviceFieldsEditor,
  ProductVariantEditor: productVariantEditor,
  ServiceCompletionSettings: serviceCompletionSettings,
  ResourceOwnerTag: resourceOwnerTag,
  ShopManageShell: shopManageShell,
  WeiboShell: weiboShell,
  WeiboAccountField: weiboAccountField,
  WeiboCommentFields: weiboCommentFields,
  WeiboFeedCommentComposer: weiboFeedCommentComposer,
  AccountHealthSummary: accountHealthSummary,
  TaskStatusSummary: taskStatusSummary,
  OperationRecordList: operationRecordList,
  TeamOverviewDashboard: teamOverviewDashboard,
  MediaPreparation: mediaPreparation,
};
