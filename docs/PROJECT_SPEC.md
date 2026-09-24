# TakeMoveReturn

> 2026-09-24 用户更新：正式域名为 `takemovereturn.com`；联系邮箱为 `contact@takemovereturn.com`、`billing@takemovereturn.com`、`support@takemovereturn.com`。支付拟使用 Waffo Pancake（`https://pancake.waffo.ai/`），但支付集成和收费上线明确推迟到其他功能完成之后。下文所有 Stripe/Resend/旧域名要求，如与本更新冲突，以本更新为准；不得据此声称支付或邮件发送已完成。

# AI 编程完整开发总指令

## 最终锁定版 · SEO V2 竞品验证整合版

## SEO-first Construction Tool Tracking SaaS

## Next.js 16 + OpenNext + Cloudflare Workers + Supabase

---

# 0. 本文件地位

本文件是 TakeMoveReturn 项目的唯一：

# Product + Engineering Source of Truth

此前所有：

* PRD
* Prompt
* 开发总指令
* 补丁
* vinext版本
* 旧Pricing
* 旧Import限制
* 旧PIN规范

全部失效。

如果：

旧代码、旧文档、旧README、旧Prompt

与本文件冲突：

# 本文件优先。

---

# 1. AI执行原则

产品最终范围：

一次确定。

工程实施：

允许自主拆解。

正确执行方式：

```text
Inspect
→ Implement
→ Test
→ Fix
→ Verify
→ Update TASKS.md
→ Continue
```

不要一次生成全部代码然后假装完成。

不要频繁询问：

“是否继续？”

只有确实缺少外部资料时才允许停止，例如：

* Cloudflare账号权限
* Supabase credentials
* Stripe credentials
* Resend credentials
* 正式域名
* 公司法律信息

这类情况标记：

```text
BLOCKED_BY_EXTERNAL_CREDENTIALS
```

其余工作继续。

---

# 2. 品牌

正式品牌：

# TakeMoveReturn

品牌核心来自产品现场操作：

```text
TAKE
MOVE
RETURN
```

Descriptor：

# Construction Tool Tracking Software

推荐品牌显示：

```text
TakeMoveReturn
Construction Tool Tracking Software
```

---

# 3. 品牌配置

所有品牌信息集中：

```text
src/config/site.ts
```

至少：

```ts
name: "TakeMoveReturn"
domain
siteUrl
supportEmail
privacyEmail
companyLegalName
```

正式域名确认前：

统一依赖：

```text
NEXT_PUBLIC_SITE_URL
```

禁止在代码里散落硬编码域名。

---

# 4. 产品一句话定义

> TakeMoveReturn is a simple QR-based tool tracking SaaS for small construction crews that shows who has every tool, where it is, and what happened to it.

---

# 5. ICP

核心客户：

# 5–50人小型施工公司

包括：

* General Contractors
* Electrical Contractors
* Plumbing Contractors
* HVAC Contractors
* Roofing Contractors
* Remodeling Companies
* Specialty Contractors
* Small Construction Crews

不要优先针对：

Enterprise Asset Management。

---

# 6. 核心问题

产品必须回答：

```text
Who has the tool?
Where is it?
Which worker has it?
Which truck is it on?
Which job site is it at?
When did it move?
Was it returned?
Is it damaged?
Is maintenance due?
```

---

# 7. 核心业务闭环

```text
Tool
→ QR
→ TAKE
→ MOVE
→ RETURN
→ Damage / Maintenance
→ Complete History
```

---

# 8. 产品绝对不能变成什么

禁止主动扩展成：

* ERP
* CRM
* Payroll
* Accounting
* Full CMMS
* Fleet Telematics
* GPS Fleet Platform
* Procurement Suite
* Construction Project Management
* Workforce Management
* IT Asset Management
* Generic Inventory ERP
* MDM
* Advanced Fleet Management

任何新功能必须问：

> Does this help a construction crew know where its tools are, who has them, or what happened to them?

如果不是：

不要做。

---

# 9. 核心差异化

必须贯穿：

产品、首页、Pricing、Onboarding。

## Unlimited Field Workers

普通现场员工：

所有套餐 Unlimited。

## No Native App Required

现场核心操作：

手机Browser完成。

## Fast Scan

目标：

```text
Scan
→ TAKE / MOVE / RETURN
→ Complete
```

正常约5秒。

## Spreadsheet Migration

```text
CSV/XLSX
→ Upload
→ Map
→ Preview
→ Import
→ QR
```

## Reliable History

所有关键动作形成 Transaction。

## Easy Correction

错误通过 Correction 修正。

不得无痕重写历史。

## No Expensive Hardware

核心只需要：

QR + browser。

---

# 10. SEO战略

TakeMoveReturn 是：

# SEO-first SaaS

不是：

做完产品最后补SEO。

SEO必须影响：

* URL
* H1
* Title
* 页面结构
* Copy
* Internal Links
* Product screenshots
* Schema
* Sitemap
* Content architecture
* Industry pages
* Comparison / Best pages
* Guides
* Free templates / link bait
* Backlink acquisition

SEO总原则：

```text
1 search-intent cluster
→ 1 canonical URL
→ 1 Primary Keyword
→ 多个 Secondary / semantic keywords
```

禁止：

* 一个近义词做一个页面
* 为了关键词批量生成 doorway pages
* 因为竞品覆盖某关键词就改变产品边界
* 为了搜索量引入 GPS / RFID / Fleet / ERP / Procurement / Workforce 功能
* 为了SEO声称不存在的功能

如果关键词与真实产品不匹配：

# 不发布。

---

# 11. Keyword Single Source of Truth

建立：

```text
src/data/seo-keywords.ts
```

字段至少：

```ts
keyword
cluster
volume
kd
cpc
intent
intentFit
priority
targetUrl
pageType

metricSource
metricScope
metricCheckedAt

competitorEvidence
needsUSVerification

status
notes
```

其中：

```text
intentFit:
strong
mixed
weak
excluded

priority:
P0
P1
P2
HOLD

status:
locked
candidate
verify_before_build
excluded
```

## 数据规则

1. 已有 TakeMoveReturn 原始关键词数据继续保留，视为当前项目基准数据。
2. 本轮竞品数据来自 Semrush 竞品 Organic Keywords 导出，主要为 Global 数据。
3. 竞品 Global 数据可以用于：
   * 发现关键词
   * 竞品交叉验证
   * 判断搜索意图
   * 判断页面架构
4. 竞品 Global 数据不能静默覆盖已有 US / 项目基准数据。
5. 任何新建 Money Page / Industry Page 在正式 index 前：
   * 用 Semrush US database 再核一次
   * 检查 Google US SERP
6. CPC 缺失：
   ```text
   null
   ```
   禁止AI猜测。
7. Volume / KD / CPC：
   # 禁止AI自行编造。

---

# 12. 核心关键词数据：项目基准

必须录入：

| Keyword                                    | Volume | KD |    CPC |
| ------------------------------------------ | -----: | -: | -----: |
| equipment management software              |  1,600 | 18 | $35.64 |
| tool tracking software                     |  1,000 | 23 | $20.95 |
| construction equipment management software |    880 | 14 | $23.87 |
| tool management software                   |    720 | 11 | $15.44 |
| construction equipment tracking software   |    590 | 15 | $15.72 |
| tool inventory software                    |    480 | 11 | $26.71 |
| construction tool tracking                 |    390 | 10 | $30.15 |
| construction asset tracking software       |    390 | 14 | $43.52 |
| asset tagging system                       |    390 | 14 | $42.75 |
| construction tool tracking software        |    320 | 11 | $21.23 |
| barcode asset tracking                     |    320 | 10 | $18.96 |
| equipment management system                |    320 | 11 | $35.88 |
| asset check out                            |    260 | 10 | $18.68 |

这些为项目既有基准值。

不要因为竞品 Global 数据出现轻微差异就覆盖。

---

# 13. Supporting Keywords：项目基准

| Keyword                        | Volume | KD |    CPC |
| ------------------------------ | -----: | -: | -----: |
| tool tracking                  |  1,000 | 20 | $10.77 |
| equipment tracking             |    880 | 23 | $20.68 |
| equipment tracker              |    480 | 25 | $19.90 |
| equipment tracking system      |    480 | 29 | $37.51 |
| construction asset tracking    |    390 | 21 | $36.26 |
| equipment inventory software   |    390 | 21 | $26.50 |
| fixed asset tracking software  |    390 | 25 | $33.31 |
| asset tag system               |    320 | 29 | $42.75 |
| tool management                |    480 | 14 |  $6.24 |
| tool management system         |    480 | 11 | $12.16 |
| tool inventory                 |    320 | 27 | $13.52 |
| tool inventory management      |    320 | 27 | $20.69 |
| tool inventory tracking system |    320 | 22 | $16.29 |

---

# 14. 竞品验证新增关键词

以下数据来自本轮竞品 Semrush Global Organic Keywords。

必须标记：

```text
metricScope: global
metricSource: competitor_semrush
needsUSVerification: true
```

不得静默当作 US 最终值。

## Core / Money Cluster

| Keyword | Volume | KD | Evidence | Status |
|---|---:|---:|---|---|
| tool tracking system for construction | 170 | 8 | MapTrack | locked-secondary |
| tools and equipment tracking | 210 | 7 | ShareMyToolbox + MapTrack | locked-secondary |
| small tool tracking software | 140 | 11 | ShareMyToolbox | locked-secondary |
| tool checkout system | 140 | 2 | ShareMyToolbox | locked-secondary |
| tool management systems | 210 | 10 | AlignOps | locked-secondary |
| tool management solution | 170 | 12 | AlignOps | locked-secondary |
| tool management tool | 140 | 12 | AlignOps | locked-secondary |

