-- ============================================================
-- 新西兰旅行规划 - Supabase 数据库初始化 SQL
-- 在 Supabase SQL Editor 中一次性执行以下脚本
-- trip_id 必须与 src/utils/constants.ts 中的 DEFAULT_TRIP_ID 一致
-- ============================================================

-- 启用必要扩展
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. 行程表 travel_schedule
-- 按 trip_id + date 存储每日行程列表（JSON数组）
-- ============================================================
create table if not exists public.travel_schedule (
    id uuid primary key default gen_random_uuid(),
    trip_id text not null default 'nz-trip-demo-2024',
    date text not null,                   -- YYYY-MM-DD
    items jsonb not null default '[]'::jsonb,  -- ScheduleItem[]
    updated_by text not null default 'system',
    updated_at timestamptz not null default now(),
    unique (trip_id, date)
);

-- ============================================================
-- 2. 订单台账表 travel_order
-- 按 trip_id 存储全部订单（JSON数组，一次性读写简单）
-- ============================================================
create table if not exists public.travel_order (
    id uuid primary key default gen_random_uuid(),
    trip_id text not null unique default 'nz-trip-demo-2024',
    orders jsonb not null default '[]'::jsonb,  -- OrderItem[]
    updated_by text not null default 'system',
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. 注意事项/物资/留言表 travel_notice
-- 按 trip_id 存储注意事项 + 留言板
-- ============================================================
create table if not exists public.travel_notice (
    id uuid primary key default gen_random_uuid(),
    trip_id text not null unique default 'nz-trip-demo-2024',
    notice jsonb not null default '{}'::jsonb,     -- NoticeData
    messages jsonb not null default '[]'::jsonb,   -- ChatMessage[]
    updated_by text not null default 'system',
    updated_at timestamptz not null default now()
);

-- ============================================================
-- RLS (行级安全) 配置 - 开启匿名访问（因为无注册登录，简化使用）
-- 生产环境建议根据 trip_id 做更细粒度的权限控制
-- ============================================================

-- 启用 RLS
alter table public.travel_schedule enable row level security;
alter table public.travel_order enable row level security;
alter table public.travel_notice enable row level security;

-- 为匿名用户和认证用户开放全权限（简化场景）
-- travel_schedule
drop policy if exists "allow_all_schedule" on public.travel_schedule;
create policy "allow_all_schedule" on public.travel_schedule
    for all
    using (true)
    with check (true);

-- travel_order
drop policy if exists "allow_all_order" on public.travel_order;
create policy "allow_all_order" on public.travel_order
    for all
    using (true)
    with check (true);

-- travel_notice
drop policy if exists "allow_all_notice" on public.travel_notice;
create policy "allow_all_notice" on public.travel_notice
    for all
    using (true)
    with check (true);

-- ============================================================
-- Realtime 订阅配置 - 开启3张表的实时广播
-- ============================================================
begin;
  -- 从 publication 中移除可能重复的表（先删后加保证幂等）
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.travel_schedule;
alter publication supabase_realtime add table public.travel_order;
alter publication supabase_realtime add table public.travel_notice;

-- 设置 replica identity 为 full，让订阅可以收到完整变更前后数据
alter table public.travel_schedule replica identity full;
alter table public.travel_order replica identity full;
alter table public.travel_notice replica identity full;

-- ============================================================
-- 4. 自动更新时间触发器
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_schedule on public.travel_schedule;
create trigger set_timestamp_schedule
before update on public.travel_schedule
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_order on public.travel_order;
create trigger set_timestamp_order
before update on public.travel_order
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_notice on public.travel_notice;
create trigger set_timestamp_notice
before update on public.travel_notice
for each row execute function public.handle_updated_at();

-- ============================================================
-- 初始化默认数据（可选，让空行程有基础骨架）
-- ============================================================
-- 默认订单行（如果不存在则插入）
insert into public.travel_order (trip_id, orders, updated_by)
values ('nz-trip-demo-2024', '[]'::jsonb, 'init')
on conflict (trip_id) do nothing;

-- 默认注意事项行
insert into public.travel_notice (trip_id, notice, messages, updated_by)
values (
    'nz-trip-demo-2024',
    '{
      "globalNotices": {
        "entryCustoms": "1. 禁止携带：新鲜动植物制品、蜂蜜、种子、肉类、蛋类等\n2. 所有食品必须申报，未申报重罚$400+\n3. 每人限带50支香烟或50g烟草，烈酒不超1.125L\n4. 携带现金超1万纽币必须申报",
        "trafficRules": "1. 靠左行驶！方向盘在右侧，与国内完全相反\n2. 让行规则：Give Way 标志必须完全停下\n3. 环岛顺时针行驶，让行右侧来车\n4. 市区限速50km/h，高速一般100km/h\n5. 严禁酒驾，酒精含量0.05%以下\n6. 南岛山路多弯，注意减速",
        "paymentNetwork": "1. 主流信用卡Visa/Mastercard几乎全覆盖\n2. 小额也可使用EFTPOS（借记卡）\n3. 银联覆盖率较低，仅大城市部分商家\n4. 推荐Spark/Vodafone/2Degrees电话卡\n5. 免费WiFi覆盖有限，建议购流量套餐\n6. 小费非强制，服务费10%看情况给",
        "emergencyContact": "1. 紧急电话（警/消/救）：111\n2. 非紧急警察：105\n3. 中国驻新西兰大使馆：+64-4-4721382\n4. 旅游投诉：0800 282 273\n5. 道路救援 AA：0800 500 600",
        "campingRules": "1. DOC营地需提前在官网预订付费\n2. 自由露营仅允许在标注Freedom Camping区域\n3. 严禁在市区路边、私人领地露营\n4. 所有垃圾必须带走，不留痕迹\n5. 部分营地提供卫浴/厨房设施\n6. 南岛夏季旺季营地紧张，务必早订"
      },
      "safetyTips": {
        "hiking": "1. 出发前查看DOC官网的步道难度和天气\n2. 必须告知他人你的行程和预计返回时间\n3. 携带足够水、食物、保暖层、急救包、头灯\n4. 南岛高山天气多变，随时可能变暴风雪\n5. 不要离开标记步道，不要尝试抄近路\n6. 米尔福德步道等热门路线需提前抽签预约",
        "glacier": "1. 冰川徒步必须跟持证向导，禁止私自上冰川\n2. 冰缝极其危险，专业设备必不可少\n3. 冰川融水暴涨，不要在河谷逗留\n4. 穿防水登山鞋，备防水外套\n5. 福克斯/约瑟夫冰川需提前预订直升机",
        "tide": "1. 海边活动务必查潮汐表，涨潮非常快\n2. 凯库拉、薄饼岩等景点切勿在低潮时走太远\n3. 部分沙滩通道仅低潮时可通行\n4. 游泳在有救生员巡逻的旗标区内",
        "wildlife": "1. 不要触碰任何野生动物，包括海豹企鹅\n2. 与海豹保持至少10米距离\n3. 不要喂食野生鸟类（破坏生态）\n4. 海狮可能出现在沙滩公路，注意避让\n5. 沙蝇（Sandfly）猖獗，携带强效驱虫剂",
        "temperature": "1. 南北岛温差大：北岛温暖15-25度，南岛凉爽5-20度\n2. 夏季（12-2月）紫外线极强，防晒必备\n3. 冬季（6-8月）南岛雪山0度以下，需羽绒服\n4. 早晚温差大，洋葱式穿衣最实用\n5. 山区天气说变就变，多带一层总没错"
      },
      "dailyNotes": {},
      "inventory": [
        {"id": "inv_1","name":"护照+签证","category":"证件","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_2","name":"驾照+翻译件","category":"证件","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_3","name":"机票行程单","category":"证件","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_4","name":"旅行保险单","category":"证件","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_5","name":"信用卡/借记卡","category":"证件","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_6","name":"冲锋衣/防水外套","category":"衣物","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_7","name":"保暖抓绒/羽绒","category":"衣物","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_8","name":"舒适徒步鞋","category":"衣物","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_9","name":"泳衣+速干毛巾","category":"衣物","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_10","name":"转换插头(八字)","category":"电子","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_11","name":"充电宝+数据线","category":"电子","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_12","name":"车载手机支架","category":"电子","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_13","name":"防晒霜SPF50+","category":"洗漱","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_14","name":"墨镜+帽子","category":"洗漱","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_15","name":"防沙蝇驱虫剂","category":"洗漱","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_16","name":"感冒药/肠胃药","category":"药品","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_17","name":"创可贴/止痛药","category":"药品","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_18","name":"晕车药","category":"药品","checked":false,"owner":"共用","quantity":1},
        {"id": "inv_19","name":"登山包/防水袋","category":"户外","checked":false,"owner":"共用","quantity":2},
        {"id": "inv_20","name":"雨伞/雨衣","category":"户外","checked":false,"owner":"共用","quantity":2}
      ]
    }'::jsonb,
    '[]'::jsonb,
    'init'
)
on conflict (trip_id) do nothing;

-- 执行完成后，可以在 Supabase 控制台 Table Editor 验证数据是否已创建
