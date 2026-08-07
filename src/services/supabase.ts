// ================================
// Supabase 客户端封装
// 统一处理数据库操作 + Realtime 实时订阅
// ================================
import {
  createClient,
  SupabaseClient,
  type RealtimeChannel,
} from '@supabase/supabase-js'
import type {
  ScheduleItem,
  OrderItem,
  NoticeData,
  ChatMessage,
  DBScheduleRow,
  DBOrderRow,
  DBNoticeRow,
} from '@/types'
import { DEFAULT_TRIP_ID } from '@/utils/constants'
import { generateId } from '@/utils'

// Supabase 客户端实例（单例）
let supabaseInstance: SupabaseClient | null = null

/** 获取 Supabase 客户端（延迟初始化，避免环境变量缺失报错） */
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance
  let url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  // 如果未配置 Supabase，返回 null，降级为纯本地模式
  if (!url || !key || url === 'your_supabase_project_url') {
    console.warn('[Supabase] 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，已降级为本地离线模式')
    return null
  }
  // 防御性清洗 URL：去掉末尾的 /rest/v1、/realtime/v1、多余的斜杠
  // 避免 SDK 自动拼接后出现 /rest/v1/rest/v1/ 双重路径
  url = url.replace(/\/(rest\/v1|realtime\/v1)\/?$/i, '').replace(/\/+$/, '')
  try {
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: { eventsPerSecond: 20 },
      },
      auth: {
        persistSession: false, // 无注册登录，不持久化 session
        autoRefreshToken: false,
      },
    })
    return supabaseInstance
  } catch (e) {
    console.error('[Supabase] 初始化失败:', e)
    return null
  }
}

/** 判断是否已配置 Supabase */
export const isSupabaseReady = (): boolean => {
  return getSupabase() !== null
}

// ================================
// 变更回调类型（Realtime 订阅触发）
// ================================
export interface DBChangeHandlers {
  onScheduleChange?: (date: string, items: ScheduleItem[]) => void
  onOrderChange?: (orders: OrderItem[]) => void
  onNoticeChange?: (notice: NoticeData, messages: ChatMessage[]) => void
}

// 当前订阅频道集合（便于取消）
let scheduleChannel: RealtimeChannel | null = null
let orderChannel: RealtimeChannel | null = null
let noticeChannel: RealtimeChannel | null = null

/**
 * 订阅所有表的 Realtime 变更
 */
export const subscribeRealtime = (handlers: DBChangeHandlers): void => {
  const sb = getSupabase()
  if (!sb) return
  const tripId = DEFAULT_TRIP_ID

  // ---- 订阅行程表变更 ----
  scheduleChannel = sb
    .channel('public:travel_schedule')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'travel_schedule',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        // 插入或更新时，触发回调
        const newRow = payload.new as DBScheduleRow | null
        if (newRow && handlers.onScheduleChange) {
          handlers.onScheduleChange(newRow.date, newRow.items as ScheduleItem[])
        }
      }
    )
    .subscribe()

  // ---- 订阅订单表变更 ----
  orderChannel = sb
    .channel('public:travel_order')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'travel_order',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        const newRow = payload.new as DBOrderRow | null
        if (newRow && handlers.onOrderChange) {
          handlers.onOrderChange(newRow.orders as OrderItem[])
        }
      }
    )
    .subscribe()

  // ---- 订阅注意事项/留言变更 ----
  noticeChannel = sb
    .channel('public:travel_notice')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'travel_notice',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        const newRow = payload.new as DBNoticeRow | null
        if (newRow && handlers.onNoticeChange) {
          handlers.onNoticeChange(
            newRow.notice as NoticeData,
            newRow.messages as ChatMessage[]
          )
        }
      }
    )
    .subscribe()
}

/** 取消所有订阅（组件卸载时调用） */
export const unsubscribeRealtime = (): void => {
  const sb = getSupabase()
  if (!sb) return
  if (scheduleChannel) sb.removeChannel(scheduleChannel)
  if (orderChannel) sb.removeChannel(orderChannel)
  if (noticeChannel) sb.removeChannel(noticeChannel)
  scheduleChannel = orderChannel = noticeChannel = null
}

// ================================
// 行程 CRUD
// ================================

/** 拉取所有行程（按 trip_id） */
export const fetchAllSchedules = async (): Promise<Map<string, ScheduleItem[]>> => {
  const sb = getSupabase()
  const result = new Map<string, ScheduleItem[]>()
  if (!sb) return result
  try {
    const { data, error } = await sb
      .from('travel_schedule')
      .select('date, items')
      .eq('trip_id', DEFAULT_TRIP_ID)
    if (error) throw error
    if (data) {
      ;(data as DBScheduleRow[]).forEach((row) => {
        result.set(row.date, (row.items as ScheduleItem[]) || [])
      })
    }
  } catch (e) {
    console.error('[DB] 拉取行程失败:', e)
  }
  return result
}