## Commercial / Best Cluster

| Keyword | Volume | KD | Evidence | Status |
|---|---:|---:|---|---|
| best tool tracking software | 110 | 4 | ShareMyToolbox | P1 |
| best tool tracking system | 110 | 9 | ShareMyToolbox + MapTrack | P1 |
| best tool tracking platform for field crews | 90 | 8 | ShareMyToolbox | P1 |
| best tool tracking platforms for construction contractors | 70 | 12 | ShareMyToolbox | P1 |

## QR Cluster

| Keyword | Volume | KD | Evidence | Status |
|---|---:|---:|---|---|
| qr code tracking system | 70 | 16 | GoCodes | candidate |
| qr code tracking | 390 | 24 | MapTrack | candidate |
| qr tracking | 260 | 26 | MapTrack | candidate |

说明：

QR 是真实产品核心。

但泛 `qr tracking` 可能混入物流/营销/包裹等意图。

因此当前策略：

```text
先加强：
/
 /asset-tagging-system
 /equipment-checkout

US SERP验证后：
如意图明显属于工具/设备追踪，
再创建：
/qr-code-tool-tracking
```

禁止为了抢 QR 词声称支持：

* RFID
* GPS
* Bluetooth tracking
* Telematics

---

# 15. Maintenance / Service Keywords

项目基准：

| Keyword                                     | Volume | KD |    CPC |
| ------------------------------------------- | -----: | -: | -----: |
| construction equipment maintenance software |    590 | 19 | $43.30 |
| equipment maintenance tracking software     |    590 | 28 | $55.19 |
| asset maintenance software                  |    590 | 28 | $21.56 |
| work order tracking software                |    390 | 26 | $34.53 |
| heavy equipment management software         |    390 | 15 | $45.27 |
| heavy equipment fleet management software   |    320 | 16 | $36.88 |

竞品新增 Guide 机会：

| Keyword | Volume | KD | Evidence |
|---|---:|---:|---|
| tool calibration | 170 | 19 | GoCodes |
| calibrate tool | 110 | 11 | GoCodes |

处理：

```text
/guides/tool-calibration-tracking
```

不要因为：

```text
heavy equipment fleet management software
```

增加 GPS / Fleet Telematics。

---

# 16. 信息 / Guide Keywords

## Existing Core Informational

Primary：

```text
how to manage construction site inventory
```

项目基准：

```text
Volume 1,600
KD 23
CPC $0
```

页面：

```text
/blog/how-to-manage-construction-site-inventory
```

必须明确：

```text
Materials / consumables
→ traditional inventory

Reusable tools / equipment
→ TakeMoveReturn
```

不要把产品扩成 Generic Inventory ERP。

## Competitor-validated Guides

| Keyword | Volume | KD | Evidence | Target |
|---|---:|---:|---|---|
| how to keep track of tools and equipment | 70 | 12 | ShareMyToolbox | `/guides/how-to-keep-track-of-tools-and-equipment` |
| how to store power tools | 110 | 11 | GoCodes | `/guides/how-to-store-power-tools` |
| storing power tools | 590 | 19 | GoCodes | same page |
| how much does asset tracking cost | 70 | 11 | GoCodes | `/guides/asset-tracking-cost` |
| asset tracking technology | 320 | 23 | AlignOps | `/guides/asset-tracking-technologies` |
| asset tracking technologies | 140 | 22 | AlignOps | same page |
| technology asset tracking | 390 | 20 | AlignOps | same page |
| tool calibration | 170 | 19 | GoCodes | `/guides/tool-calibration-tracking` |
| calibrate tool | 110 | 11 | GoCodes | same page |

所有竞品新增 Guide：

```text
needsUSVerification: true
```

但因为与产品高度匹配，可列为 P1 内容计划。

---

# 17. Mixed Intent Keywords

以下词存在明显 Hardware / GPS / broader intent：

## equipment tracker

```text
480 / KD25 / $19.90
intentFit: mixed
```

## equipment tracking

```text
880 / KD23 / $20.68
intentFit: mixed
```

## equipment tracking system

```text
480 / KD29 / $37.51
intentFit: mixed
```

可以自然出现。

禁止直接当：

H1 / Primary Keyword

除非未来重新 SERP 验证。

---

# 18. 不作为初期主攻词

```text
asset management software
6600 / KD45 / $35.58

IT asset management software
3600 / KD48 / $39.52

asset management system
2400 / KD57 / $34

asset tracking software
2400 / KD35 / $41.78

equipment maintenance software
2400 / KD40 / $51.89

asset tracking system
1600 / KD49 / $42.75

equipment tracking software
1000 / KD39 / $58.44
```

不要为了抢这些词：

改变产品边界。

---

# 19. Generic Inventory 词处理

以下关键词不做核心 Money Page：

```text
cloud based inventory management
2900 / KD21 / $25.07

cloud based inventory management systems
1900 / KD20 / $25.07

inventory system for small business
1900 / KD22 / $17.83

small business inventory management
1900 / KD18 / $17.83

inventory monitoring system
2400 / KD26 / $22.57

database inventory management system
1600 / KD25 / $10.50

cloud inventory system
1300 / KD28 / $25.07
```

竞品还证明了大量 Generic Inventory 大词：

```text
inventory management software
inventory tracking software
warehouse inventory software
small business inventory software
```

都不要做核心 Money Page。

原因：

```text
SKU / warehouse / ecommerce / consumables intent 太强
```

Sortly 可以借鉴：

* 产品展示
* editorial/listing backlink ecosystem

不能借鉴：

* Generic Inventory 定位

---

# 20. 首页 Keyword Map：最终锁定

URL：

```text
/
```

Primary：

```text
construction tool tracking
390 / KD10 / $30.15
```

Close Primary：

```text
construction tool tracking software
320 / KD11 / $21.23
```

Secondary：

```text
tool tracking software
1000 / KD23 / $20.95

tool tracking
1000 / KD20 / $10.77

tool tracking system for construction
170 / KD8 / CPC unknown / Global competitor evidence

tools and equipment tracking
210 / KD7 / CPC unknown / multi-competitor evidence

small tool tracking software
140 / KD11 / CPC unknown / competitor evidence
```

Cannibalization Rule：

这些词：

# 全部归首页。

禁止另外创建：

```text
/tool-tracking-software
/construction-tool-tracking
/construction-tool-tracking-software
/tool-tracking-system-for-construction
/tools-and-equipment-tracking
/small-tool-tracking-software
```

首页必须同时表达：

```text
Construction
Tools
QR
TAKE / MOVE / RETURN
Workers
Trucks
Job Sites
No native app
Unlimited field workers
Spreadsheet import
```

---

# 21. Equipment Management Page

```text
/construction-equipment-management-software
```

Primary：

```text
construction equipment management software
880 / KD14 / $23.87
```

Secondary：

```text
equipment management software
1600 / KD18 / $35.64

equipment management system
320 / KD11 / $35.88
```

不要扩展到：

* Fleet
* GPS
* fuel
* telematics

---

# 22. Equipment Tracking Page

```text
/construction-equipment-tracking-software
```

Primary：

```text
construction equipment tracking software
590 / KD15 / $15.72
```

Mixed-intent词：

```text
equipment tracking
equipment tracker
equipment tracking system
```

只能辅助自然使用。

---

# 23. Tool Management Page：最终优化

```text
/tool-management-software
```

Primary：

```text
tool management software
720 / KD11 / $15.44
```

Secondary：

```text
tool management
480 / KD14 / $6.24

tool management system
480 / KD11 / $12.16

tool management systems
210 / KD10 / CPC unknown

tool management solution
170 / KD12 / CPC unknown

tool management tool
140 / KD12 / CPC unknown
```

后3个为 AlignOps 竞品验证 Global 数据。

全部归：

```text
/tool-management-software
```

禁止创建同义页面。

---

# 24. Tool Inventory Page

```text
/tool-inventory-software
```

Primary：

```text
tool inventory software
480 / KD11 / $26.71
```

Secondary：

```text
equipment inventory software
390 / KD21 / $26.50

tool inventory
320 / KD27 / $13.52

tool inventory management
320 / KD27 / $20.69

tool inventory tracking system
320 / KD22 / $16.29
```

页面必须明确：

TakeMoveReturn 是：

```text
Reusable Tool / Equipment Inventory
```

不是：

```text
Warehouse / SKU / Consumables ERP
```

---

# 25. Construction Asset Tracking

```text
/construction-asset-tracking-software
```

Primary：

```text
construction asset tracking software
390 / KD14 / $43.52
```

Secondary：

```text
construction asset tracking
390 / KD21 / $36.26
```

不主动主攻泛：

```text
asset tracking software
asset tracking system
```

---

# 26. Maintenance SEO Page

```text
/construction-equipment-maintenance-software
```

Primary：

```text
construction equipment maintenance software
590 / KD19 / $43.30
```

Secondary：

```text
equipment maintenance tracking software
590 / KD28 / $55.19

asset maintenance software
590 / KD28 / $21.56
```

产品范围保持轻量：

```text
Last Service
Next Service
Interval
Reminder
Cost
History
Notes
Attachments
```

不要变 Full CMMS。

---

# 27. Asset Tagging / QR Page Strategy

当前 URL：

```text
/asset-tagging-system
```

Primary：

```text
asset tagging system
390 / KD14 / $42.75
```

Secondary：

```text
barcode asset tracking
320 / KD10 / $18.96

asset tag system
320 / KD29 / $42.75
```

必须增加真实 QR 产品内容：

```text
QR label
scan from phone browser
TAKE
MOVE
RETURN
No dedicated scanner
No native app required
```

