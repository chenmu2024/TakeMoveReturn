
# Construction Tool Tracking SaaS

# AI 编程完整开发总指令

## Cloudflare Workers + OpenNext + Supabase + Google SEO 最终整合版

---

# 0. 指令优先级

本文件是本项目唯一有效的总开发规范。

此前任何旧版 PRD、vinext 版本、补丁版本、1000 行 Import 限制、4 位 PIN、无限存储等要求全部失效。

如果旧代码与本规范冲突：

**以本规范为准。**

本项目只有一个最终产品范围。

不采用：

* MVP
* V1.5
* V2
* “以后再补”
* 假按钮
* 占位实现

但是工程实施允许你自主拆成合理步骤：

1. 项目基础
2. 数据库
3. RLS
4. Auth
5. 核心业务
6. QR
7. Import
8. Maintenance
9. Billing
10. SEO
11. Support
12. Privacy
13. Tests
14. Cloudflare Deployment

不要因为任务很大而缩减最终范围。

不要频繁询问用户“是否继续”。

只有真正需要用户提供：

* 域名
* Supabase账户
* Stripe Key
* Cloudflare账户
* Resend Key
* 法律主体信息

等外部资料时，才能把该项明确标记为：

`BLOCKED_BY_EXTERNAL_CREDENTIALS`

其余工作继续完成。

---

# 1. 产品名称

临时项目名：

**Construction Tool Tracking SaaS**

正式品牌名称必须集中配置，不允许硬编码。

创建：

```text
src/config/site.ts
```

包含：

```text
name
domain
siteUrl
supportEmail
privacyEmail
companyLegalName
```

以后品牌确定时修改一次即可。

---

# 2. 产品定位

面向：

**5–50 人的小型施工公司与施工团队。**

主要客户：

* General Contractors
* Electrical Contractors
* Plumbing Contractors
* HVAC Contractors
* Roofing Contractors
* Remodeling Companies
* Small Construction Crews

---

# 3. 产品只解决什么

核心问题：

* Who has this tool?
* Where is it?
* Which job site is it at?
* Which truck is it on?
* When did it move?
* Has it been returned?
* Is it damaged?
* Is maintenance due?

核心闭环：

```text
Tool
→ QR
→ Take
→ Move
→ Return
→ Damage / Maintenance
→ Complete History
```

---

# 4. 产品绝对不能变成什么

禁止把产品扩张成：

* ERP
* CRM
* Payroll
* Accounting
* Full CMMS
* Construction Project Management
* Fleet Telematics
* GPS Fleet Platform
* Procurement Suite
* Workforce Management
* IT Asset Management
* Generic Inventory ERP

任何新功能必须回答：

> Does this help a small construction crew know where its tools are?

如果答案是否：

不要做。

---

# 5. 产品核心价值

长期坚持：

## Fast to adopt

Spreadsheet → SaaS in minutes.

## Fast in the field

Scan → Take / Move / Return.

## Simple pricing

Unlimited field workers.

## Reliable history

Every movement recorded.

## Easy correction

Mistakes can be corrected without destroying audit history.

## No expensive hardware required

核心功能只依赖：

QR + Phone Browser。

---

# 6. 主要竞争对手

必须研究但不得复制：

* ProToolTrack
* ShareMyToolbox
* GoCodes
* MapTrack
* Sortly
* ToolWatch / AlignOps

---

# 7. 从竞争对手学习什么

## ProToolTrack

学习：

* 小施工队定位
* 简单Hero
* QR工作流
* CSV导入
* 自助注册
* 清晰定价

不要学习：

* GPS扩张
* Bluetooth扩张
* Hardware-heavy方向

---

## ShareMyToolbox

学习：

```text
Tool
Worker
Location
Transaction
```

施工场景：

* Warehouse
* Worker
* Truck
* Job Site
* Take
* Transfer
* Return

不要学习：

按普通 Field Worker 收费。

我们的核心差异：

# Unlimited Field Workers

---

## GoCodes

学习：

* 信任元素
* Case Studies
* 产品截图
* Construction SEO
* Pricing表达
* 深度比较内容

不要变成重型 Asset Management。

---

## MapTrack

重点学习 SEO 信息架构：

```text
Solutions
Industries
Use Cases
Guides
Best Software
Alternatives
Comparisons
Blog
```

---

## Sortly

学习：

* UI展示
* 产品截图
* 简明Hero
* 转化结构

不要变成 Generic Inventory SaaS。

---

## ToolWatch / AlignOps

学习成熟的：

* Tool history
* Warehouse
* Service
* Maintenance

但不要复制它的企业级复杂度。

---

# 8. 最终竞争定位

产品应体现：

* 比 ShareMyToolbox 更低门槛
* 比 ProToolTrack 更完整专业
* 比 GoCodes 更轻
* 比 MapTrack 更专注小施工团队
* 比 Sortly 更懂 Construction
* 比 ToolWatch 更简单

不得：

攻击竞品。

不得：

写未经证实的负面评价。

