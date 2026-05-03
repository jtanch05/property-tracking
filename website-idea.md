# PropTrack MY Website Idea

## 一句话说明

PropTrack MY 是一个面向马来西亚房东和小型房产投资者的房产组合管理网站，用来集中管理房产、租客、租约、租金、支出、维修、提醒和现金流，让用户不用再把资料分散在 Excel、WhatsApp、Google Calendar、PDF 文件和纸本记录里。

## 这个网站解决什么问题

很多房东在管理多间房产时会遇到这些问题：

- 不知道每一间房产目前有没有租客、租约什么时候到期、租金有没有逾期。
- 租金、押金、维修费、管理费、水电费、保险、门牌税和地税分散记录，难以看清真实现金流。
- 维修事项和 vendor 联系方式没有系统记录，后续追踪麻烦。
- 重要日期依赖记忆或聊天记录，例如租约到期、租金 due date、账单 due date、保险到期。
- 每次要整理报表或给 co-owner / accountant 看时，需要重新从不同地方汇总资料。

PropTrack MY 的核心想法是：以「房产」为中心，把这间房产相关的所有经营资料放在同一个 workspace 里。

## 目标用户

主要用户：

- 在马来西亚拥有一间或多间出租房产的个人房东。
- 管理 condo、apartment、studio、terrace house、semi-D、bungalow、townhouse、shoplot 等房产的投资者。
- 需要追踪租客、租约、租金、维修和支出的 owner。
- 有 co-owner，需要清楚记录 ownership split、payout 或财务分配的人。

次要用户：

- 帮家人管理房产的人。
- 小型 property manager。
- 想从 Excel 迁移到更结构化系统的房东。

## 产品核心理念

PropTrack MY 是 property-first 的系统。

主流程不是让用户在很多模块之间跳来跳去，而是：

1. 进入 Dashboard 看整体情况。
2. 进入 Properties。
3. 选择一间房产。
4. 在这间房产内部管理 Overview、Tenants、Agreements、Ledger、Expenses、Maintenance。
5. 用 Timeline 查看所有重要提醒和 upcoming events。
6. 用 Settings 管理账户、提醒、主题、备份和 integrations。

## 主要页面

### 1. Landing Page

给未登录用户看的介绍页。它应该说明 PropTrack MY 是什么、适合谁、能解决什么问题，并引导用户登录或开始使用。

### 2. Dashboard

Dashboard 是用户登录后的总览页，用来快速回答：

- 我现在有多少房产？
- 哪些房产有 active tenant？
- 本月预计租金收入是多少？
- 本月支出是多少？
- 当前现金流是正还是负？
- 有没有租金逾期、租约快到期、账单快到期或维修还没处理？
- 最近发生了什么记录变动？

Dashboard 应该是决策入口，不是录入资料的主要地方。

### 3. Properties

Properties 是整个系统最重要的页面。用户在这里管理每一间房产，以及房产相关的一切资料。

每一间房产可以记录：

- 房产昵称
- 房产类型
- 州属
- local council
- unit number / house number / lot number
- block / tower
- floor
- built-up size
- land size
- bedrooms
- bathrooms
- parking bays
- strata / non-strata
- furnished status
- year built
- notes
- co-owners 和 ownership split

选中一间房产后，用户进入 property workspace。

Property workspace 应该包含这些 tabs：

- Overview：房产基本资料和摘要。
- Tenants：这间房产关联的租客。
- Agreements：这间房产的租约、deposit 和 lease details。
- Ledger：这间房产的租金记录、payment status、late rent、payout 和 deductions。
- Expenses：这间房产的财务类支出，例如 tax、utility、insurance、management fee。
- Maintenance：这间房产的维修事项、维修状态、费用和 vendor。

### 4. Timeline

Timeline 是提醒中心，用来集中查看所有需要注意的事情。

它可以包含：

- 租金到期提醒
- 租金逾期提醒
- 租约快到期
- 保险到期
- tax / utility / management fee due date
- 维修待处理
- 重要系统通知

Timeline 的作用是让用户知道「接下来要处理什么」。

### 5. Settings

Settings 用来管理系统行为和个人偏好。

可能包含：

- 账户资料
- dark / light theme
- notification preference
- alert frequency
- Google Calendar sync
- email digest settings
- data backup / import
- sign out

## 隐藏但仍存在的功能模块

这些功能可以保留路由或内部页面，但不应该全部放在主导航里，因为主导航太多会让用户 flow 混乱。

隐藏模块包括：