QR competitor candidates：

```text
qr code tracking system
70 / KD16

qr code tracking
390 / KD24

qr tracking
260 / KD26
```

在 US SERP 未确认前：

# 不创建独立 QR Money Page。

如果 US SERP 验证：

```text
qr code tool tracking
qr tool tracking
qr equipment tracking
```

与本产品高度匹配，才允许：

```text
/qr-code-tool-tracking
```

---

# 28. Equipment Checkout：重点强化

```text
/equipment-checkout
```

Primary：

```text
asset check out
260 / KD10 / $18.68
```

Secondary：

```text
tool checkout system
140 / KD2 / CPC unknown
equipment checkout
tool checkout tracking
tool return tracking
```

其中：

```text
tool checkout system
```

来自 ShareMyToolbox 竞品验证。

这是产品 TAKE / RETURN 闭环的高匹配词。

页面必须真实展示：

```text
Worker scans QR
→ TAKE
→ tool assigned
→ MOVE if needed
→ RETURN
→ history retained
```

禁止为：

```text
/tool-checkout-system
```

另建重复页面。

---

# 28A. Industry SEO：最终锁定

Industry Pages 不再只是“未来预留”。

进入正式 SEO Roadmap。

## P0

```text
/industries/plumbing-contractors
/industries/electrical-contractors
/industries/general-contractors
```

## P1

```text
/industries/remodeling-contractors
/industries/concrete-contractors
/industries/civil-engineering
```

## P2 / 待验证

```text
/industries/restoration-contractors
/industries/hvac-contractors
/industries/roofing-contractors
```

### Plumbing Keyword Cluster

竞品验证：

```text
tool tracking solution for plumbers
110 / KD0

tool tracking tool for plumbers
140 / KD1

tool management tool for plumbers
110 / KD0

asset tracking tool for plumbers
110 / KD0

plumbing inventory software
260 / KD11
```

Evidence：

```text
ShareMyToolbox
MapTrack
Sortly
```

Primary 语义：

```text
tool tracking software for plumbing contractors
```

注意：

`plumbing inventory software` 只能作为辅助语义。

不得把产品写成：

Consumables / parts / warehouse inventory system。

### Electrical Keyword Cluster

```text
tool tracking solution for electricians
110 / KD3

tool tracking tool for electricians
140 / KD1
```

Evidence：

```text
ShareMyToolbox
MapTrack
AlignOps
```

三竞品验证。

状态：

# P0 LOCKED

### General Contractors Cluster

```text
tool tracking solution for general contractors
110 / KD3

tool tracking software for general contractors
110 / KD11
```

Evidence：

```text
ShareMyToolbox
```

状态：

P0 / US SERP final check before index。

### Builders / Remodeling Cluster

竞品验证：

```text
tool tracking solution for builders
140 / KD13

tool tracking software for builders
110 / KD4
```

不要同时创建：

```text
/builders
/remodeling
```

如果 SERP 意图高度重叠：

优先：

```text
/industries/remodeling-contractors
```

并自然覆盖 builders 语义。

### Concrete Contractors

```text
tool tracking software for concrete contractors
110 / KD3
```

状态：

P1。

### Civil Engineering

竞品验证：

```text
tool tracking solution for civil engineers
110 / KD6

tool tracking tool for civil engineers
110 / KD2

asset tracking software for civil engineers
70 / KD2

asset tracking solution for civil engineers
90 / KD5
```

Evidence：

```text
GoCodes
AlignOps
```

状态：

P1。

### Industry Page Anti-Doorway Rule

每个 Industry Page 必须至少包含真实差异：

* 该行业常见工具
* 该行业常见现场流转
* Worker / Truck / Job Site 场景
* 该行业最典型丢失/归还问题
* 与 Excel / paper sheet 的比较
* 真实产品 UI / screenshot
* QR Take / Move / Return workflow
* FAQ
* 内链到 Money Pages
* CTA

禁止：

把同一页面只替换：

```text
plumber
→ electrician
→ contractor
```

就发布。

---

# 28B. Best / Commercial Content

正式规划：

```text
/best/tool-tracking-software
```

覆盖：

```text
best tool tracking software
110 / KD4

best tool tracking system
110 / KD9

best tool tracking platform for field crews
90 / KD8

best tool tracking platforms for construction contractors
70 / KD12
```

Evidence：

```text
ShareMyToolbox
MapTrack
```

Priority：

# P1

要求：

* 客观比较
* 有来源
* 明确 checkedAt
* 不伪造评分
* 不伪造客户评价
* 不伪造“#1”
* 不隐藏 TakeMoveReturn 自己是比较方
* 竞品功能/价格必须有证据

---

# 28C. Alternatives Pages

正式规划：

```text
/alternatives/sharemytoolbox
/alternatives/gocodes
/alternatives/sortly
/alternatives/toolwatch
```

优先级：

```text
P1: ShareMyToolbox
P1: GoCodes
P2: Sortly
P2: ToolWatch
```

在：

# Legal / competitor factual review

完成前：

```text
noindex
```

或不发布。

---

# 28D. Guide Roadmap

P1：

```text
/guides/how-to-keep-track-of-tools-and-equipment
/guides/how-to-store-power-tools
/guides/asset-tracking-cost
/guides/asset-tracking-technologies
/guides/tool-calibration-tracking
/guides/qr-code-vs-barcode-tool-tracking
```

每篇 Guide：

* 先解决问题
* 不先推销产品
* 用真实产品场景承接
* 至少一个自然 CTA
* 内链到相关 Money Page
* 不写 AI thin content

---

# 28E. Template / Link-Bait SEO

MapTrack 证明：

```text
/templates/
```

是值得借鉴的 SEO 模型。

TakeMoveReturn 候选：

```text
/templates/tool-inventory-spreadsheet
/templates/tool-checkout-sheet
/templates/equipment-checkout-form
/templates/tool-maintenance-log
/templates/tool-return-form
/templates/construction-tool-inventory-template
```

状态：

# VERIFY_BEFORE_BUILD

这些具体模板词尚未完成本项目 US Volume/KD 验证。

不要在没有验证前声称：

有多少搜索量。

模板产品逻辑：

```text
Free Excel / PDF
→ User experiences manual tracking limits
→ Import CSV/XLSX
→ Generate QR
→ Start TakeMoveReturn
```

模板页必须真正提供有用资源。

不能只做一篇 SEO 文章假装“template”。

---

# 28F. Special Query：Tool Crib

多个竞品出现：

```text
tool crib checkout return system fields manufacturing tool tracking
880 / KD2
```

Evidence：

```text
GoCodes
Sortly
```

但 query 本身不自然。

禁止原样做页面。

必须先拆分并验证：

```text
tool crib software
tool crib management software
tool crib checkout system
tool crib tracking software
tool checkout system
manufacturing tool tracking
```

当前状态：

# HOLD / VERIFY_BEFORE_BUILD

---

# 28G. SEO Release Order

不要一次发布几十个页面。

## Phase 1 — Core

必须优先完成：

```text
/
 /construction-equipment-management-software
 /construction-equipment-tracking-software
 /construction-asset-tracking-software
 /construction-equipment-maintenance-software
 /tool-management-software
 /tool-inventory-software
 /asset-tagging-system
 /equipment-checkout
 /blog/how-to-manage-construction-site-inventory
```

## Phase 2 — P0 Industry

```text
/industries/plumbing-contractors
/industries/electrical-contractors
/industries/general-contractors
```

## Phase 3 — Commercial + Guides

```text
/best/tool-tracking-software

/guides/how-to-keep-track-of-tools-and-equipment
/guides/how-to-store-power-tools
/guides/asset-tracking-cost
/guides/asset-tracking-technologies
/guides/tool-calibration-tracking
/guides/qr-code-vs-barcode-tool-tracking
```

## Phase 4 — Templates

仅在 US 关键词验证后：

```text
/templates/*
```

## Phase 5 — P1/P2 Industry + Alternatives

```text
/industries/remodeling-contractors
/industries/concrete-contractors
/industries/civil-engineering
/industries/restoration-contractors

/alternatives/*
```

---

# 28H. Keyword Cannibalization Rules

必须在：

```text
npm run seo:audit
```

中检查：

* same primary keyword
* overlapping keyword cluster
* duplicate title intent
* duplicate H1 intent
* duplicate canonical
* sibling pages competing for same SERP

强制规则：

```text
Homepage:
construction tool tracking cluster

/tool-management-software:
tool management cluster

/tool-inventory-software:
tool inventory cluster

/equipment-checkout:
checkout / return cluster

/asset-tagging-system:
asset tag + QR support cluster

/best/tool-tracking-software:
best / comparison cluster

每个 /industries/*:
industry-specific cluster
```

如果两个页面目标意图高度重叠：

# 合并，不新增。

---

# 28I. SEO页面质量

所有 Money / Industry / Best / Guide 页面必须：

* Direct Answer
* Real Product UI
* User Pain
* Construction Scenario
* Workflow
* Relevant Features
* Spreadsheet/manual comparison where relevant
* FAQ
* CTA
* Internal links
* Unique value
* Real screenshots where product exists

不要：

写大量 SEO 文字才介绍产品。

不要：

* Fake reviews
* Fake ratings
* Fake logos
* Fake customers
* Fake awards
* Fake usage statistics
* Fake case studies

---

---

# 29. 首页Hero

SEO Title初始方向：

> Construction Tool Tracking Software | TakeMoveReturn

H1：

# Construction Tool Tracking That Shows Who Has Every Tool.

Subheading：

> Simple QR-based construction tool tracking software for small crews. Know who has each tool, where it is, and whether it was returned — across workers, trucks, warehouses and job sites, with no native app or expensive tracking hardware.