---

# 9. 技术栈最终锁定

## Framework

Next.js 16 App Router

TypeScript strict mode

React

Tailwind CSS

shadcn/ui

---

## Cloudflare

生产环境：

# Cloudflare Workers

使用：

# OpenNext Cloudflare Adapter

即：

```text
@opennextjs/cloudflare
```

不要使用：

* Vercel
* Netlify
* VPS
* Cloudflare Pages Static Export
* vinext

本项目采用标准 Next.js：

```text
next build
→ OpenNext
→ Cloudflare Workers
```

---

# 10. Cloudflare资源

使用：

## Workers

* Next.js
* SSR
* Route Handlers
* Server Actions
* Stripe webhook
* Auth server logic

## R2

* Tool photos
* Damage photos
* Maintenance attachments

## Queues

* Bulk Import
* Background batch jobs

## Cron Triggers

* Overdue digest
* Maintenance digest
* Cleanup jobs

## Turnstile

* Signup protection
* Suspicious login
* Password reset abuse
* Public support form abuse

## Cloudflare DNS

正式域名全部通过 Cloudflare 管理。

---

# 11. 生产套餐假设

生产环境按照：

# Cloudflare Workers Paid

设计。

不要依赖 Workers Free 的极低 CPU 配额作为生产目标。

---

# 12. 数据库

使用：

# Supabase PostgreSQL

认证：

# Supabase Auth

授权：

# PostgreSQL Row Level Security

不要换成：

Firebase / D1。

---

# 13. 数据边界

Supabase：

* PostgreSQL
* Auth
* RLS
* Relational data

Cloudflare R2：

* 文件
* 图片
* 附件

禁止同一类上传文件同时散落在：

Supabase Storage + R2。

---

# 14. 项目架构

采用：

# Modular Monolith

一个 GitHub Repository。

不要：

* 微服务
* 两个Marketing仓库
* WordPress
* 独立CMS服务

---

