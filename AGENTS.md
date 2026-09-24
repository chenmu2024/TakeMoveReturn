
# TakeMoveReturn

> Current source of truth: `docs/PROJECT_SPEC.md` is the user's SEO V2 final specification. If the historical instructions below conflict with it, follow `docs/PROJECT_SPEC.md`. Before changing code, also read `docs/DECISIONS.md` and `TASKS.md`.

# AI 编程完整开发总指令

## 最终锁定版

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

---

# 11. Keyword Single Source of Truth

建立：

```text
src/data/seo-keywords.ts
```

字段：

```ts
keyword
volume
kd
cpc
intent
intentFit
priority
targetUrl
notes
```

intentFit：

```text
strong
mixed
weak
excluded
```

禁止AI自行编造：

Volume / KD / CPC。

---

# 12. 核心关键词数据

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

---

# 13. Supporting Keywords

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

# 14. Maintenance Keywords

| Keyword                                     | Volume | KD |    CPC |
| ------------------------------------------- | -----: | -: | -----: |
| construction equipment maintenance software |    590 | 19 | $43.30 |
| equipment maintenance tracking software     |    590 | 28 | $55.19 |
| asset maintenance software                  |    590 | 28 | $21.56 |
| work order tracking software                |    390 | 26 | $34.53 |
| heavy equipment management software         |    390 | 15 | $45.27 |
| heavy equipment fleet management software   |    320 | 16 | $36.88 |

不要因为后两个词增加：

GPS / Telematics。

---

# 15. 信息关键词

Primary：

```text
how to manage construction site inventory
```

数据：

```text
Volume 1,600
KD 23
CPC $0
```

页面：

```text
/blog/how-to-manage-construction-site-inventory
```

---

# 16. Mixed Intent Keywords

以下词存在明显Hardware/GPS混合意图：

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

除非未来重新SERP验证。

---

# 17. 不作为初期主攻词

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

# 18. Generic Inventory词处理

以下关键词不做核心Money Page：

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

原因：

库存/SKU/warehouse/ecommerce intent太强。

---

# 19. 首页 Keyword Map

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
```

```text
tool tracking
1000 / KD20 / $10.77
```

---

# 20. Equipment Management Page

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
```

```text
equipment management system
320 / KD11 / $35.88
```

---

# 21. Equipment Tracking Page

```text
/construction-equipment-tracking-software
```

Primary：

```text
construction equipment tracking software
590 / KD15 / $15.72
```

Mixed-intent词：

只能辅助自然使用。

---

# 22. Tool Management Page

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
```

```text
tool management system
480 / KD11 / $12.16
```

---

# 23. Tool Inventory Page

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
```

```text
tool inventory
320 / KD27 / $13.52
```

```text
tool inventory management
320 / KD27 / $20.69
```

```text
tool inventory tracking system
320 / KD22 / $16.29
```

---

# 24. Construction Asset Tracking

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

---

# 25. Maintenance SEO Page

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
```

```text
asset maintenance software
590 / KD28 / $21.56
```

---

# 26. Asset Tagging Page

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
```

```text
asset tag system
320 / KD29 / $42.75
```

---

# 27. Equipment Checkout

```text
/equipment-checkout
```

Primary：

```text
asset check out
260 / KD10 / $18.68
```

禁止编造其他关键词数据。

---

# 28. SEO页面质量

所有Money Page必须包含：

* Direct Answer
* Product UI
* User Pain
* Construction Scenario
* Workflow
* Relevant Features
* Spreadsheet/manual comparison
* FAQ
* CTA
* Internal links

不要：

写大量SEO文字才介绍产品。

---

# 29. 首页Hero

SEO Title初始方向：

> Construction Tool Tracking Software | TakeMoveReturn

H1：

# Know Who Has Every Tool — In Seconds.

Subheading：

> Simple QR-based tool tracking software for construction crews. Track tools across workers, trucks, warehouses and job sites without spreadsheets, expensive hardware or complicated enterprise software.

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

研究：

* ProToolTrack
* ShareMyToolbox
* GoCodes
* MapTrack
* Sortly
* ToolWatch / AlignOps

只能借鉴：

思路。

不能复制：

* 文案
* UI
* Logo
* Screenshots
* Proprietary assets

---

# 152. Competitor Learning

ProToolTrack：

定位、自助、简单。

ShareMyToolbox：

Field workflow。

GoCodes：

信任和内容。

MapTrack：

SEO架构。

Sortly：

产品展示。

ToolWatch：

必要成熟功能。

---

# 153. Alternative Pages

未来：

```text
/alternatives/sharemytoolbox
/alternatives/gocodes
/alternatives/sortly
/alternatives/toolwatch
```

不是立即全部index。

---

# 154. Competitor Evidence

```text
src/data/competitors.ts
```

每项：

```text
value
sourceUrl
checkedAt
```

---

# 155. Trademark

只使用竞品名称做合理识别。

禁止：

* Imply affiliation
* Imply endorsement
* Copy logos
* Copy visual identity

---

# 156. Competitor Index Gate

没有法律审核：

```text
noindex
```

或：

不发布。

---

# 157. Content

使用：

# MDX

不要外接重CMS。

---

# 158. SEO Frontmatter

```text
slug
title
description
h1

primaryKeyword
secondaryKeywords

volume
kd
cpc

intent
intentFit

datePublished
dateModified
lastReviewed
reviewCadenceDays

canonical
```

---

# 159. dateModified

只有：

重大内容实际变化

才更新。

禁止每次build自动刷新。

---

# 160. Review Cadence

Alternatives：

30 days。

Best：

30–60。

Money Pages：

90。

Guides：

180。

---

# 161. SEO Audit

```text
npm run seo:audit
```

检测：

* stale content
* duplicate primary keyword
* duplicate canonical
* missing keyword data
* cannibalization risk

---

# 162. Scheduled Audit

GitHub Actions：

每月执行。

输出：

Issue / Report。

不自动修改日期。

---

# 163. Public Pages

必须完成：

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

---

# 164. Future SEO

预留：

```text
/industries/
/alternatives/
/best/
/guides/
```

禁止批量薄内容。

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
Primary Keyword
Volume
KD
CPC
Secondary Keywords
Intent
Intent Fit
Title
Meta Description
H1
Canonical
Index Status
datePublished
dateModified
lastReviewed
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
23. Metadata
24. Sitemap
25. Robots
26. Canonical
27. Analytics
28. Unit Tests
29. E2E Tests
30. Load Tests
31. Lighthouse
32. Cloudflare Config
33. Deploy Commands
34. Domain Setup
35. Google Search Console Steps
36. External Blockers
37. NOT COMPLETED Items

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