CTA：

# Start Free

Secondary：

# See How It Works

Microcopy：

> Free for 25 tools · No credit card · Unlimited field workers

---

# 30. 首页第二屏

标题：

# Stop asking “Who has the tool?”

展示真实产品UI：

```text
M18 Impact Driver

Currently
John Martinez

Location
Riverside Job Site

Since
Sep 22, 8:41 AM

Condition
Good
```

---

# 31. 首页核心流程

标题：

# Take. Move. Return.

步骤：

```text
Add
→ Label
→ Scan
```

Add：

Import tools.

Label：

Print QR.

Scan：

Take / Move / Return.

---

# 32. Field UI 首页展示

```text
M18 Drill

TAKE

MOVE

RETURN

Report Damage
```

重点：

# No native app required.

---

# 33. Construction Flow模块

标题：

# Built for how construction actually works

展示：

```text
Worker
Truck
Job Site
Warehouse
```

工具在这些Location/Holder之间流动。

---

# 34. 差异化模块

必须突出：

# 5-second scans

# Unlimited field workers

# No expensive hardware

# Import Excel in minutes

---

# 35. Maintenance模块

首页只展示：

* Damage report
* Maintenance due
* Repair history

不能压过Tool Tracking主线。

---

# 36. Excel Migration模块

```text
Excel / CSV
→ Upload
→ Map Fields
→ Generate QR
→ Start Scanning
```

CTA：

# Import My Tool List

---

# 37. 最终Pricing Strategy

TakeMoveReturn使用：

# Freemium + Fixed Tier Pricing

绝不按普通Field Worker数量收费。

币种：

# USD

---

# 38. Final Pricing

## Free

```text
$0
25 active tools
1 admin
Unlimited field workers
100 MB storage
```

适合：

体验、微型团队、验证产品。

---

## Starter

Monthly：

# $19/month

Annual：

# $190/year

相当于：

12个月服务只付10个月价格。

权益：

```text
200 active tools
2 admins
Unlimited field workers
2 GB storage
```

---

## Growth

Monthly：

# $39/month

Annual：

# $390/year

权益：

```text
600 active tools
5 admins
Unlimited field workers
10 GB storage
```

---

## Pro

Monthly：

# $79/month

Annual：

# $790/year

权益：

```text
2,000 active tools
10 admins
Unlimited field workers
25 GB storage
```

---

# 39. Annual Billing Message

Pricing页面显示：

# Monthly / Annual

Annual旁边：

# Save 2 months

不要显示复杂的小数折扣。

实际：

```text
Annual price = Monthly price × 10
```

获得：

12个月服务。

---

# 40. Annual Pricing Configuration

禁止散落硬编码。

建立：

```text
src/config/plans.ts
```

每个Plan至少：

```ts
id
name

monthlyPrice
annualPrice

stripeMonthlyPriceId
stripeAnnualPriceId

toolLimit
adminLimit
fieldWorkerLimit
storageLimitBytes
```

FieldWorkerLimit：

```text
unlimited
```

---

# 41. Stripe Monthly / Annual

Stripe为每个Paid Plan配置：

独立Monthly Price。

独立Annual Price。

不要依赖客户端计算价格。

服务器根据：

```text
plan
billing_interval
```

选择允许的Stripe Price ID。

禁止客户端直接提交任意：

price_id。

---

# 42. Pricing Server Enforcement

必须服务端执行：

* Tool limit
* Admin limit
* Storage limit
* Subscription entitlement
* Billing interval

不能只是：

UI隐藏按钮。

---

# 43. Tool Limit定义

Tool限制计算：

# Active / usable tool records

Retired Tools：

不计入active plan capacity。

但是：

历史仍保留。

如果恢复Retired Tool：

必须重新检查Plan Capacity。

---

# 44. Starter Capacity

Starter：

# 200 Tools

不是旧版150。

原因：

减少客户从150→151时过早被迫升级。

---

# 45. Growth Capacity

Growth：

# 600 Tools

不是旧版500。

形成：

```text
200
→ 600
→ 2,000
```

更自然容量阶梯。

---

# 46. Storage UX

Dashboard必须展示：

```text
Storage used
82 MB / 100 MB
```

以及进度条。

---

# 47. Storage 80% Threshold

达到：

# 80%

显示轻度Warning：

> You're using 80% of your storage.

不要阻塞操作。

---

# 48. Storage 90% Threshold

达到：

# 90%

持续显示Warning Banner：

> Storage is almost full. Delete old attachments or upgrade your plan.

CTA：

```text
Manage Storage
Upgrade Plan
```

---

# 49. Storage 100% Threshold

达到/超过Plan Storage Limit：

禁止：

# New file uploads

但必须继续允许：

* TAKE
* MOVE
* RETURN
* Search
* Existing file access
* Export
* Tool history
* Existing Tool operations

绝对禁止：

因为Storage满了导致现场Tracking停摆。

---

# 50. Storage Full Message

统一：

> Storage limit reached. Existing files remain available. Delete files or upgrade your plan to upload new attachments.

CTA：

# Manage Storage

# Upgrade Plan

---

# 51. 不做Storage Overage Billing

第一阶段最终产品：

不要做：

```text
$X per extra GB
```

不要做复杂Metered Storage Billing。

达到配额：

清理文件或升级套餐。

---

# 52. Plan Upgrade

Upgrade：

例如：

```text
Starter
→ Growth
```

默认：

立即生效。

Stripe处理：

合理Proration。

升级成功Webhook确认后：

更新Entitlements。

---

# 53. Plan Downgrade

Downgrade：

默认在：

# Current billing period end

生效。

不要中途突然减少容量。

UI必须提前显示：

新Plan limits。

---

# 54. Downgrade Over-Limit

例如：

客户Growth：

```text
430 Tools
```

降级到Starter：

```text
200 Tool limit
```

绝对不能删除：

230 Tools。

进入：

# OVER_LIMIT

状态。

---

# 55. Tool Over-Limit Behaviour

超过新Plan Tool Limit后：

继续允许：

* View all existing tools
* Search
* TAKE
* MOVE
* RETURN
* Damage
* Maintenance
* Export
* Retire tools

禁止：

* Create new tool
* Import new tools
* Restore retired tool if still above capacity

直到：

```text
activeToolCount <= planLimit
```

或者重新升级。

---

# 56. Admin Over-Limit Behaviour

例如Growth有：

5 Admins

降到Starter：

2 Admin limit。

不要：

随机停用3个人。

进入：

OVER_LIMIT。

继续允许现有Admin登录。

禁止：

* Invite new admin
* Promote additional user to admin/manager

Owner需要：

Remove / demote members

或者：

Upgrade。

---

# 57. Storage Over-Limit after Downgrade

例如：

客户当前：

5GB

降级Starter：

2GB。

现有文件：

不删除。

继续可以：

* Read/download existing files
* Delete files
* Core tool tracking

禁止：

New Upload。

直到：

```text
storageUsage <= storageLimit
```

或升级。

---

# 58. Over-Limit Banner

Dashboard持续显示：

> Your account is above the limits of your current plan. Existing data is safe, but some new additions are restricted.

明确显示：

```text
Tools: 430 / 200
Admins: 4 / 2
Storage: 3.4 GB / 2 GB
```

CTA：

# Upgrade

# Manage Usage

---

# 59. Cancellation

默认：

# Cancel at period end

不是立即删除。

用户继续使用：

直到已支付周期结束。

---

# 60. Cancelled Subscription

周期结束后：

根据产品策略转为：

Free / restricted state。

绝对不能：

自动删除客户业务数据。

如果超出Free limits：

进入Over-Limit。

---

# 61. Failed Payment

Stripe付款失败：

状态：

```text
past_due
```

发送：

Billing Email。

不要第一次失败立刻删除/禁用数据。

---

# 62. Payment Grace Period

建议：

# 7-day grace period

期间：

产品正常使用。

持续提醒：

更新Payment Method。

---

# 63. Grace Period结束

仍未付款：

进入：

Restricted Billing State。

至少继续允许：

* 登录
* 查看数据
* Export
* 更新Payment Method

不要删除数据。

现场核心行为是否临时保留：

优先避免造成客户数据/现场安全问题。

实现中必须清晰记录规则。

---

# 64. Pricing Page

必须包含：

Monthly / Annual toggle。

默认可展示：

Annual Savings。

Pricing Card至少：

* Price
* Annual price
* Tool limit
* Admin limit
* Unlimited field workers
* Storage
* CTA

---

# 65. Pricing Copy

最重要卖点：

# Unlimited field workers on every plan.

不要把它隐藏在Feature Matrix底部。

---

# 66. Pricing Upsell

当用户撞到：

Tool Limit：

提示：

> You've reached your tool limit.

Storage：

> You've reached your storage limit.

Admin：

> You've reached your admin limit.

CTA：

# Upgrade Plan

同时允许：

# Manage Existing Data

不要只弹付费墙。

---

# 67. Stripe

使用：

* Stripe Checkout
* Stripe Billing
* Customer Portal
* Verified Webhooks

支持：

* Monthly
* Annual
* Upgrade
* Downgrade
* Cancellation
* Failed payment
* Payment retry

---

# 68. Stripe Source of Truth

数据库Subscription状态：

由：

# Verified Stripe Webhook

驱动。

不能：

用户返回success页面

就直接当成付款成功。

---

# 69. Stripe Webhook Security

必须：

* Verify signature
* Idempotent processing
* Store event ID
* Ignore duplicate events safely

---

# 70. Subscription Table

至少：

```text
id
company_id
stripe_customer_id
stripe_subscription_id

plan
billing_interval
status

current_period_start
current_period_end

cancel_at_period_end

created_at
updated_at
```