# 15. 推荐目录

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
├── e2e/
└── load/
```

---

# 16. 核心数据库表

至少建立：

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

# 17. 多租户

所有业务数据必须具有：

```text
company_id UUID NOT NULL
```

Company A：

永远不能读取 Company B 数据。

---

# 18. RLS

所有业务表：

必须开启：

# Row Level Security

必须真正实现：

* SELECT policy
* INSERT policy
* UPDATE policy
* DELETE policy

不能把：

```sql
WHERE company_id = ?
```

当成唯一安全措施。

---

# 19. company_id安全

任何 Mutation：

不能相信客户端传入的：

`company_id`

必须根据当前用户的：

`organization_members`

解析所属公司。

---

# 20. companies

至少：

```text
id
name
slug
plan
timezone
country
created_at
updated_at
```

---

# 21. organization_members

```text
id
company_id
user_id
role
status
created_at
updated_at
```

角色：

```text
owner
admin
manager
```

---

# 22. Field Worker模型

Field Worker 不要求：

* Email
* 标准密码
* Native App

使用：

Workspace + Worker身份 + 6位 PIN。

---

# 23. workers

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

status：

```text
active
inactive
```

---

# 24. PIN规范

统一：

# 6位数字 PIN

禁止4位。

禁止：

* bcrypt
* bcryptjs
* MD5
* SHA256(PIN)
* 明文PIN
* 可逆加密

---

# 25. PIN哈希

必须使用：

# Web Crypto API

方案：

PBKDF2-HMAC-SHA256

基础参数：

```text
600,000 iterations
16+ byte random unique salt
```

实现后必须在真实 Cloudflare Workers runtime benchmark。

---

# 26. PIN Pepper

增加：

服务器端 Pepper。

保存：

```text
WORKER_PIN_PEPPER
```

Cloudflare Secret。

不得：

写入数据库。

不得：

NEXT_PUBLIC。

流程：

```text
PIN
→ HMAC with pepper
→ PBKDF2 with unique salt
→ hash
```

---

# 27. PIN攻击防护

必须有：

* Rate limiting
* Failed attempt tracking
* Cooldown
* Turnstile escalation
* Security audit log

组合维度：

```text
company
worker
IP
```

绝不记录实际 PIN。

---

# 28. 共享设备模型

必须假设：

多个施工人员会共用：

* 手机
* 平板
* Warehouse terminal

因此：

Device Session 和 Worker Session 分离。

---

# 29. field_device_sessions

```text
id
company_id
device_token_hash
created_at
last_seen_at
expires_at
revoked_at
```

Device Session：

默认可保持约30天。

它仅表示：

> 设备已进入这个Workspace。

它本身：

**没有Tool Mutation权限。**

---

# 30. worker_sessions

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

# 31. Worker Session期限

默认：

## Idle timeout

15分钟。

管理员可配置：

5–60分钟。

## Absolute lifetime

8小时。

超过后必须重新输入PIN。

---

# 32. 快速切换工人

现场UI必须始终显示：

```text
Signed in as:
John Martinez
```

并提供：

# Switch Worker

点击：

立即结束当前 Worker Session。

保留 Device Workspace Session。

下一名员工：

选择身份

→ PIN

→ 开始工作。

---

# 33. Lock

现场提供：

# Lock

功能。

Lock：

只清除 Worker Session。

不清除 Device Workspace。

---

# 34. 离职员工撤权

当管理员：

Worker → Inactive

必须同时：

```text
status = inactive
auth_version += 1
revoke all worker sessions
```

旧设备上的 Session：

下一次写操作立即失效。

---

# 35. Reset PIN

修改 PIN：

必须：

```text
auth_version += 1
```

并撤销全部旧 Session。

---

# 36. Revoke Sessions

管理员 Worker Detail：

必须支持：

# Revoke All Sessions

适用于：

* 手机丢失
* PIN泄露
* 忘记退出

---

# 37. Locations

支持：

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

# 38. Tools

至少：

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

# 39. Tool Status

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

# 40. Tool Transactions

所有状态变化必须记录。

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

# 41. 不允许删除Transaction

正常业务状态下：

禁止物理删除 Tool Transaction。

错误操作使用：

```text
correction
```

产生逆向记录。

---

# 42. 并发控制

必须防止：

两个员工同时扫描并 TAKE 同一个 Tool。

所有状态变化采用：

数据库 Transaction / optimistic concurrency / row locking 等安全机制。

必须测试：

* double checkout
* lost update
* simultaneous transfer

---

# 43. QR安全原则

# QR只是Tool Identifier。

QR绝不是：

Authorization Credential。

有人拍照复制 QR：

不能因此获得写权限。

---

# 44. QR Token

使用：

至少128-bit随机不可预测 token。

例如：

```text
/q/{secure-random-token}
```

禁止：

```text
/q/123
```

---

# 45. 匿名扫描

匿名扫描 QR：

最多显示：

```text
Company
Asset Code
Tool Name
```

不得显示：

* Current worker personal data
* Phone
* Internal jobsite detail
* Purchase price
* Notes
* History

---

# 46. QR写操作

任何：

* TAKE
* MOVE
* RETURN
* DAMAGE
* MISSING

必须拥有：

有效 Worker Session

或者：

有效 Admin/Manager Auth Session。

并必须验证：

```text
session.company_id === tool.company_id
```

否则：

403。

---

# 47. QR Rotation

管理员可以：

# Rotate QR Code

旧 token：

立即失效。

用于：

QR泄露、标签遗失等场景。

---

# 48. 核心现场流程

目标：

```text
Scan
→ Action
→ Complete
```

约5秒。

按钮：

# TAKE

# MOVE

# RETURN

辅助：

Report Damage

Report Missing

---

# 49. Dashboard

显示：

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
* Overdue Tools

不要做重型BI。

---

# 50. Global Search

必须搜索：

* Tool Name
* Asset Code
* Brand
* Model
* Serial
* Worker
* Job Site
* Truck
* Notes

建立必要：

GIN / trigram / text indexes。

---

# 51. Tool Detail

包含：

* Photo
* QR
* Asset ID
* Brand
* Model
* Serial
* Holder
* Location
* Condition
* Purchase info
* Damage
* Maintenance
* Notes
* Complete History

---

# 52. Worker Detail

显示：

* Current tools
* Tool count
* Recent activity

操作：

* Return All
* Transfer Selected
* Revoke Sessions
* Reset PIN
* Deactivate

---

# 53. Location Detail

显示：

* Current tools
* Workers
* Damaged
* Overdue

---

# 54. Damage Report

字段：

```text
id
company_id
tool_id
reported_by_worker_id
reported_by_user_id
severity
description
photo_key
status
created_at
resolved_at
```

severity：

```text
minor
needs_repair
unusable
lost
```

每个 Damage Report：

最多3张图。

---

# 55. Maintenance

必须完成：

* Last Service
* Next Service
* Interval
* Reminder
* Service History
* Cost
* Notes
* Attachments

---

# 56. Maintenance Work Orders

只做轻量：

```text
open
in_progress
completed
cancelled
```

不要发展成完整CMMS。

---

# 57. Import最终架构

支持：

CSV

XLSX

---

# 58. Import上限

文件：

最大：

10 MB。

Source file hard limit：

5,000 rows。

不是套餐限制。

---

# 59. 套餐Tool容量

真正可新增数量：

```text
plan tool limit
-
current active tools
```

例如：

Pro：

2000 Tools。

已有400：

本次最多新增1600。

---

# 60. Import无需用户拆文件

如果客户上传：

2000行

不要要求：

拆成2个1000行文件。

系统内部自动 Batch。

---

# 61. Browser Import Processing

浏览器优先负责：

* XLSX parsing
* Sheet selection
* Header detection
* Field mapping
* Preview

服务器仍必须：

重新验证所有最终数据。

---

# 62. Import Job

建立：

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

# 63. Import Queue

正式导入使用：

# Cloudflare Queues

HTTP Request：

```text
Create Import Job
→ enqueue batches
→ return job id
```

Queue Consumer：

```text
100 rows
→ validate
→ insert
→ update progress
```

初始 Batch：

100 rows。

以后允许根据负载测试调整。

---

# 64. Import幂等性

每个Batch：

必须有：

```text
import_job_id
batch_number
idempotency_key
```

避免Queue retry导致重复创建工具。

---

# 65. Import结果

UI显示：

```text
Processed 1,300 / 2,000
```

完成后：

```text
Imported: 1,947
Skipped: 12
Needs review: 41
```

允许下载错误行。

---

# 66. Import Source File

如上传临时原始文件到R2：

默认24小时后自动清理。

不得永久保存客户Excel。

---

# 67. Export

支持：

```text
tools.csv
workers.csv
locations.csv
transactions.csv
maintenance.csv
damage-reports.csv
```

这是：

业务数据Export。

它不等于：

Privacy Data Export。

---

# 68. R2 Storage Quotas

套餐：

| Plan    | Storage |
| ------- | ------: |
| Free    |  100 MB |
| Starter |    2 GB |
| Growth  |   10 GB |
| Pro     |   25 GB |

集中配置于：

```text
src/config/plans.ts
```

---

# 69. Tool Photo

每件Tool：

1张当前Primary Image。

更换图片时：

旧文件进入清理流程。

---

# 70. Damage附件

每个Damage Report：

最多3张图片。

---

# 71. Maintenance附件

每个Maintenance Event：

最多3个附件。

---

# 72. 文件大小

Image：

最大5MB原始文件。

浏览器端：

尽量压缩至 ≤1.5MB。

Maintenance attachment：

最大10MB。

允许类型：

* JPEG
* PNG
* WebP
* PDF

服务器验证 MIME。

---

# 73. R2 Streaming

不要将整个文件：

一次读入 Worker Memory。

使用：

Streaming Upload。

---

# 74. stored_files

必须记录：

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

# 75. Storage Quota Server Enforcement

上传前服务端判断：

```text
current_usage + file_size <= plan_limit
```

超过：

拒绝。

不能只靠前端。

---

# 76. Orphan Cleanup

Cloudflare Cron：

定期清理：

数据库已经无引用的 R2 文件。

---

# 77. Pricing

## Free

$0

25 Tools

1 Admin

Unlimited Field Workers

100MB storage

---

## Starter

$19/month

150 Tools

2 Admins

Unlimited Field Workers

2GB storage

---

## Growth

$39/month

500 Tools

5 Admins

Unlimited Field Workers

10GB storage

---

## Pro

$79/month

2,000 Tools

10 Admins

Unlimited Field Workers

25GB storage

---

# 78. Stripe

使用：

* Checkout
* Billing
* Customer Portal
* Webhooks

支持：

* Upgrade
* Downgrade
* Cancel
* Failed Payment
* Retry

服务器以：

Stripe Webhook

作为最终订阅事实来源。

---

# 79. Plan限制

必须服务器验证：

* Tool count
* Admin count
* Storage

不能只隐藏UI按钮。

---

# 80. Email

使用：

# Resend

邮件：

* Welcome
* Verification
* Reset password
* Admin invite
* Damage
* Overdue digest
* Maintenance digest
* Payment issue
* Subscription
* Cancellation

---

# 81. Privacy / GDPR / CCPA产品能力

不得声称：

“完全GDPR合规”

“CCPA certified”

除非经过真实法律审核。

代码层面必须支持必要的数据权利流程。

---

# 82. Privacy Page

创建：

```text
/app/settings/privacy
```

功能：

* Request My Data
* Delete My Account
* Privacy Requests

---

# 83. privacy_requests

字段：

```text
id
company_id
requester_user_id
request_type
status
requested_at
verified_at
completed_at
notes
```

request_type：

```text
access
export
rectification
deletion
restriction
```

---

# 84. Personal Data Export

单独提供：

# Personal Data Export

至少包含：

* profile
* email
* account metadata
* memberships
* consent/privacy records
* relevant audit events
* support requests

格式：

JSON / ZIP。

---

# 85. Account Deletion

必须提供：

# Delete My Account

流程：

```text
Re-authenticate
→ explain consequences
→ explicit confirmation
→ deletion workflow
```

---

# 86. Workspace Deletion

Owner可以：

# Delete Workspace

必须：

* Re-authenticate
* Explicit confirmation
* Cancel subscription
* Show data impact
* Start controlled deletion

---

# 87. Soft Delete与Privacy Delete

明确区分：

## Product Delete

Tool删除：

实际上Retire / Soft Delete。

用于：

Audit。

## Privacy Delete

属于独立法律流程。

正常的：

“历史不可修改”

不能阻止合法隐私删除请求。

---

# 88. 隐私删除后的历史

如果业务历史仍有合理保留需求：

优先：

Pseudonymize。

例如：

```text
John Smith
```

变成：

```text
Deleted User
```

删除：

* email
* phone
* unnecessary identifiers
* login credentials

不要默认永久保留所有个人身份信息。

---

# 89. Retention

建立：

```text
src/config/retention.ts
```

明确：

* Application logs
* Security logs
* Import temp files
* Support tickets
* Deleted accounts
* Audit logs
* Billing records
* R2 files

不得无限期保存一切。

---

# 90. Legal Pages

建立：

```text
/privacy
/terms
/dpa
/subprocessors
```

开发可提供模板。

必须明显注明：

# LEGAL REVIEW REQUIRED BEFORE PRODUCTION

---

# 91. Help Center

必须建立：

# /help

因为产品定位是：

Self-service。

---

# 92. Help分类

至少：

## Getting Started

* Add first tool
* Import spreadsheet
* QR labels

## Tool Tracking

* Take
* Move
* Return
* History
* Missing

## Workers

* Worker PIN
* Switch Worker
* Lock device

## Locations

* Job sites
* Trucks
* Warehouses

## Damage

## Maintenance

## Import / Export

## Billing

## Account & Privacy

## Troubleshooting

---

# 93. Help技术

使用：

MDX。

目录：

```text
content/help/
```

支持：

* Search
* Categories
* Updated date
* Related articles
* Previous/Next

---

# 94. Contact Support

创建：

```text
/help/contact
```

提交：

* company id
* plan
* page
* browser
* timestamp

禁止提交：

* PIN
* password
* secret
* full auth token

---

# 95. Google SEO战略

Google SEO：

是主要长期获客渠道。

Public Marketing pages：

SSG / ISR优先。

Dashboard：

Dynamic。

禁止整个Marketing站做CSR SPA。

---

# 96. 关键词Single Source of Truth

建立：

```text
src/data/seo-keywords.ts
```

字段：

```text
keyword
volume
kd
cpc
intent
intentFit
priority
targetUrl
```

intentFit：

```text
strong
mixed
weak
excluded
```

---

# 97. 核心关键词

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

# 98. Maintenance关键词

| Keyword                                     | Volume | KD |    CPC |
| ------------------------------------------- | -----: | -: | -----: |
| construction equipment maintenance software |    590 | 19 | $43.30 |
| equipment maintenance tracking software     |    590 | 28 | $55.19 |
| asset maintenance software                  |    590 | 28 | $21.56 |
| work order tracking software                |    390 | 26 | $34.53 |

---

# 99. 信息关键词

```text
how to manage construction site inventory
```

Volume：

1,600

KD：

23

CPC：

$0

页面：

```text
/blog/how-to-manage-construction-site-inventory
```

---

# 100. Mixed Intent关键词

这些不能当强核心词：

## equipment tracker

480 / KD25 / $19.90

intentFit：

`mixed`

## equipment tracking

880 / KD23 / $20.68

intentFit：

`mixed`

## equipment tracking system

480 / KD29 / $37.51

intentFit：

`mixed`

原因：

可能包含：

* GPS
* Bluetooth
* Physical trackers

这些词只能自然出现在正文。

除非未来重新验证SERP。

---

# 101. 首页SEO

URL：

```text
/
```

Primary：

```text
construction tool tracking
390 / KD10 / $30.15
```

```text
construction tool tracking software
320 / KD11 / $21.23
```

Secondary：

```text
tool tracking software
1000 / KD23 / $20.95
```

---

# 102. Money Page

```text
/construction-equipment-management-software
```

Primary：

880 / KD14 / $23.87

Secondary：

equipment management software

1600 / KD18 / $35.64

equipment management system

320 / KD11 / $35.88

---

# 103. Money Page

```text
/construction-equipment-tracking-software
```

Primary：

590 / KD15 / $15.72

不要再把：

`equipment tracker`

当Primary/Strong Secondary。

---

# 104. Money Page

```text
/tool-management-software
```

Primary：

720 / KD11 / $15.44

Secondary：

```text
tool management
480 / KD14 / $6.24

