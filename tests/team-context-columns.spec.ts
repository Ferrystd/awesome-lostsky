import { expect, test, type Page } from './fixtures'

const teamOrigin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
const adminOrigin = process.env.ADMIN_TEST_ORIGIN ?? 'http://admin.lostsky.work:5180'
const longText = '用于核对长名称自然换行而不挤压控件的资料说明'.repeat(4)
const customFields = [
  { id: 1, name: '公开称号', value_type: 'string', can_edit: true, is_required: 1 },
  { id: 2, name: longText, value_type: 'text', input_type: 'textarea', can_edit: true },
  { id: 3, name: '接受预约', value_type: 'bool', can_edit: true, is_required: 1 },
  { id: 4, name: '接单年限', value_type: 'int', can_edit: true },
  { id: 5, name: '展示范围', value_type: 'select', input_type: 'select', options: ['公开', '团队'], can_edit: true },
  { id: 6, name: '只读资料', value_type: 'string', can_edit: false },
  { id: 7, name: '开始接单日期', value_type: 'date', can_edit: true },
  { id: 8, name: '下次可预约', value_type: 'datetime', can_edit: true },
  { id: 9, name: '可接单日期', value_type: 'multi_select', options: ['周末', '节假日'], can_edit: true },
  { id: 10, name: '单选展示范围', value_type: 'select', input_type: 'radio', options: ['公开', '团队'], can_edit: true },
  { id: 11, name: '擅长内容', value_type: 'string', input_type: 'checkbox', options: ['语音陪伴', '剧情互动'], can_edit: true },
  { id: 12, name: '作品附件', value_type: 'string', input_type: 'upload', can_edit: true },
]
const values = [{ field_id: 1, value_string: '晚风小栖' }, { field_id: 2, value_text: longText }, { field_id: 3, value_int: 1 }, { field_id: 4, value_int: 6 }, { field_id: 6, value_string: longText }]
const profile = { name: '测试人员', avatar: '', description: longText, intro_image: '', intro_video: '', introduction_markdown: '详细介绍保留完整编辑宽度。', document_tags: [] }