---

# 71. Plan Config

所有Plan限制：

只从：

```text
src/config/plans.ts
```

读取。

禁止多个地方出现：

200 / 600 / 2000

不同版本。

---

# 72. 技术栈

锁定：

```text
Next.js 16 App Router
TypeScript strict
React
Tailwind CSS
shadcn/ui

@opennextjs/cloudflare
Cloudflare Workers
Cloudflare R2
Cloudflare Queues
Cloudflare Cron
Cloudflare Turnstile
Cloudflare DNS

Supabase PostgreSQL
Supabase Auth
Supabase RLS

Stripe
Resend

MDX

GA4
Google Search Console
PostHog
Sentry

Vitest
Playwright
k6

GitHub
```

---

# 73. 禁止技术替换

未经明确批准：

禁止切换到：

* Vercel
* Netlify
* Firebase
* VPS
* Cloudflare Pages static export
* vinext
* D1作为主数据库

生产：

# Cloudflare Workers

适配：

# OpenNext

---

# 74. Architecture

使用：

# Modular Monolith

一个GitHub repository。

Marketing + SaaS：

同一个Next.js app。

---

# 75. 推荐目录

```text
src/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── q/
│   ├── api/
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── manifest.ts
│   └── layout.tsx
│
├── components/
│   ├── marketing/
│   ├── dashboard/
│   ├── field/
│   ├── tools/
│   ├── forms/
│   ├── seo/
│   └── ui/
│
├── content/
│   ├── blog/
│   ├── guides/
│   ├── help/
│   └── seo/
│
├── config/
│   ├── site.ts
│   ├── plans.ts
│   └── retention.ts
│
├── data/
│   ├── seo-keywords.ts
│   └── competitors.ts
│
├── lib/
│   ├── supabase/
│   ├── cloudflare/
│   ├── stripe/
│   ├── resend/
│   ├── auth/
│   ├── permissions/
│   ├── seo/
│   └── validation/
│
├── services/
├── types/
└── utils/

supabase/
└── migrations/

tests/
├── unit/
├── integration/
├── e2e/
└── load/
```

---

# 76. Cloudflare职责

Workers：

* Next.js
* SSR
* API
* Route Handlers
* Server Actions
* Stripe Webhooks
* Auth logic

R2：

* Tool Photos
* Damage Photos
* Maintenance Files

Queues：

* Import
* retryable batch jobs

Cron：

* Maintenance reminders
* Overdue digest
* temp import cleanup
* orphan cleanup

Turnstile：

* Signup abuse
* Login abuse
* PIN abuse escalation
* Password reset
* Contact form

---

# 77. Production Tier

正式环境：

按照：

# Cloudflare Workers Paid

设计和测试。

---

# 78. 数据库

使用：

# Supabase PostgreSQL

认证：

# Supabase Auth

授权：

# PostgreSQL RLS

---

# 79. 数据表

至少：

```text
companies
profiles
organization_members

workers
field_device_sessions
worker_sessions

locations
tools
tool_transactions

damage_reports

maintenance_schedules
maintenance_events
work_orders

import_jobs
import_rows

stored_files

subscriptions
notifications
audit_logs
invites

privacy_requests
support_requests
```

---

# 80. Tenant Isolation

所有业务表：

```text
company_id UUID NOT NULL
```

Company A：

不能：

Read / Update / Delete / Download

Company B数据。

---

# 81. RLS

所有业务表：

必须启用。

实现：

* SELECT
* INSERT
* UPDATE
* DELETE

不能只靠应用层过滤。

---

# 82. company_id

客户端传入的：

```text
company_id
```

永不可信。

服务端根据：

Auth + organization_members

解析。

---

# 83. Roles

标准Admin用户：

```text
owner
admin
manager
```

Field Worker：

独立轻身份体系。

---

# 84. Worker Fields

```text
id
company_id

name
phone
employee_code

pin_hash
pin_salt
pin_hash_version
pin_iterations

auth_version
status

created_at
updated_at
```

---

# 85. PIN

统一：

# 6位数字

禁止：

* 4位
* plaintext
* bcrypt
* bcryptjs
* MD5
* simple SHA256
* reversible encryption

---

# 86. PIN Hash

使用：

# Web Crypto

算法：

# PBKDF2-HMAC-SHA256

初始：

```text
600,000 iterations
16+ byte random salt
```

真实Cloudflare runtime benchmark后再最终确认。

---

# 87. PIN Pepper

Secret：

```text
WORKER_PIN_PEPPER
```

流程：

```text
PIN
→ HMAC with pepper
→ PBKDF2 with salt
→ hash
```

Pepper：

不能进入DB。

---

# 88. PIN Rate Limit

至少：

```text
company
worker
IP
```

维度。

有：

* failure count
* cooldown
* Turnstile escalation
* audit event

---

# 89. Shared Device

假设：

多个Worker共用同一手机/Tablet。

必须拆：

# Device Session

和：

# Worker Session

---

# 90. Device Session

```text
field_device_sessions
```

字段：

```text
id
company_id
device_token_hash
created_at
last_seen_at
expires_at
revoked_at
```

默认约30天。

仅表示：

Workspace context。

没有Mutation permission。

---

# 91. Worker Session

```text
worker_sessions
```

字段：

```text
id
company_id
worker_id
device_session_id

worker_auth_version

created_at
last_activity_at

idle_expires_at
absolute_expires_at

revoked_at
```

---

# 92. Worker Session Timeout

Idle：

# 15 minutes

可配置：

5–60 minutes。

Absolute：

# 8 hours

---

# 93. Switch Worker

现场页面始终显示：

```text
Signed in as:
John Martinez

Switch
```

Switch：

```text
End Worker Session
→ keep Device Session
→ choose next worker
→ PIN
```

---

# 94. Lock

Lock：

清除Worker Session。

保留Workspace。

---

# 95. Deactivate Worker

必须：

```text
status = inactive
auth_version += 1
revoke all sessions
```

所有写操作重新验证：

```text
worker.status == active
session.worker_auth_version == worker.auth_version
```

---

# 96. Reset PIN

同时：

```text
auth_version += 1
```

并revoke旧session。

---

# 97. QR原则

# QR = Tool Identifier

绝不等于：

Authorization。

---

# 98. QR Token

至少：

128-bit secure random。

```text
/q/{token}
```

禁止连续ID。

---

# 99. Anonymous QR

最多显示：

* Company
* Tool Name
* Asset Code

不能显示：

* Worker PII
* Internal Jobsite Detail
* Price
* Notes
* History

---

# 100. QR Mutation

TAKE/MOVE/RETURN/DAMAGE/MISSING：

必须：

有效Worker Session

或：

Admin/Manager session。

同时：

```text
session.company_id === tool.company_id
```

否则：

403。

---

# 101. QR Rotation

Admin：

可Rotate。

旧Token：

立即失效。

---

# 102. Locations

```text
warehouse
job_site
truck
other
```

字段：

```text
id
company_id
type
name
address
notes
active
created_at
updated_at
```

---

# 103. Tools

```text
id
company_id

asset_code
qr_token

name
category
brand
model
serial_number

purchase_date
purchase_price

status
condition

current_worker_id
current_location_id

description
notes
photo_key

expected_return_at

created_at
updated_at
retired_at
```

---

# 104. Tool Status

```text
available
checked_out
damaged
maintenance
missing
retired
```

Condition：

```text
new
good
fair
poor
unusable
```

---

# 105. Tool Transactions

字段：

```text
id
company_id
tool_id

transaction_type

from_worker_id
to_worker_id

from_location_id
to_location_id

performed_by_user_id
performed_by_worker_id

notes
reverses_transaction_id

created_at
```

类型：

```text
checkout
return
transfer
damage
maintenance
repair
missing
found
correction
retire
```

---

# 106. History

正常操作：

禁止Delete Transaction。

错误：

建立Correction Transaction。

---

# 107. Concurrency

必须防止：

* double checkout
* lost update
* simultaneous transfer

使用：

Postgres transaction / locking / concurrency control。

---

# 108. Field UX

移动端显示：

* Tool photo
* Tool name
* Asset code
* Current holder
* Current location
* Condition

按钮：

# TAKE

# MOVE

# RETURN

Secondary：

* Report Damage
* Report Missing

---

# 109. Dashboard

展示：

* Total Tools
* Available
* Checked Out
* Missing
* Damaged
* Maintenance Due
* Overdue

以及：

* Recent Activity
* Tools by Location
* Maintenance Due
* Overdue

---

# 110. Global Search

搜索：

* Tool
* Asset Code
* Brand
* Model
* Serial
* Worker
* Location
* Truck
* Job Site
* Notes

建立正确PostgreSQL indexes。

---

# 111. Tool Detail

包括：

* Photo
* QR
* Asset ID
* Name
* Category
* Brand
* Model
* Serial
* Holder
* Location
* Condition
* Purchase
* Damage
* Maintenance
* Notes
* Complete History

---

# 112. Worker Detail

显示：

* Current Tools
* Tool Count
* Recent Activity

支持：

* Return All
* Transfer Selected
* Reset PIN
* Revoke Sessions
* Deactivate

---

# 113. Damage

字段：

```text
id
company_id
tool_id
reported_by_worker_id
reported_by_user_id
severity
description
status
created_at
resolved_at
```

Severity：

```text
minor
needs_repair
unusable
lost
```

每份报告：

最多3图。

---

# 114. Maintenance

必须：

* Last Service
* Next Service
* Interval
* Reminder
* Cost
* Service History
* Notes
* Attachments

---

# 115. Work Orders

轻量：

```text
open
in_progress
completed
cancelled
```

不要扩展成Full CMMS。