tool management system
480 / KD11 / $12.16
```

---

# 105. Money Page

```text
/tool-inventory-software
```

Primary：

480 / KD11 / $26.71

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

---

# 106. Money Page

```text
/construction-asset-tracking-software
```

Primary：

390 / KD14 / $43.52

Secondary：

construction asset tracking

390 / KD21 / $36.26

---

# 107. Maintenance Page

```text
/construction-equipment-maintenance-software
```

Primary：

590 / KD19 / $43.30

Secondary：

```text
equipment maintenance tracking software
590 / KD28 / $55.19

asset maintenance software
590 / KD28 / $21.56
```

---

# 108. Asset Tagging

```text
/asset-tagging-system
```

Primary：

390 / KD14 / $42.75

Secondary：

```text
barcode asset tracking
320 / KD10 / $18.96

asset tag system
320 / KD29 / $42.75
```

---

# 109. Checkout

```text
/equipment-checkout
```

Primary：

```text
asset check out
260 / KD10 / $18.68
```

不要虚构其它关键词数据。

---

# 110. 首页最终结构

## Hero

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

# 111. 首页产品演示

第二屏立即展示真实UI：

```text
M18 Impact Driver

Currently:
John Martinez

Location:
Riverside Job Site

Since:
Sep 22, 8:41 AM