- Tenants
- Agreements
- Rent Ledger
- Cash Flow
- Expenses
- Maintenance
- Vendors

它们更适合作为 property workspace 内的功能，或作为未来高级入口。

## 主要功能

### 房产管理

用户可以新增、编辑、删除和搜索房产。系统会根据不同房产类型显示不同字段，例如 condo 需要 unit number、block、floor；landed property 更需要 lot number、land size、storeys。

### 租客管理

用户可以记录租客资料，并把租客关联到某一间房产。租客资料可用于租约、租金提醒和 occupancy status。

### 租约管理

用户可以记录 lease agreement，包括租期、租金、deposit、租约状态和相关日期。租约信息可以帮助系统判断是否快到期，以及房产是否 occupied。

### 租金 Ledger

用户可以记录每个月租金是否已付、付款日期、金额、逾期状态和 notes。这个模块也可以支持 WhatsApp reminder，帮助用户提醒租客付款。

### 支出管理

Expenses 用来记录财务类支出：

- Assessment tax / quit rent
- Utilities
- Insurance
- Management fee
- Sinking fund

Maintenance 不应该混在 Expenses editable table 里，因为维修有独立 workflow、状态和 vendor。

### 维修管理

Maintenance 用来管理维修和 work orders：

- 维修描述
- 房产
- reported date
- status
- cost
- vendor
- notes

维修成本可以进入 Cash Flow 和 Dashboard 的财务汇总，但维修记录本身应该在 Maintenance tab 里管理。

### Vendor 管理

用户可以记录 plumber、electrician、aircond technician、cleaner、contractor 等 vendor 信息，方便未来维修时快速找到联系人。

### Cash Flow

Cash Flow 用来汇总收入和支出，让用户看到房产组合的真实表现。

它应该考虑：

- Rent income
- Tax
- Utilities
- Insurance
- Management fees
- Maintenance cost
- Payouts 或 co-owner 分配

### Alerts 和 Notifications

系统应该主动提醒用户重要事项，而不是等用户自己记得检查。

提醒类型包括：

- 租金快到期
- 租金逾期
- 租约快到期
- 保险快到期
- 支出 due date
- 维修未完成

提醒可以通过 app 内通知、email digest、push notification 或 Google Calendar sync 实现。

### Export 和 Backup

用户应该可以导出 PDF 报表，方便发给 accountant、co-owner 或自己存档。

用户也应该可以 backup / import data，降低数据丢失风险。

## 网站的使用价值

PropTrack MY 的价值不是单纯记录资料，而是帮房东更容易回答这些问题：

- 哪一间房产现在最需要注意？
- 哪个租客还没付款？
- 哪个租约快到期？
- 这个月实际赚了多少钱？
- 哪些支出正在影响现金流？
- 维修有没有拖太久？
- 我需要提醒谁、处理什么、导出什么？

它应该让用户从「被动整理资料」变成「主动管理房产经营」。

## 用户体验方向

网站应该感觉像一个安静、专业、可长期使用的操作系统，而不是房地产广告网站。

设计方向：

- 简洁
- 高级但不花哨
- 数据清楚
- 操作路径短
- mobile 可用
- 不让用户在太多页面之间迷路

主导航应该保持克制，只保留：

- Dashboard
- Properties
- Timeline
- Settings

所有 property-specific 的功能都应该优先放进 Properties workspace。

## 未来可以扩展的方向

未来可以加入：

- OCR 上传账单并自动生成 expense。
- 自动生成 monthly owner statement。
- 自动计算 ROI、yield、net cash flow。
- 多 owner payout report。
- Tenant portal。
- Vendor job tracking。
- AI assistant 帮用户总结本月财务和待办事项。
- Property document vault，用来存放 tenancy agreement、IC copy、receipts、insurance policy、tax bills。
- 多语言支持：English、中文、Bahasa Malaysia。

## 给未来开发者或 AI Agent 的重点

开发这个网站时，永远记住：

- 这是 property-first app，不是很多独立模块平铺的后台系统。
- 用户最重要的对象是「一间房产」。
- Dashboard 负责总览，Properties 负责管理，Timeline 负责提醒，Settings 负责配置。
- Tenants、Agreements、Ledger、Expenses、Maintenance 应该围绕房产组织。
- Expenses 和 Maintenance 要分清楚：一个是财务记录，一个是维修 workflow。
- 不要为了功能多而增加主导航复杂度。
- 不要把产品做成 marketing landing page；登录后的 app 应该是高效的操作工具。