---

# 116. Import

支持：

CSV

XLSX。

---

# 117. Import Limits

File：

# 10 MB max

Hard row limit：

# 5,000 rows

不是套餐限制。

---

# 118. Import Capacity

实际能新增：

```text
planToolLimit - currentActiveToolCount
```

---

# 119. Import User Experience

客户上传：

2,000 rows

系统内部自动Batch。

不要要求：

手工拆文件。

---

# 120. Browser Import

浏览器：

* Parse XLSX
* Select Sheet
* Detect Headers
* Mapping
* Preview
* Basic validation

服务器：

重新验证。

---

# 121. Import Jobs

```text
import_jobs
```

字段：

```text
id
company_id
user_id
filename
file_size

total_rows
valid_rows
invalid_rows
processed_rows
failed_rows

status

created_at
started_at
completed_at
error_message
```

---

# 122. Import Queue

使用：

# Cloudflare Queues

流程：

```text
Create job
→ split batches
→ enqueue
→ return job id
```

Consumer：

```text
validate
→ deduplicate
→ insert
→ progress
```

初始：

100 rows/batch。

---

# 123. Import Idempotency

Batch：

```text
import_job_id
batch_number
idempotency_key
```

Queue Retry：

不得产生duplicate tools。

---

# 124. Import Result

```text
Processed 1,300 / 2,000
```

完成：

```text
Imported 1,947
Skipped 12
Needs review 41
```

支持：

Download error rows。

---

# 125. Temporary Import

原始上传文件：

默认24小时清理。

---

# 126. Business Export

支持：

```text
tools.csv
workers.csv
locations.csv
transactions.csv
maintenance.csv
damage-reports.csv
```

---

# 127. R2 Plan Storage

正式：

```text
Free: 100 MB
Starter: 2 GB
Growth: 10 GB
Pro: 25 GB
```

---

# 128. Tool Images

每Tool：

1 active primary image。

---

# 129. Damage Images

每Damage Report：

最多3张。

---

# 130. Maintenance Files

每Maintenance Event：

最多3个附件。

---

# 131. Upload Limits

Images：

5 MB max raw。

客户端尽量压缩：

≤1.5 MB。

Maintenance：

10 MB max。

Allowed：

```text
image/jpeg
image/png
image/webp
application/pdf
```

服务器MIME验证。

---

# 132. stored_files

```text
id
company_id
bucket
object_key
original_filename
mime_type
size_bytes
entity_type
entity_id
uploaded_by
created_at
deleted_at
```

---

# 133. R2 Access

Private bucket。

company-scoped key。

所有读取：

授权检查。

---

# 134. R2 Cleanup

Cron处理：

* Replaced photos
* Deleted attachments
* Temp imports
* Orphans

---

# 135. Overdue

Expected Return超过：

显示：

# Overdue

不要增加新Tool Status。

---

# 136. Email

使用：

# Resend

发送：

* Welcome
* Verification
* Password Reset
* Invite
* Damage
* Maintenance
* Overdue
* Payment Failure
* Subscription
* Cancellation

---

# 137. Privacy

禁止未经法律审核宣称：

* GDPR compliant
* CCPA certified

必须提供产品能力。

---

# 138. Privacy Settings

```text
/app/settings/privacy
```

包括：

* Request My Data
* Export My Data
* Delete Account
* Privacy Requests

---

# 139. Privacy Requests

```text
privacy_requests
```

Types：

```text
access
export
rectification
deletion
restriction
```

---

# 140. Privacy Export

包括：

* Profile
* Email
* Membership
* Account Metadata
* Relevant Audit
* Support
* Privacy records

JSON / ZIP。

---

# 141. Delete Account

```text
Re-authenticate
→ Explain
→ Confirm
→ Controlled deletion
```

---

# 142. Delete Workspace

Owner：

需要：

* Re-authenticate
* Explicit confirmation
* Cancel subscription
* Explain data impact
* Cleanup

---

# 143. Soft Delete vs Privacy Delete

Tool Retire：

属于Product History。

Privacy Delete：

属于独立数据生命周期。

二者不能混为一谈。

---

# 144. Pseudonymization

必要历史保留时：

```text
John Smith
→ Deleted User
```

移除不必要PII。

---

# 145. Retention

配置：

```text
src/config/retention.ts
```

定义：

* App Logs
* Security Logs
* Billing
* Audit
* Support
* Import temp
* R2
* Deleted Accounts

---

# 146. Legal Pages

```text
/privacy
/terms
/dpa
/subprocessors
```

必须标：

# LEGAL REVIEW REQUIRED BEFORE PRODUCTION

---

# 147. Help Center

必须：

```text
/help
```

---

# 148. Help Categories

至少：

* Getting Started
* Tool Tracking
* Workers
* Locations
* Damage
* Maintenance
* Import / Export
* Billing
* Account & Privacy
* Troubleshooting

---

# 149. Help System

MDX：

```text
content/help/
```

支持：

* Search
* Categories
* Related Articles
* Previous/Next
* Real Updated Date

---

# 150. Support

```text
/help/contact
```

可以自动附加：

* Company ID
* Plan
* Page
* Browser
* Timestamp

不能发送：

* PIN
* Password
* Secret
* Auth Token

---

# 151. Competitors

正式研究集合：

```text
ProToolTrack
ShareMyToolbox
GoCodes
MapTrack
Sortly
ToolWatch / AlignOps
```

只能借鉴：

* 定位
* 信息架构
* workflow思路
* keyword clusters
* 内容类型
* backlink acquisition pattern

不能复制：

* 文案
* UI
* Logo
* Screenshots
* Proprietary assets
* 独有品牌表达

---

# 152. Competitor Learning：最终整合

## ProToolTrack

重点学习：

* 简单定位
* self-serve
* 小团队友好
* tool-tracking focus

## ShareMyToolbox

重点学习：

* Field workflow
* Industry SEO
* Plumbing / Electrical / General Contractor 长尾
* Tool checkout intent

## GoCodes

重点学习：

* QR / asset tracking education
* Guide 内容
* Trust
* Asset tracking cost
* Power-tool content
* Calibration content

不要因此扩：

* GPS
* RFID
* Bluetooth

## MapTrack

重点学习：

* SEO architecture
* Industry pages
* `/best/`
* `/templates/`
* informational → product funnel

不要因此扩：

* Fleet
* CMMS
* Geofence
* Oil & Gas platform

## Sortly

重点学习：

* Product presentation
* SaaS directories
* editorial/listicle backlink ecosystem

不要变成：

* Generic Inventory
* Warehouse ERP
* Retail Inventory

## ToolWatch / AlignOps

重点学习：

* Tool management language
* Electrical contractor SEO
* mature construction terminology

不要扩：

* Operations Management
* Payroll
* Workforce
* Fleet
* Safety platform

---

# 153. Competitor Evidence

建立：

```text
src/data/competitors.ts
```

每项至少：

```text
name
category
value
sourceUrl
checkedAt
evidenceType
notes
```

`evidenceType`：

```text
pricing
feature
positioning
seo_keyword
backlink
content_pattern
```

任何 Best / Alternatives 页面：

必须只使用这里已有证据或重新核验后的事实。

---

# 154. Backlink Strategy：正式纳入 Source of Truth

建立：

```text
src/data/backlink-targets.ts
```

字段至少：

```ts
domain
targetType
priority
competitorEvidence
sourceUrl
status
lastCheckedAt
outreachNotes
```

状态：

```text
research
qualified
outreach_ready
contacted
won
rejected
do_not_contact
```

---

# 155. P0 / P1 Backlink Targets

## P0 — Construction Executive

竞品共同证据：

```text
ShareMyToolbox
MapTrack
AlignOps / ToolWatch
```

目标：

```text
constructionexec.com/top-tech/
```

定位：

# Construction industry editorial / product recognition

执行方式：

* 研究最新 submission / nomination 规则
* 按真实产品提交
* 准备真实 screenshots
* 提供产品 category
* 提供 target customer
* 提供 pricing / workflow facts
* 不发“请给我外链”式邮件

禁止：

* fake award
* fake nomination
* claim inclusion before accepted

## P0/P1 — Camcode

竞品共同证据：

```text
ShareMyToolbox
GoCodes
```

已出现页面类型：

```text
Best tool inventory / equipment tracking software
Top asset tracking software
```

执行：

* editorial outreach
* 提供真实产品资料
* 说明小型 construction crews 定位
* 提供 QR Take / Move / Return 差异
* 不买垃圾 guest post

## P1 — SoftwareWorld

竞品共同证据：

```text
GoCodes
Sortly
```

目标：

* Asset Tracking Software
* Tool Tracking Software
* Construction Software

不要为了进入目录：

把 TakeMoveReturn 填成 Generic Inventory ERP。

## P1 — GoodFirms

竞品共同证据：

```text
GoCodes
Sortly
```

执行：

* 建立完整 software/company profile
* 选最接近的 category
* 保持产品描述与真实产品一致

---

# 156. Secondary Backlink Targets

## P1

```text
SaaSHub
```

用途：

* product listing
* alternatives ecosystem

## P1/P2

```text
PCMag
```

类型：

Editorial / review。

难度较高。

不做批量冷邮件轰炸。

## P2

```text
The Retail Exec
```

只在：

* asset inventory
* barcode inventory
* adjacent software editorial

真正相关时联系。

行业相关性低于 construction-specific sources。

## Manual Review

```text
ABC Convention
NUCA
```

先确定：

* association
* event
* sponsorship
* member resource
* editorial opportunity

再决定是否联系。

## Event-driven PR

```text
PRNewswire
```

仅用于：

* 正式产品发布
* 融资
* acquisition
* major launch
* significant company news