Condition:
Good
```

标题：

# Stop asking “Who has the tool?”

---

# 112. 首页3-Step

```text
1. Add
2. Label
3. Scan
```

Add：

Import spreadsheet.

Label：

Print QR.

Scan：

Take / Move / Return.

---

# 113. Field Worker屏

展示移动端：

```text
M18 Drill

TAKE
MOVE
RETURN

Report Damage
```

突出：

# No native app required.

---

# 114. Construction Flow屏

展示：

```text
Worker
Truck
Job Site
Warehouse
```

工具可在这些实体之间流转。

---

# 115. 核心差异屏

显示：

* 5-second scans
* Unlimited field workers
* No expensive hardware
* Import Excel in minutes

---

# 116. Damage / Maintenance屏

展示：

* Damage report
* Photo
* Maintenance due
* Repair history

---

# 117. Excel Migration屏

```text
Excel
→ Upload
→ Map fields
→ Generate QR
→ Start scanning
```

---

# 118. Pricing屏

| Plan    | Tools | Admins | Workers   | Storage | Price |
| ------- | ----: | -----: | --------- | ------: | ----: |
| Free    |    25 |      1 | Unlimited |   100MB |    $0 |
| Starter |   150 |      2 | Unlimited |     2GB |   $19 |
| Growth  |   500 |      5 | Unlimited |    10GB |   $39 |
| Pro     | 2,000 |     10 | Unlimited |    25GB |   $79 |

---

# 119. Competitor Comparison Pages

未来目录：

```text
/alternatives/sharemytoolbox
/alternatives/gocodes
/alternatives/sortly
/alternatives/toolwatch
```

但不是自动发布。

---

# 120. 商标与竞品规则

Competitor page：

只能用于真实产品比较。

禁止：

* 暗示合作
* 暗示授权
* 冒充竞品
* 使用模糊误导视觉

默认只使用：

纯文字竞品名。

不要默认复制：

* Logo
* Screenshots
* Proprietary images

---

# 121. 竞品数据

建立：

```text
src/data/competitors.ts
```

每项事实：

```text
sourceUrl
checkedAt
```

例如：

价格、用户限制、功能。

---

# 122. Alternative Page发布门槛

页面可以开发。

但正式：

```text
index,follow
```

之前：

必须：

# LEGAL REVIEW REQUIRED

未审核：

保持 noindex

或不发布。

---

# 123. 页面Disclaimer

Comparison Pages：

加入类似：

> All product names and trademarks belong to their respective owners. This website is not affiliated with or endorsed by those companies unless explicitly stated.

最终文本：

LEGAL REVIEW REQUIRED。

---

# 124. 内容系统

使用：

# MDX

不要：

* WordPress
* Sanity
* Contentful
* Strapi

---

# 125. SEO Frontmatter

每个页面：

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

# 126. 内容更新时间规则

禁止：

每次 Build 自动：

```text
dateModified = today
```

只有：

发生实质性内容修改：

才更新 dateModified。

例如：

* 重大功能变化
* 定价变化
* 数据变化
* 新增主要章节
* 修复过期事实

---

# 127. lastReviewed

如果重新核查后：

内容仍准确，

可以更新：

```text
lastReviewed
```

但不要因此修改：

dateModified。

---

# 128. Review周期

## Alternatives

30天

## Best pages

30–60天

## Money Pages

90天

## Guides

180天

## Help

产品变化时同步更新。

---

# 129. SEO Audit

建立：

```text
npm run seo:audit
```

检测：

```text
today - lastReviewed > reviewCadenceDays
```

输出：

STALE CONTENT。

---

# 130. GitHub Scheduled Audit

每月 GitHub Action：

运行：

```text
seo:audit
```

发现过期内容：

生成报告 / GitHub Issue。

不要自动修改文章。

不要自动刷新日期。

---

# 131. Sitemap

`sitemap.xml`

包含：

* Home
* Money Pages
* Pricing
* Features
* Blog
* Guides
* Published Industries
* Published Alternatives

不包含：

* Login
* Signup
* Dashboard
* API
* Private QR flows

lastmod：

必须来自真实：

dateModified。

---

# 132. Robots

禁止：

```text
/app/
/api/
```

Dashboard：

```text
noindex,nofollow
```

---

# 133. Canonical

全部使用：

```text
NEXT_PUBLIC_SITE_URL
```

禁止：

workers.dev

Preview domain

成为Canonical。

---

# 134. Schema

首页：

```text
Organization
WebSite
SoftwareApplication
```

Money pages：

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

只有页面真实有FAQ才使用。

禁止假：

* Reviews
* Ratings
* Awards
* Customers

---

# 135. Performance

目标：

```text
LCP <= 2.5s
INP <= 200ms
CLS <= 0.1
```

Public pages：

* Server Components优先
* 少 `use client`
* 不要视频Hero
* 不要重型动画
* 控制第三方脚本
* 图片尺寸明确
* WebP/AVIF

---

# 136. Analytics

使用：

* GA4
* Google Search Console
* PostHog
* Sentry

---

# 137. Product Events

记录：

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
subscription_cancelled
```

