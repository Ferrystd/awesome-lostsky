---
name: lostsky-model
description: >
  Add a new model (and database table) to the LostSky ThinkPHP 8 project.
  Use when the user wants to create a new model, add a database table, design a schema,
  or mentions a model/table name they want to introduce.
  Ordinarily, speak in Chinese.
---

# LostSky Model Creation

Follow these steps in order. The `php think make:model` command generates the skeleton from a project stub — the model already has `$type`, `$json`, `$hidden`, `$append`, `$readonly`, Base inheritance, and SoftDelete.

## Step 1: Generate the skeleton

Ask for the model name, then run:

```bash
php think make:model ModelName
```

Add `-t table_name` only if the auto-converted table name would be wrong. Read the generated file to confirm.

## Step 2: Propose fields and SQL

Draft the custom fields and a CREATE TABLE statement. Follow the style in `sql/schema.sql` for alignment, comments, and indexes. Explain design choices.

## Step 3: Wait for the user to fine-tune

The user adjusts the fields. Do not proceed until they confirm.

## Step 4: Complete $type, $json, and enum design

Edit the model file: fill in actual field type mappings. Fields storing JSON go in both `$type` (as `'string'`) and `$json`.

For every fixed-option field, decide whether it is an enum before writing code. Present this design to the user together with the field proposal:

| Field | Storage type / values | Enum class | Output strategy | Reason |
|---|---|---|---|---|
| `status` | `TINYINT`, `1/2` | `OrderStatus` | case name / Chinese text | Explain the API-facing meaning |

Apply these rules after approval:

1. Use PHP native `BackedEnum`; the backing value is the database value.
2. Declare the enum class directly in model `$type`, for example `'status' => OrderStatus::class`.
3. If the output does **not** require Chinese text, do not implement `EnumTransform`: `app\\model\\Base::$enumReadName = true` automatically returns the enum case name.
4. Only when the output requires Chinese text, implement `EnumTransform` and write `value(): string` with a `match` expression. `EnumTransform` takes precedence over `$enumReadName`.
5. Do not add `status_text` append fields or per-field enum getters/setters. Services write enum instances; query conditions use the backing `->value`; business logic needing a case uses `enumCase('status')`.

## Step 5: Append SQL to sql/schema.sql

Read the end of `sql/schema.sql`, then insert the new CREATE TABLE after the last one, matching the existing format.

## Step 6: 模型精修

字段完全确定后，按以下 6 个维度分析模型，逐项给出具体建议。每项都要列出涉及的**字段名**和**理由**。

### 6a. $hidden — 输出隐藏
始终包含 `delete_time`。检查是否有密码类、内部标记类字段需要隐藏。

### 6b. $append — 计算属性
枚举字段已经由模型 `$type` 自动输出 case name 或中文文案，不为枚举增加 `status_text` 之类的重复 append。仅检查真正派生的组合展示字段。

### 6c. $readonly — 只读字段
检查创建后不可修改的字段：`slug`、`user_id`、任何唯一标识。

### 6d. 获取器 getXxxAttr
不为枚举/状态字段增加 `getXxxTextAttr`；中文枚举在 `EnumTransform::value()` 的 `match` 中定义，非中文枚举由 `Base::$enumReadName` 自动输出 case name。仅对时间、金额等非枚举字段给出必要的格式化逻辑。

### 6e. 修改器 setXxxAttr
检查需要写入前自动处理的字段：`password` → 哈希、`name` → trim、URL → 补全协议。

### 6f. 搜索器 searchXxxAttr
检查哪些字段适合模糊搜索（名称、标题、描述），建议封装为模型搜索器。

**以表格汇总建议，等待用户审批后再写入。**

## Step 7: Write refinements

审批通过后，编辑模型文件：
1. 合并到 `$hidden`、`$append`、`$readonly`
2. 添加获取器/修改器/搜索器方法。一行 body 即可，不加 docblock

## Step 8: Plan model associations

Analyze the new model's foreign keys. For each foreign key, propose the appropriate association:

- `team_id` → `belongsTo(Team::class)`, plus reverse `hasMany` on Team
- `user_id` → `belongsTo(User::class)`, plus reverse `hasMany` on User
- `member_id` → `belongsTo(TeamMember::class)`, plus reverse `hasMany` on TeamMember
- `type_id` → `belongsTo(SomeType::class)`, plus reverse `hasMany` on the type model

Also check if the new model is a 1:1 Profile-style model that should use `bind()` on the parent side.

Present a clear table:

| Direction | Parent → New | New → Parent |
|---|---|---|
| Team | `notices()` hasMany | `team()` belongsTo |

If no foreign keys exist (e.g., pure configuration table), state that and skip.

**Wait for the user to approve the association plan before proceeding.**

## Step 9: Write association methods

Once approved, edit both sides:

1. **New model**: add `belongsTo` methods for each foreign key
2. **Existing parent models**: add `hasOne`/`hasMany` reverse methods, with `bind()` for 1:1 Profile types

Follow the existing style — keep methods concise, one line per return.