不是常规 backlink strategy。

---

# 157. Backlink Quality Gate

禁止主动追：

```text
random Blogspot domains
Yahoo search URLs
Bing image URLs
random .cfd
random .sbs
spam-like pages.dev
Aptoide mirrors
irrelevant download sites
PBN
link farms
bulk paid directories
reciprocal-link schemes
```

优先：

```text
Construction industry
Tool / equipment tracking relevance
Editorial context
Real audience
Real resource page
Real software comparison
Legitimate SaaS directory
Industry association
```

质量优先于数量。

---

# 158. Backlink Outreach Rules

所有 outreach：

* 个性化
* 简短
* 真实
* 不欺骗
* 不假装用户
* 不假装合作关系
* 不要求“dofollow”
* 不强迫链接
* 不群发完全相同模板

推荐价值点：

```text
QR-based tool tracking
Small construction crews
Unlimited field workers
No native app required
Spreadsheet import
TAKE / MOVE / RETURN
```

如果目标站已经收录多个竞品：

邮件重点：

```text
You already cover this category.
Here is a differentiated product for evaluation.
```

不是：

```text
Please add my backlink.
```

---

# 159. Alternative Pages

规划：

```text
/alternatives/sharemytoolbox
/alternatives/gocodes
/alternatives/sortly
/alternatives/toolwatch
```

不是立即全部 index。

优先级：

```text
P1 ShareMyToolbox
P1 GoCodes
P2 Sortly
P2 ToolWatch
```

---

# 160. Trademark + Competitor Index Gate

只使用竞品名称做合理识别。

禁止：

* Imply affiliation
* Imply endorsement
* Copy logos
* Copy visual identity
* Misstate competitor pricing/features

没有法律 / factual review：

```text
noindex
```

或不发布。

---

# 161. Content

使用：

# MDX

不要外接重 CMS。

内容目录：

```text
src/content/
├── blog/
├── guides/
├── industries/
├── best/
├── alternatives/
├── templates/
├── help/
└── seo/
```

---

# 162. SEO Frontmatter

```text
slug
title
description
h1

primaryKeyword
secondaryKeywords
cluster

volume
kd
cpc
metricScope
metricSource
metricCheckedAt

intent
intentFit
priority
pageType
competitorEvidence
needsUSVerification

datePublished
dateModified
lastReviewed
reviewCadenceDays

canonical
indexStatus
```

---

# 163. dateModified + Review Cadence

`dateModified`：

只有重大内容实际变化才更新。

禁止：

每次 build 自动刷新。

Review：

```text
Alternatives: 30 days
Best: 30–60 days
Money Pages: 90 days
Industry Pages: 90 days
Guides: 180 days
Templates: 180 days
Backlink targets: 60–90 days
```

---

# 164. SEO Audit

```text
npm run seo:audit
```

必须检测：

* stale content
* duplicate primary keyword
* duplicate canonical
* missing keyword data
* missing metric source
* missing metric scope
* cannibalization risk
* duplicate cluster ownership
* indexable page with `needsUSVerification: true`
* competitor page indexed without factual/legal review
* template page published without actual downloadable/useful resource

GitHub Actions：

每月执行。

输出：

Issue / Report。

不自动修改日期。

---

# 164A. Public Pages：最终分层

## Launch / Core

必须完成并可索引：

```text
/
/features
/pricing

/construction-equipment-management-software
/construction-equipment-tracking-software
/construction-asset-tracking-software
/construction-equipment-maintenance-software

/tool-management-software
/tool-inventory-software

/asset-tagging-system
/equipment-checkout

/blog/how-to-manage-construction-site-inventory

/help
/help/contact

/privacy
/terms
/dpa
/subprocessors
```

## P0 Industry

完成 US keyword / SERP final check 后 index：

```text
/industries/plumbing-contractors
/industries/electrical-contractors
/industries/general-contractors
```

## P1 Content

```text
/best/tool-tracking-software

/guides/how-to-keep-track-of-tools-and-equipment
/guides/how-to-store-power-tools
/guides/asset-tracking-cost
/guides/asset-tracking-technologies
/guides/tool-calibration-tracking
/guides/qr-code-vs-barcode-tool-tracking
```

## P1/P2 Expansion

```text
/industries/remodeling-contractors
/industries/concrete-contractors
/industries/civil-engineering
/industries/restoration-contractors
```

## Verify Before Build

```text
/qr-code-tool-tracking
/templates/*
```

## Competitor Review Gate

```text
/alternatives/*
```

默认：

```text
noindex
```

直到 factual + legal review 完成。

---

# 164B. Future SEO Rule

预留：

```text
/industries/
/alternatives/
/best/
/guides/
/templates/
```

但：

# 禁止批量薄内容。

任何新 SEO 页面都必须同时满足：

```text
Real search intent
+
Product fit
+
Unique content
+
Useful user value
+
No cannibalization
+
Correct index gate
```

---

---

# 165. Auth Pages

```text
/login
/signup
/forgot-password
/auth/callback
```

---

# 166. SaaS Pages

```text
/app/dashboard

/app/tools
/app/tools/[id]

/app/workers
/app/workers/[id]

/app/locations
/app/locations/[id]

/app/activity

/app/damage
/app/maintenance

/app/import
/app/reports

/app/settings
/app/settings/billing
/app/settings/privacy
```

---

# 167. Rendering

Marketing：

SSG / ISR优先。

Dashboard：

Dynamic。

不要整个站CSR。

---

# 168. Metadata

所有public page：

* Unique title
* Meta description
* H1
* Canonical
* OG
* Breadcrumb where appropriate

---

# 169. Schema

Home：

```text
Organization
WebSite
SoftwareApplication
```

Money：

```text
SoftwareApplication
BreadcrumbList
```

Blog：

```text
Article
BreadcrumbList
```

FAQ：

真实FAQ才使用。

---

# 170. Fake SEO禁止

禁止：

* Fake Reviews
* Fake Ratings
* Fake Customers
* Fake Awards
* Fake Testimonials
* Keyword stuffing
* Doorway pages
* AI thin content

---

# 171. Sitemap

包括：

公开可索引页面。

排除：

* `/app/*`
* `/api/*`
* private auth
* private QR

`lastmod`：

必须真实。

---

# 172. Robots

Dashboard：

```text
noindex,nofollow
```

禁止抓取：

```text
/app/
/api/
```

---

# 173. Canonical

统一：

```text
NEXT_PUBLIC_SITE_URL
```

禁止Workers Preview域名进入canonical。

---

# 174. Performance

目标：

```text
LCP <= 2.5s
INP <= 200ms
CLS <= 0.1
```

Marketing：

Server Components优先。

避免：

* 视频Hero
* 重动画
* 大量JS
* 大量第三方脚本

---

# 175. UI Style

要求：

* Professional
* Practical
* Construction-friendly
* High-trust
* Product-first

不要：

* 紫色AI宇宙
* 玻璃拟态泛滥
* 3D炫技
* 过多stock photos

---

# 176. Accessibility

实现：

* Semantic HTML
* Labels
* Focus
* Keyboard
* Contrast
* ALT
* Heading hierarchy

---

# 177. Analytics

使用：

* GA4
* Google Search Console
* PostHog
* Sentry

---

# 178. Events

至少：

```text
signup
company_created
first_tool_added
csv_imported
qr_generated
first_scan

checkout
return
transfer

damage_reported
maintenance_created

pricing_viewed
subscription_started
subscription_upgraded
subscription_downgraded
subscription_cancelled

plan_limit_reached
storage_80_percent
storage_90_percent
storage_limit_reached
```

---

# 179. SEO Attribution

Signup保存：

```text
landing_page
referrer
utm_source
utm_medium
utm_campaign
first_touch
last_touch
```

---

# 180. Activation

定义：

```text
First Tool
+
First QR
+
First Scan
```

---

# 181. Security

Mutation：

必须检查：

* Auth
* Membership
* Role
* Company
* Ownership
* Plan
* Input

使用：

# Zod

---

# 182. Security Headers

配置：

* CSP
* HSTS
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* frame protection

---

# 183. Audit Logs

至少记录：

* Invitations
* User removal
* Role changes
* Worker deactivate
* PIN reset
* Session revoke
* Bulk operation
* Correction
* QR rotation
* Billing changes
* Privacy requests

---

# 184. Secrets

以下不得进入客户端：

```text
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
TURNSTILE_SECRET_KEY
WORKER_PIN_PEPPER
RESEND_API_KEY
```

---

# 185. Env

创建：

```text
.env.example
.dev.vars.example
```

至少：

```text
NEXT_PUBLIC_SITE_URL

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

STRIPE_PRICE_STARTER_MONTHLY
STRIPE_PRICE_STARTER_ANNUAL
STRIPE_PRICE_GROWTH_MONTHLY
STRIPE_PRICE_GROWTH_ANNUAL
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_ANNUAL

RESEND_API_KEY

TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY

WORKER_PIN_PEPPER

POSTHOG_KEY
GA_MEASUREMENT_ID

PRIVACY_CONTACT_EMAIL
SUPPORT_EMAIL
```

---

# 186. Migrations

全部数据库变化：

```text
supabase/migrations/
```

禁止仅Dashboard手工修改。

---

# 187. Tests

Unit：

Vitest。

E2E：

Playwright。

Load：

k6。

---

# 188. Tenant Tests

Company A：

不能访问Company B：

* DB
* API
* Files
* QR mutations

---

# 189. Shared Device Tests

```text
Worker A login
→ TAKE
→ Switch
→ Worker B
→ MOVE
```

MOVE：

必须归属于B。

---

# 190. Session Tests

覆盖：