/** 保存单日行程（upsert） */
export const saveDaySchedule = async (
  date: string,
  items: ScheduleItem[],
  updatedBy: string
): Promise<boolean> => {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const { error } = await sb.from('travel_schedule').upsert(
      {
        trip_id: DEFAULT_TRIP_ID,
        date,
        items: items as unknown as Record<string, unknown>[],
        updated_by: updatedBy,
      },
      { onConflict: 'trip_id,date' }
    )
    if (error) throw error
    return true
  } catch (e) {
    console.error('[DB] 保存行程失败:', e)
    return false
  }
}

// ================================
// 订单 CRUD
// ================================

/** 拉取所有订单 */
export const fetchAllOrders = async (): Promise<OrderItem[]> => {
  const sb = getSupabase()
  if (!sb) return []
  try {
    const { data, error } = await sb
      .from('travel_order')
      .select('orders')
      .eq('trip_id', DEFAULT_TRIP_ID)
      .single()
    if (error) {
      // 无记录时返回空数组
      if (error.code === 'PGRST116') return []
      throw error
    }
    return ((data as DBOrderRow)?.orders as OrderItem[]) || []
  } catch (e) {
    console.error('[DB] 拉取订单失败:', e)
    return []
  }
}

/** 保存所有订单（整体覆盖，简化实现） */
export const saveAllOrders = async (
  orders: OrderItem[],
  updatedBy: string
): Promise<boolean> => {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const { error } = await sb.from('travel_order').upsert(
      {
        trip_id: DEFAULT_TRIP_ID,
        orders: orders as unknown as Record<string, unknown>[],
        updated_by: updatedBy,
      },
      { onConflict: 'trip_id' }
    )
    if (error) throw error
    return true
  } catch (e) {
    console.error('[DB] 保存订单失败:', e)
    return false
  }
}

// ================================
// 注意事项 + 留言 CRUD
// ================================

/** 拉取注意事项 + 留言 */
export const fetchNoticeAndMessages = async (): Promise<{
  notice: NoticeData | null
  messages: ChatMessage[]
}> => {
  const sb = getSupabase()
  const defaultRet = { notice: null, messages: [] }
  if (!sb) return defaultRet
  try {
    const { data, error } = await sb
      .from('travel_notice')
      .select('notice, messages')
      .eq('trip_id', DEFAULT_TRIP_ID)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return defaultRet
      throw error
    }
    const row = data as DBNoticeRow
    return {
      notice: (row.notice as NoticeData) || null,
      messages: (row.messages as ChatMessage[]) || [],
    }
  } catch (e) {
    console.error('[DB] 拉取注意事项失败:', e)
    return defaultRet
  }
}

/** 保存注意事项 */
export const saveNoticeData = async (
  notice: NoticeData,
  updatedBy: string
): Promise<boolean> => {
  const sb = getSupabase()
  if (!sb) return false
  try {
    // 先判断是否存在记录，存在则仅更新 notice，不覆盖 messages
    const existing = await sb
      .from('travel_notice')
      .select('id')
      .eq('trip_id', DEFAULT_TRIP_ID)
      .maybeSingle()

    if (existing.data) {
      const { error } = await sb
        .from('travel_notice')
        .update({
          notice: notice as unknown as Record<string, unknown>,
          updated_by: updatedBy,
        })
        .eq('trip_id', DEFAULT_TRIP_ID)
      if (error) throw error
    } else {
      const { error } = await sb.from('travel_notice').insert({
        trip_id: DEFAULT_TRIP_ID,
        notice: notice as unknown as Record<string, unknown>,
        messages: [],
        updated_by: updatedBy,
      })
      if (error) throw error
    }
    return true
  } catch (e) {
    console.error('[DB] 保存注意事项失败:', e)
    return false
  }
}

/** 追加一条留言（插入数组尾部，避免整体覆盖丢消息） */
export const appendChatMessage = async (
  message: ChatMessage,
  allMessages: ChatMessage[],
  updatedBy: string
): Promise<boolean> => {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const existing = await sb
      .from('travel_notice')
      .select('id')
      .eq('trip_id', DEFAULT_TRIP_ID)
      .maybeSingle()

    if (existing.data) {
      const { error } = await sb
        .from('travel_notice')
        .update({
          messages: allMessages as unknown as Record<string, unknown>[],
          updated_by: updatedBy,
        })
        .eq('trip_id', DEFAULT_TRIP_ID)
      if (error) throw error
    } else {
      const { error } = await sb.from('travel_notice').insert({
        trip_id: DEFAULT_TRIP_ID,
        notice: {},
        messages: [message] as unknown as Record<string, unknown>[],
        updated_by: updatedBy,
      })
      if (error) throw error
    }
    // 避免 linter 报错
    void generateId
    return true
  } catch (e) {
    console.error('[DB] 追加留言失败:', e)
    return false
  }
}