---

# 138. SEO Attribution

注册时保存：

```text
landing_page
referrer
utm_source
utm_medium
utm_campaign
first_touch
last_touch
```

以后可以知道：

哪个SEO页面真正带来付费客户。

---

# 139. Activation

只有完成：

```text
Add first tool
+
Generate first QR
+
Complete first scan
```

才算：

Activated Company。

---

# 140. Security

所有 Mutation：

服务器验证：

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

# 141. Security Headers

生产：

* CSP
* HSTS
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Frame protection

保证兼容：

* Stripe
* Supabase
* Analytics

---

# 142. Audit Logs

至少记录：

* User invitation
* User removal
* Role change
* Worker deactivate
* PIN reset
* Bulk action
* Correction
* QR rotation
* Billing action
* Privacy request

---

# 143. Support日志禁止内容

不得记录：

* passwords
* PIN
* raw auth token
* secret keys

---

# 144. Unit / Integration Testing

使用：

# Vitest

覆盖核心Server Logic。

---

# 145. E2E

使用：

# Playwright

测试：

* Signup
* Login
* Tool creation
* QR
* Take
* Move
* Return
* Correction
* Damage
* Maintenance
* Import
* Billing

---

# 146. 共享设备测试

必须：

Worker A登录

↓

Switch Worker

