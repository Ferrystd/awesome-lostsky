---
title: 商城（shop）
tags:
  - 应用
description: 支持多种类商品和分步核销的现代化商城系统
audience:
  - platform
  - team
  - member
  - customer
aliases:
  - 商城
  - shop
modified_at: 2026-09-27
---

## 简述

支持多种类商品和分步核销的现代化商城系统

## 功能

- （顾客）余额充值、使用与管理
- （顾客）商品购买与可指定接单人的核销
- （团队与个人）个人商品与团队商品管理

### 普通商品

<div style="overflow-x: auto; padding-bottom: 0.5rem;" tabindex="0" aria-label="普通商品流程图，可横向滚动查看">
  <img src="../assets/shop-standard-product-flow.svg" alt="普通商品从设置价格及分成、上架、下单到余额划扣的主流程；自动记账作为顾客下单的可选支线" style="display: block; width: 100%; min-width: 680px;">
</div>

### 核销商品

<div style="overflow-x: auto; padding-bottom: 0.5rem;" tabindex="0" aria-label="核销商品流程图，可横向滚动查看">
  <img src="../assets/shop-redemption-flow.svg" alt="核销商品从设置、下单到核销结单的流程；自动记账、公开接单、拒绝接单和加价确认作为支线连接主流程" style="display: block; width: 100%; min-width: 680px;">
</div>

### 套餐 {#package}

一个套餐可以包含（本人或团队的）：

- 普通商品
- 核销商品
- 套餐
- 卡密
- 多规格商品的规格

套餐内的子商品可以被更改价格和分成，但套餐的价格永远等于**所有子价格之和**。（需权限）
套餐在其他套餐、卡密内**无法被修改价格**。

### 卡密

卡密是可被兑换和转赠的[套餐](#package)。

### 多规格商品

多规格商品含有多个规格，顾客每次可以购买其中一个规格。

一个规格可以是：

- 普通商品
- 核销商品
- 套餐
- 卡密

## 最佳实践

> 团队设置中的默认接单、发单和客服分成比例使得分成可以被自动计算，避免手动输入的麻烦。如果某商品的分成不符合固定比例，也可以手动修改。

### 陪玩分时核销

1. 新增核销商品，如`语聊`
2. 建议将”最小核销单位“设置为：
  - 计量单位:分钟
  - 最小核销单位:30
3. 为了在记账应用记录流水，设置价格与分成。

> 冠名卡的处理方式：[美工售卡](#designer-card-sale)。若外包做卡：成本=售价；若团内做卡：团队分配=售价。

4. 新建商品，商品类型改为“服务套餐”，服务权益包选择你刚才添加的权益包。
> 价格默认已被正确设置，也支持自行修改。

### 美工售卡 {#designer-card-sale}

1. 建立角色，如`美工`。
2. 授予权限`shop.product.self.manage`。
3. 授予人员对应角色。
4. 人员可自行建立多规格商品，如：
  - 单约
  - 买断
  - 断模
  - 断商