async function setup(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.context().addCookies([{ name: 'lostsky_token', value: `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'team', id: 1 } })).toString('base64url')}.x`, domain: '.lostsky.work', path: '/' }])
  const access = { team: { id: 1, slug: 'demo', name: '测试团队' }, identity: { type: 'team', entity_id: 1 }, permissions: ['team', 'community.team.read', 'community.team.manage', 'file.upload'], abilities: { doc: { enabled: true, level: 1 } } }
  const fixtures: Record<string, unknown> = {
    '/access': access,
    '/session': { user: { id: 1, username: 'admin' }, roles: [], permissions: ['admin.community.read', 'admin.community.write'], is_super_admin: true },
    '/entity/options': [{ entity_id: 1, type: 'team', name: '测试团队', slug: 'demo' }],
    '/entity/get': { id: 1, slug: 'member', entityable_type: 'teamMember', is_displayed: 1, is_internal_visible: 1, capabilities: { read_all: true, manage_profile: true }, profile },
    '/personal': { identity: { entity_id: 1, type: 'team', slug: 'demo', name: '测试团队', team: { name: '测试团队' } }, profile, custom_fields: customFields, custom_field_values: values, role_assignments: [], effective_permissions: [] },
    '/member/get': { id: 1, entity_id: 1, nickname: '测试成员', slug: 'member', inviter: {name:'邀请人员',slug:'inviter',is_external:true,team:{name:'外部协作团队'}}, status_code: 'active', fieldValues: values.map(value => ({ ...value, field: customFields.find(field => field.id === value.field_id) })), capabilities: { field_manage: true, role_read: true, role_write: true, member_search: true } },
    '/ability': [],
    '/doc/get': { id: 1, title: '已有文档', content: '正文', entity_id: 1, manager_scope: 1, visibility: 1, tags: [], sort: 0 },
    '/entityField/get': { id: 1, entity_type: 'entity', field_key: 'title', name: '公开称号', value_type: 'string', input_type: 'text', manager_scope: 1, visibility: 1, is_required: 0, options: [], sort: 0 },
    '/entity/search': [],
    '/entityRole/resolve': { id: 1, type: 'teamMember', slug: 'member', name: '测试成员', team: { id: 1, slug: 'demo', name: '测试团队' }, is_external: false },
    '/chatGroup/get': { uuid: 'group', title: '测试群聊', is_closed: false, participants: [] },
    '/chatGroup/messages': [],
    '/joinReview/get': { id: 1, purpose_label: '加入', status_code: 'reviewing', status_label: '审核中', user_id: 1, user: { name: '申请人' }, memo: longText, values: [], tasks: [{ id: 1, title: '确认资料', description: longText, is_passed: 1 }] },
    '/memberDeparture/get': { id: 1, status_code: 'applied', status_label: '已申请', member_id: 1, member: { name: '测试成员', slug: 'member', status_label: '正常' }, requester: {}, requester_entity_id: 77, create_time: 1720000000, decided_at: null },
    '/role/get': { id: 1, name: '服务成员', role_key: 'service_member', description: longText, sort: 1 },
    '/rolePermission/index': [],
    '/chatVirtual/get': { id: 1, slug: 'bot', name: '服务助手', integrations: [{ id: 1, name: '外部通知', endpoint_url: 'https://example.test/hook', events: ['message.created'], is_active: 1 }] },
    '/member/joinForm': { fields: [{ id: 1, field_key: 'name', name: '入职称呼', input_type: 'text', is_apply_required: true }], file_upload: { available: false } },
    '/entityField/index': customFields,
    '/entityField/values': values,
    '/role/index': [],
    '/entityRole/index': [],
    '/rolePermission/catalog': { groups: [], advanced_items: [] },
    '/joinField/index': [{ id: 1, field_key: 'name', name: '入职称呼', value_type: 'string', input_type: 'text', is_apply_fillable: true, is_apply_required: true, is_active: true, sort: 0 }],
    '/joinField/transferOptions': [],
    '/join/form': { purpose_code: 'join', purpose_label: '加入', refill_required: true, fields: [{ id: 1, field_key: 'name', name: '入职称呼', input_type: 'text', is_apply_required: true }, { id: 2, field_key: 'intro', name: '入职介绍', input_type: 'textarea' }], file_upload: { available: false, reason: '未开放上传' } },
    '/join/mine': [],
    '/customer/1': { id: 1, slug: 'customer', name: '测试顾客', avatar: '', description: longText, is_blocked: false, create_time: 1, balance: { balance: '0', recharged: '0', spent: '0' }, senders: [], assignee: null, summary: { transaction_count: 0, transaction_total: '0', order_count: 0, order_total: '0' }, can_manage: true },
    '/customer/assignees': [],
    '/communities/1': { id: 1, name: '测试社区', slug: 'sky', description: longText, status: 'Active', is_official: false },
    '/communities/1/administrators': { list: [], total: 0 },
    '/setting/schema': { apps: [{ app_name: 'entity', label: '人员', description: '人员规则', settings: [
      { key: 'name', label: '显示名称', description: longText, control: 'input', value: '青空', default: '' },
      { key: 'limit', label: '人数限制', description: '人数上限', control: 'number', value: 10, default: 10 },
      { key: 'choice', label: '选择范围', description: '适用范围', control: 'select', value: 'team', default: 'team', options: [{ label: '团队', value: 'team' }] },
      { key: 'open', label: '开放查找', description: '允许其他人员查找', control: 'switch', value: false, default: false },
      { key: 'policy', label: '优先策略', description: '选择处理策略', control: 'radio', value: 'team', default: 'team', options: [{ label: '团队优先', value: 'team', description: longText }, { label: '成员优先', value: 'member', description: '采用成员设置' }] },
    ] }] },
  }
  for (const origin of [teamOrigin, adminOrigin]) await page.route(`${origin}/api/**`, async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')
    if (!(path in fixtures)) throw new Error(`未声明表单布局请求: ${route.request().method()} ${path}`)
    await route.fulfill({ json: { code: 0, message: 'ok', data: fixtures[path] } })
  })
}