↓

Worker B登录

↓

下一次 Transaction：

记录 B。

---

# 147. Session测试

测试：

* Idle timeout
* Absolute timeout
* Deactivation
* PIN reset
* Revoke sessions

Inactive Worker：

不得继续写数据。

---

# 148. QR安全测试

测试：

### Anonymous QR

不能 TAKE。

### Cross Company

Company A Worker：

不能操作 Company B Tool。

### Rotated QR

旧 token：

失效。

---

# 149. Import测试

必须测试：

Pro客户：

一次上传：

2,000 rows。

系统：

自动Batch。

不要求用户拆文件。

---

# 150. Import并发测试

多个Company同时：

2,000 row import。

要求：

* HTTP request快速返回Job
* Queue处理
* 不阻塞其他用户
* 不重复插入
* Queue retry安全

---

# 151. Storage测试

测试：

* Free超过100MB
* 超大文件
* 错误MIME
* Company A访问Company B文件
* 删除后的Orphan cleanup

---

# 152. Load Tests

使用：

# k6

或者同等级工具。

目录：

```text
tests/load/
```

---

# 153. Public Load Test

测试：

SEO pages。

记录：

* success
* error
* p50
* p95
* p99
* 5xx

---

# 154. Dashboard Load Test

模拟：

几十个并发用户：

* Dashboard
* Search
* Tool list
* Tool detail

---

# 155. Field Mutation Load Test

并发：

* Scan
* Take
* Move
* Return

不得出现：

* Double checkout
* Lost update
* Incorrect holder

---

# 156. QR Batch Test

测试：

100

500

2000

labels。

不要在Worker里生成巨大重量级PDF导致OOM。

优先：

Browser-side printable layout。

---

# 157. Load Blocking Conditions

出现：

* reproducible Worker CPU failure
* tenant data corruption
* duplicate transaction
* unauthorized data access
* queue job loss
* sustained 5xx

则：

不得上线。

---

# 158. Observability

Import：

```text
imports_started
imports_completed
imports_failed
rows_processed
queue_retry
queue_dlq
```

Storage：

```text
r2_upload
r2_bytes
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

---

# 159. Cloudflare配置

创建：

```text
wrangler.jsonc
```

包含：

* compatibility_date
* R2 bindings
* Queues
* Cron
* Environment variables
* Static assets
* Production route

---

# 160. 本地开发

不能仅验证：

```text
next dev
```

还必须在：

Cloudflare/OpenNext runtime

进行Preview。

---

# 161. CI/CD

生产部署前：

```text
lint
typecheck
unit tests
critical e2e
seo:audit
build
OpenNext Cloudflare build
```

必须全部通过。

---

# 162. GitHub

main：

生产分支。

GitHub：

→ Cloudflare Workers deployment。

---

# 163. 环境变量

提供：

```text
.env.example
.dev.vars.example
```

至少包括：

```text
NEXT_PUBLIC_SITE_URL

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

RESEND_API_KEY

TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY

WORKER_PIN_PEPPER

POSTHOG_KEY
GA_MEASUREMENT_ID

