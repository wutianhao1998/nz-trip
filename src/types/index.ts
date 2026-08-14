// ================================
// 全局类型定义文件
// ================================

// ---- 用户相关类型 ----
/** 当前协同用户信息 */
export interface Collaborator {
  id: string;          // 唯一ID（浏览器本地生成）
  nickname: string;    // 临时昵称
  color: string;       // 头像标识色
  role: 'editor' | 'viewer';  // 权限角色
  joinedAt: number;    // 加入时间戳
  lastActiveAt: number; // 最后活跃时间
}

// ---- 行程相关类型 ----
/** 新西兰专属标签 */
export type NZTag =
  | '环岛'
  | '冰川'
  | '徒步'
  | '峡湾'
  | '海边'
  | '城市休闲'
  | '观星'
  | '温泉'
  | '酒庄'
  | '农场';

/** 行程难易度 */
export type DifficultyLevel = '轻松' | '适中' | '较难' | '挑战';

/** 交通方式 */
export type TransportType =
  | '自驾'
  | '飞机'
  | '大巴'
  | '火车'
  | '轮渡'
  | '步行'
  | '出租车'
  | '其他';

/** 单条行程条目 */
export interface ScheduleItem {
  id: string;              // 唯一ID
  date: string;            // 所属日期 YYYY-MM-DD
  timeStart: string;       // 开始时间 HH:mm
  timeEnd: string;         // 结束时间 HH:mm
  location: string;        // 游玩地点
  transport: TransportType; // 交通方式
  dining: string;          // 餐饮安排
  duration: number;        // 停留时长（分钟）
  notes: string;           // 行程备注
  difficulty: DifficultyLevel; // 难易度
  tags: NZTag[];           // 新西兰标签
  // 溯源字段
  createdBy: string;       // 创建人昵称
  createdAt: number;       // 创建时间
  updatedBy: string;       // 最后更新人
  updatedAt: number;       // 最后更新时间
  sortOrder: number;       // 排序序号
}

/** 每日行程（按日期分组） */
export interface DaySchedule {
  date: string;            // 日期 YYYY-MM-DD
  items: ScheduleItem[];   // 当日行程列表
}

// ---- 订单台账类型 ----
/** 订单分类 */
export type OrderCategory =
  | '国际机票'
  | '境内机票'
  | '酒店'
  | '租车'
  | '景点门票'
  | '徒步预约'
  | '轮渡票';

/** 订单状态 */
export type OrderStatus = '未预订' | '已预订' | '已付款' | '已核销';

/** 支持的币种 */
export type Currency = 'NZD' | 'CNY' | 'USD' | 'AUD' | 'EUR';

/** 订单凭证 */
export interface OrderVoucher {
  name: string;      // 文件名
  type: string;      // 文件类型
  size: number;      // 文件大小
  dataUrl: string;   // base64数据URL
}

/** 订单条目 */
export interface OrderItem {
  id: string;              // 唯一ID
  category: OrderCategory; // 分类
  title: string;           // 标题
  orderNo: string;         // 订单号
  dateTime: string;        // 出行/使用时间 ISO格式
  price: number;           // 价格金额
  currency: Currency;      // 支付币种
  contact: string;         // 联系人信息
  voucher?: OrderVoucher;  // 凭证附件
  status: OrderStatus;     // 状态
  notes: string;           // 备注
  // 溯源字段
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
}

// ---- 天气相关类型 ----
/** 天气图标类型 */
export type WeatherIconType =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'windy';

/** 当日天气 */
export interface CurrentWeather {
  location: string;        // 城市名
  locationCode: string;    // 城市编码
  temperature: number;     // 实时温度
  feelsLike: number;       // 体感温度
  windSpeed: number;       // 风速 km/h
  windDirection: string;   // 风向
  humidity: number;        // 湿度 %
  rainProbability: number; // 降水概率 %
  uvIndex: number;         // UV指数
  icon: WeatherIconType;   // 天气图标
  description: string;     // 天气描述
  advice: string[];        // 出行建议
  updatedAt: number;       // 更新时间
}

/** 10日天气预报条目 */
export interface ForecastDay {
  date: string;            // 日期
  tempHigh: number;        // 最高温
  tempLow: number;         // 最低温
  rainProbability: number; // 降水概率
  icon: WeatherIconType;   // 天气图标
  description: string;     // 描述
}

/** 完整天气数据 */
export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

// ---- 注意事项类型 ----
/** 物资清单项 */
export interface InventoryItem {
  id: string;
  name: string;        // 物品名称
  category: '证件' | '衣物' | '电子' | '洗漱' | '药品' | '户外' | '其他';
  checked: boolean;    // 是否已备齐
  owner: '共用' | string;  // 所有人：共用或具体人名
  quantity: number;    // 数量
}

/** 注意事项条目 */
export interface NoticeData {
  // 全局通用须知
  globalNotices: {
    entryCustoms: string;      // 入境禁忌/海关申报
    trafficRules: string;      // 交通规则（靠左行驶）
    paymentNetwork: string;    // 支付/网络
    emergencyContact: string;  // 紧急电话
    campingRules: string;      // 露营规范
  };
  // 安全须知
  safetyTips: {
    hiking: string;      // 徒步安全
    glacier: string;     // 冰川安全
    tide: string;        // 潮汐注意
    wildlife: string;    // 野生动物
    temperature: string; // 温差防护
  };
  // 每日专属备注 key=日期
  dailyNotes: Record<string, string>;
  // 物资清单
  inventory: InventoryItem[];
}

// ---- 留言板类型 ----
/** 同伴留言 */
export interface ChatMessage {
  id: string;
  senderId: string;     // 发送者ID
  senderName: string;   // 发送者昵称
  senderColor: string;  // 发送者标识色
  content: string;      // 内容
  createdAt: number;    // 发送时间
}

// ---- 协同操作日志（修改溯源）----
export interface ActivityLog {
  id: string;
  type: 'schedule' | 'order' | 'notice' | 'chat';
  action: 'create' | 'update' | 'delete';
  description: string;
  operator: string;     // 操作人
  operatorColor: string;
  timestamp: number;
}

// ---- Supabase 表行类型映射 ----
/** travel_schedule 表 */
export interface DBScheduleRow {
  id?: string;
  trip_id: string;
  date: string;
  items: ScheduleItem[];  // JSON数组存储
  updated_by: string;
  updated_at?: string;
}

/** travel_order 表 */
export interface DBOrderRow {
  id?: string;
  trip_id: string;
  orders: OrderItem[];    // JSON数组存储
  updated_by: string;
  updated_at?: string;
}

/** travel_notice 表 */
export interface DBNoticeRow {
  id?: string;
  trip_id: string;
  notice: NoticeData;     // JSON对象存储
  messages: ChatMessage[]; // JSON数组存储
  updated_by: string;
  updated_at?: string;
}

/** travel_settings 表 —— 旅行配置（起止日期等），支持多人协同同步 */
export interface DBSettingsRow {
  id?: string;
  trip_id: string;
  start_date: string;     // YYYY-MM-DD
  end_date: string;       // YYYY-MM-DD
  updated_by: string;
  updated_at?: string;
}