* Idle timeout
* Absolute timeout
* Deactivate
* Reset PIN
* Revoke Session

---

# 191. QR Tests

测试：

* Anonymous cannot mutate
* Cross-company denied
* Old rotated token denied
* Copied QR without auth denied

---

# 192. Concurrency Tests

覆盖：

* Double checkout
* Simultaneous TAKE
* Simultaneous MOVE
* Race correction

---

# 193. Import Tests

Pro：

一次上传：

# 2,000 rows

自动Batch。

---

# 194. Import Reliability

测试：

* Retry
* Duplicate Queue delivery
* Idempotency
* Partial failure
* DLQ
* Progress recovery

---

# 195. Pricing Tests

必须覆盖：

```text
Free
→ Starter Monthly
→ Starter Annual
→ Growth
→ Pro
→ Downgrade
→ Cancel
```

---

# 196. Pricing Limit Tests

必须覆盖：

Tool：

```text
199
200
201
```

Starter。

Growth：

```text
599
600
601
```

Pro：

```text
1999
2000
2001
```

---

# 197. Downgrade Tests

测试：

```text
Growth
430 tools
↓
Starter
```

验证：

Existing 430：

不删除。

TAKE/MOVE/RETURN：

继续。

New Tool：

拒绝。

---

# 198. Storage Tests

测试：

* 79%
* 80%
* 89%
* 90%
* 99%
* 100%
* > 100%

100%：

New Upload denied。

TAKE/MOVE/RETURN：

继续。

---

# 199. Admin Downgrade Test

5 Admin Growth：

降Starter 2 Admin。

不能随机删除账号。

不能添加新Admin。

---

# 200. Stripe Tests

必须：

* Valid webhook
* Invalid signature
* Duplicate webhook
* Upgrade
* Downgrade
* Annual
* Monthly
* Cancellation
* Failed Payment

---

# 201. Load Tests

测试：

* Public SEO pages
* Dashboard
* Global Search
* QR actions
* Concurrent transactions
* Import queues
* Uploads

---

# 202. Metrics

记录：

* request count
* success rate
* error rate
* p50
* p95
* p99
* Worker errors
* Queue backlog
* DB errors

---

# 203. Observability

Import：

```text
imports_started
imports_completed
imports_failed
import_rows_processed
queue_retry
queue_dlq
```

Storage：

```text
r2_upload
r2_bytes_uploaded
r2_delete
storage_quota_rejected
```

Privacy：

```text
privacy_export_requested
privacy_export_completed
privacy_delete_requested
privacy_delete_completed
```

Billing：

```text
plan_upgrade
plan_downgrade
billing_past_due
billing_recovered
billing_cancelled
account_over_limit
```

---

# 204. Cloudflare Config

创建：

```text
wrangler.jsonc
```

包含：

* compatibility_date
* R2
* Queues
* Cron
* Env
* Assets
* Production route

---

# 205. Runtime Verification

不能：

```text
next dev works
```

就宣布完成。

必须：

OpenNext + Cloudflare runtime preview。

---

# 206. CI

Production前：

```text
lint
typecheck
unit
integration
critical e2e
seo:audit
build
OpenNext build
```

全部通过。

---

# 207. Deployment

```text
main
→ CI
→ Cloudflare Workers
```

安全测试失败：

不部署。

---

# 208. README

必须写：

* Product
* Architecture
* Setup
* Next.js
* OpenNext
* Cloudflare
* Supabase
* RLS
* R2
* Queues
* Cron
* Turnstile
* Worker PIN
* Shared Device
* QR Security
* Import
* Pricing
* Stripe Monthly/Annual
* Plan limits
* Storage limits
* Privacy
* SEO
* Tests
* Load Tests
* Deployment
* Domain
* GSC
* Troubleshooting

---

# 209. AGENTS.md

根目录：

```text
AGENTS.md
```

Coding Agent修改前必须读：

```text
AGENTS.md
docs/PROJECT_SPEC.md
docs/DECISIONS.md
TASKS.md
```

本文件保存为：

```text
docs/PROJECT_SPEC.md
```

---

# 210. DECISIONS.md

创建：

```text
docs/DECISIONS.md
```

例如：

```text
Decision:
Use OpenNext instead of vinext.

Status:
LOCKED
```

---

# 211. TASKS.md

每次开发更新：

* Completed
* Tests run
* Current task
* Remaining
* Blockers
* Next exact task

---

# 212. Feature Completion Definition

只有同时具备：

```text
Persistence
+
Server Logic
+
Authorization
+
UI
+
Validation
+
Error Handling
+
Tests
```

才能：

# COMPLETED

---

# 213. 禁止假完成

例如：

Pricing Buttons：

≠ Billing。

QR图片：

≠ QR Workflow。

Maintenance DB：

≠ Maintenance Product。

company_id：

≠ RLS。

File upload input：

≠ R2 Storage System。

---

# 214. 最终核心验收

必须真实完成：

```text
Signup
↓
Create Company
↓
Add Worker
↓
Add Location
↓
Add Tool
↓
Generate QR
↓
Worker Login
↓
Scan
↓
TAKE
↓
MOVE
↓
RETURN
↓
Damage
↓
Maintenance
↓
Correction
↓
History
```

---

# 215. Billing最终验收

必须：

```text
Free
↓
Starter Monthly
↓
Starter Annual
↓
Growth
↓
Pro
↓
Downgrade
↓
Over-Limit
↓
Cancel
```

全部可验证。

---

# 216. SEO最终验收报告

每页输出：

```text
URL
Page Type
Keyword Cluster

Primary Keyword
Volume
KD
CPC

Metric Scope
Metric Source
Metric Checked At
Needs US Verification

Secondary Keywords
Competitor Evidence

Intent
Intent Fit
Priority

Title
Meta Description
H1

Canonical
Index Status
Index Gate

datePublished
dateModified
lastReviewed

Internal Links In
Internal Links Out

Cannibalization Check
Schema
Screenshot / Product Evidence
```

另外输出：

```text
Backlink Targets
Backlink Priority
Competitor Backlink Evidence
Outreach Status
```

---

# 217. Lighthouse

关键Public Page目标：

```text
Mobile Performance >= 90 where realistically achievable
SEO >= 95
Accessibility >= 95
```

不要为了100牺牲UX。

---

# 218. Production Blocking Conditions

以下任何一项存在：

禁止称：

# PRODUCTION READY

包括：

* Cross tenant data access
* RLS missing
* Anonymous QR mutation
* QR token acts as authentication
* Inactive worker session still valid
* Weak PIN storage
* No PIN rate limiting
* Giant synchronous import
* Import no idempotency
* Unlimited R2
* Storage quota client-only
* Downgrade deletes data
* Over-limit blocks core tracking
* No Privacy Export/Delete
* No Help Center
* No load testing
* Unverified Stripe webhook
* Monthly/annual price controlled by client
* Secret exposed
* Fake dateModified
* Unreviewed competitor pages indexed

---

# 219. Final Delivery Report

完成时必须给出：

1. Directory Tree
2. Feature List
3. Database Tables
4. Migration Status
5. RLS Status
6. Tenant Tests
7. Session Model
8. PIN Security
9. QR Security
10. Tool Workflow
11. Import/Queue
12. R2 Storage
13. Pricing
14. Annual Billing
15. Upgrade/Downgrade
16. Over-Limit Behaviour
17. Stripe
18. Email
19. Privacy
20. Help Center
21. Public SEO Pages
22. Keyword Map
23. Industry SEO Map
24. Guide / Best / Template Roadmap
25. Backlink Target Map
26. Metadata
27. Sitemap
28. Robots
29. Canonical
30. Analytics
31. Unit Tests
32. E2E Tests
33. Load Tests
34. Lighthouse
35. Cloudflare Config
36. Deploy Commands
37. Domain Setup
38. Google Search Console Steps
39. External Blockers
40. NOT COMPLETED Items

---

# 220. Honest Status Rule

没做完：

# NOT COMPLETED

缺外部凭证：

# BLOCKED_BY_EXTERNAL_CREDENTIALS

禁止用：

```text
ready
supported
easy to add
can be implemented
```

冒充完成。

---

# 221. 最终Pricing锁定

除非真实市场数据证明需要调整：

当前默认产品套餐正式锁定：

```text
FREE
$0
25 Tools
1 Admin
Unlimited Field Workers
100 MB

STARTER
$19/month
$190/year
200 Tools
2 Admins
Unlimited Field Workers
2 GB

GROWTH
$39/month
$390/year
600 Tools
5 Admins
Unlimited Field Workers
10 GB

PRO
$79/month
$790/year
2,000 Tools
10 Admins
Unlimited Field Workers
25 GB
```

核心商业差异：

# Unlimited Field Workers

年付：

# Pay for 10 months, get 12.

---

# 222. 最终产品原则

所有产品设计回到：

# TAKE

# MOVE

# RETURN

用户必须随时知道：

```text
What tool?
Who has it?
Where is it?
What happened?
```

如果一个功能让这件事更复杂：

重新设计。

如果Field Worker需要培训才能完成正常扫码：

重新设计。

如果产品开始变成ERP：

停止扩张。

如果SEO页面与真实产品不匹配：

不要发布。

---

# 223. 开始执行

先读取：

```text
AGENTS.md
docs/PROJECT_SPEC.md
docs/DECISIONS.md
TASKS.md
```

然后检查现有代码。

之后：

```text
Build
→ Test
→ Verify
→ Fix
→ Update TASKS.md
→ Continue
```

直到所有最终验收条件通过。

最终目标不是：

“代码生成完成”。

最终目标是：

# 一个真正可以部署、注册、扫码、追踪工具、付费、被Google索引，并长期运营的 TakeMoveReturn SaaS。