async function geometry(page: Page, width: number, fontSize: number) {
 await page.setViewportSize({ width, height: 1200 });
 await page.evaluate(size => { document.documentElement.style.fontSize = size + 'px' }, fontSize);
 await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
 const tracks = await page.locator('.page-context').evaluateAll(els => els.map(el => {
   const main = el.querySelector('.page-context__main')!.getBoundingClientRect();
   const aside = el.querySelector('.page-context__aside')!.getBoundingClientRect();
   const box = el.getBoundingClientRect();
   return { box: box.toJSON(), main: main.toJSON(), aside: aside.toJSON(), horizontal: box.width >= 48 * parseFloat(getComputedStyle(document.documentElement).fontSize) };
 }));
 expect(tracks.length).toBeGreaterThan(0);
 for(const t of tracks) {
   expect(t.main.x).toBeCloseTo(t.box.x, 0);
   expect(t.aside.right).toBeLessThanOrEqual(t.box.right + 1);
   if(t.horizontal) { expect(t.aside.x).toBeGreaterThan(t.main.right); expect(t.main.width/t.aside.width).toBeCloseTo(2, 1); expect(t.aside.y).toBeCloseTo(t.main.y, 0); }
   else expect(t.aside.y).toBeGreaterThanOrEqual(t.main.bottom - 1);
 }
 const lists = await page.locator('.ls-description-list-container').evaluateAll(els => els.map(el => {
   const dt=el.querySelector('dt')?.getBoundingClientRect(), dd=el.querySelector('dd')?.getBoundingClientRect();
   return { width:el.getBoundingClientRect().width, size:parseFloat(getComputedStyle(el).fontSize), root:parseFloat(getComputedStyle(document.documentElement).fontSize), dt:dt?.toJSON(), dd:dd?.toJSON() };
 }));
 for(const l of lists) if(l.dt && l.dd) { if(l.width <= 28*l.root) expect(l.dd.y).toBeGreaterThanOrEqual(l.dt.bottom-1); else expect(l.dd.x).toBeGreaterThan(l.dt.x); }
 const rows=await page.locator('.ls-form-field-layout').evaluateAll(els=>els.map(el=>({box:el.getBoundingClientRect().toJSON(),control:el.querySelector('.ls-form-field-layout__control')!.getBoundingClientRect().toJSON()})));
 for(const r of rows) expect(r.control.right).toBeLessThanOrEqual(r.box.right+1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1), 'page overflow at '+width+'/'+fontSize).toBe(true);
}

const routes = ['/member-add','/member-edit?id=1','/member-detail?id=1','/entity?id=1','/chat-virtual-new','/chat-virtual?slug=bot','/notices/send','/doc-create','/doc-edit?id=1','/field-new','/field-edit?id=1','/join-fields/new','/join-fields/1','/roles/new','/roles/entities?slug=member','/chat-groups/new','/chat-groups/group','/communities/new','/communities/1/edit','/communities/1','/communities/1/administrators','/chat-integration-new?slug=bot','/chat-integration?slug=bot&id=1','/join-review/review?id=1','/departure-review/review?id=1','/customers/1','/personal/profile','/personal/fields','/personal/access'];

test('all Team context routes preserve main/aside geometry and long-content flow', async ({page})=>{
 test.setTimeout(240000); await setup(page); const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of routes) { await page.goto(teamOrigin+route); await expect(page.locator('.page-context__aside'), route).toBeVisible(); await page.waitForLoadState('networkidle');
  for(const width of [320,1440])for(const font of [16,32])await geometry(page,width,font);
 }
 expect(errors).toEqual([]);
});