PRIVACY_CONTACT_EMAIL
SUPPORT_EMAIL
```

绝不提交真实Secret。

---

# 164. Database Migrations

所有Schema：

必须提交：

```text
supabase/migrations/
```

禁止只在Supabase Dashboard手动建立。

---

# 165. 公开页面必须完成

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

# 166. Auth Pages

```text
/login
/signup
/forgot-password
/auth/callback
```

---

# 167. SaaS Pages

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

# 168. SEO未来目录

架构预留：

```text
/industries/
/alternatives/
/best/
/guides/
```

但禁止：

没内容就批量生成。

---

# 169. SEO禁止行为

禁止：

* Keyword stuffing
* Fake reviews
* Fake star rating
* Fake customer count
* Fake case studies
* Fake awards
* Doorway pages
* 100个AI薄页面
* 每次Build自动改日期
* 虚构未提供关键词Volume/KD/CPC

---

# 170. 产品禁止行为

禁止：

为了显得“高级”自动增加：

* AI chatbot
* GPS hardware
* AirTag
* Bluetooth
* Payroll
* CRM
* QuickBooks
* Xero
* Fleet telematics
* Advanced ERP

---

# 171. Feature完成定义

任何功能只有同时具备：

```text
Persistence
+
Server Logic
+
Authorization
+
UI
+
Error Handling
+
Automated Tests
```

才能标记：

# COMPLETED

---

# 172. 禁止假完成

例如：

Stripe只有Pricing Button：

不是 Billing完成。

QR只生成图片：

不是 QR workflow完成。

数据库有maintenance表：

不是 Maintenance完成。

有company_id：

不代表RLS完成。

---

# 173. 最终核心验收流程

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
Worker login
↓
Scan
↓
Take
↓
Move
↓
Return
↓
Report Damage
↓
Maintenance
↓
Correction
↓
Complete History
```

---

# 174. Billing验收

真实测试：

```text
Free
→ Starter
→ Growth
→ Downgrade
→ Cancel
```

Webhook全部正常。

---

# 175. SEO验收报告

最终必须输出：

每个公开页面：

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
Canonical
Index Status
datePublished
dateModified
lastReviewed
```

---

# 176. Security上线阻塞项

以下任一存在：

不能声称 Production Ready：

* QR token 本身可写
* Anonymous QR 可以 TAKE
* Cross tenant访问
* Inactive worker旧session仍有效
* 4位PIN
* bcrypt实现
* 无PIN限流
* Import单请求处理全部Excel
* Import没有幂等
* Free用户无限R2
* 无Privacy Delete
* 无Help Center
* 无负载测试
* 无竞品Legal Gate
* 自动刷新dateModified

---

# 177. 最终部署

目标：

# Cloudflare Workers Production

不是：

Cloudflare Pages。

---

# 178. README必须包含

* Product
* Architecture
* Next.js setup
* OpenNext setup
* Cloudflare
* Supabase
* RLS
* R2
* Queues
* Cron
* Turnstile
* Stripe
* Resend
* Import
* PIN
* Privacy
* SEO
* Tests
* Load tests
* Deployment
* Custom domain
* Google Search Console
* Troubleshooting

---

# 179. 最终交付报告

完成时必须给出：

1. 完整目录树
2. 功能清单
3. 数据库表
4. Migration状态
5. RLS状态
6. Session设计
7. QR安全状态
8. Import Queue状态
9. R2 Storage quota状态
10. Maintenance状态
11. Stripe状态
12. Email状态
13. Privacy状态
14. Help Center状态
15. SEO页面清单
16. Keyword数据
17. Cloudflare配置
18. Queue配置
19. Cron配置
20. 测试结果
21. Load test结果
22. Lighthouse结果
23. Deployment命令
24. Domain配置
25. GSC提交步骤
26. External credentials blocking items
27. 未完成事项

没有真正完成：

必须明确写：

# NOT COMPLETED

---

# 180. 最终技术栈

```text
Next.js 16 App Router
TypeScript
Tailwind CSS
shadcn/ui

OpenNext Cloudflare Adapter
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

# 181. 最终工程原则

产品范围：

一次确定。

工程实现：

允许自主分步骤。

不得：

为了“一次性交付”把所有代码一次性乱写。

应该：

```text
Implement
→ Test
→ Fix
→ Continue
```

直到全部最终范围完成。

---

# 182. 最终产品原则

如果一个功能不能帮助小型施工团队：

> 知道工具在哪里、谁拿着、发生了什么

不要做。

如果 Field Worker：

需要培训才能完成扫码：

重新设计。

如果客户：

必须预约销售才能开始：

重新简化。

如果 SEO 页面：

只是为了搜索引擎而没有真实价值：

不要发布。

---

# 183. 开始执行

不要重新选择技术栈。

不要重新设计产品方向。

不要把Cloudflare换成Vercel。

不要把OpenNext换回vinext。

不要把Supabase换成Firebase。

不要把产品改成Generic Inventory。

不要把所有竞品页立即index。

不要跳过RLS。

不要跳过Load Testing。

不要把未完成标成完成。

开始从项目初始化实施，并持续：

```text
Build
→ Test
→ Verify
→ Fix
```

直到达到本文件定义的全部最终验收条件。