test('shared containers at all widths and actual form controls including text zoom',async({page})=>{
 test.setTimeout(120000);await setup(page);
 for(const route of ['/member-edit?id=1','/customers/1','/doc-create','/personal/profile']) {await page.goto(teamOrigin+route);await expect(page.locator('.page-context__aside')).toBeVisible();await page.waitForLoadState('networkidle');
  for(const width of [320,375,768,1024,1440])for(const font of [16,32])await geometry(page,width,font);
 }
});

test('draft summary follows input without submitting and preview input stays separate',async({page})=>{
 await setup(page);const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST')writes.push(r.url())});
 await page.goto(teamOrigin+'/notices/send');await page.locator('#notice-title').fill('新的通知草稿');await expect(page.locator('.page-context__aside')).toContainText('新的通知草稿');
 await page.goto(teamOrigin+'/field-new');await page.locator('#entity-field-name').fill('试填字段');await page.locator('#entity-field-preview').fill('不会保存的试填值');
 await expect(page.locator('#entity-field-name')).toHaveValue('试填字段');await expect(page.locator('.page-context__main')).not.toContainText('不会保存的试填值');expect(writes).toEqual([]);
});

test('loading errors and denied reads never present default balances as saved data',async({page})=>{
 await setup(page);let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve});
 await page.route(teamOrigin+'/api/customer/1',async route=>{await gate;await route.fulfill({status:500,json:{code:500,message:'不可用'}})});
 await page.goto(teamOrigin+'/customers/1');await expect(page.locator('.page-context__aside')).toContainText('-');await expect(page.locator('.page-context__aside')).not.toContainText('0.00');release();
 await expect(page.getByText('暂时无法读取顾客详情',{exact:true})).toBeVisible();await expect(page.locator('.page-context__aside')).not.toContainText('0.00');
 await page.route(teamOrigin+'/api/entityField/get**',route=>route.fulfill({status:403,json:{code:403,message:'无权读取'}}));
 await page.goto(teamOrigin+'/field-edit?id=1');await expect(page.locator('.page-context__aside')).not.toContainText('字段试填');await expect(page.locator('#entity-field-preview')).toHaveCount(0);
});

test('Admin community and Team category pages retain their existing composition',async({page})=>{
 await setup(page);await page.goto(adminOrigin+'/communities/new');await expect(page.locator('#community-name')).toBeVisible();await expect(page.locator('.page-context')).toHaveCount(0);
 await page.goto(teamOrigin+'/roles/1');await expect(page.locator('.ls-category-page')).toBeVisible();await expect(page.locator('.page-context')).toHaveCount(0);
});

test('migrated records retain inviter team and requester identity fallback', async ({page})=>{
 await setup(page);
 await page.goto(teamOrigin+'/member-detail?id=1');
 await expect(page.locator('.page-context__aside')).toContainText('来自其他团队 · 外部协作团队');
 await expect(page.locator('.page-context__aside')).toContainText('inviter');
 for(const width of [320,1440]) await geometry(page,width,32);
 await page.goto(teamOrigin+'/departure-review/review?id=1');
 await expect(page.locator('.page-context__aside')).toContainText('人员 #77');
 for(const width of [320,1440]) await geometry(page,width,32);
});

if (process.env.CONTEXT_PREVIEW_DIR) test('render final Team page previews for human review', async ({page})=>{
 await setup(page);await page.setViewportSize({width:1600,height:1000});
 for(const [route,name] of [['/member-edit?id=1','team-member-edit'],['/field-edit?id=1','team-field-edit']]) {
  await page.goto(teamOrigin+route);await expect(page.locator('.page-context__aside')).toBeVisible();await page.waitForLoadState('networkidle');
  await page.screenshot({path:process.env.CONTEXT_PREVIEW_DIR+'/'+name+'.png',fullPage:true});
 }
});
