// ================================
// Pinia 核心 Store - 全局旅行状态管理
// 包含：用户信息、行程、订单、注意事项、留言、在线状态
// ================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Collaborator,
  ScheduleItem,
  OrderItem,
  NoticeData,
  ChatMessage,
  DaySchedule,
  ActivityLog,
} from '@/types'
import {
  generateId,
  generateAvatarColor,
  hashColorFromString,
  formatDate,
  deepClone,
  generateDateRange,
} from '@/utils'
import {
  STORAGE_KEYS,
  DEFAULT_TRIP_DURATION,
  DEFAULT_EXCHANGE_RATES,
} from '@/utils/constants'
import type { Currency } from '@/types'
import dayjs from 'dayjs'
import {
  isSupabaseReady,
  fetchAllSchedules,
  saveDaySchedule,
  fetchAllOrders,
  saveAllOrders,
  fetchNoticeAndMessages,
  saveNoticeData,
  appendChatMessage,
  fetchTripSettings,
  saveTripSettings,
  subscribeRealtime,
  unsubscribeRealtime,
} from '@/services/supabase'

// ---- 默认空的注意事项骨架 ----
const createEmptyNoticeData = (): NoticeData => ({
  globalNotices: {
    entryCustoms: '',
    trafficRules: '',
    paymentNetwork: '',
    emergencyContact: '',
    campingRules: '',
  },
  safetyTips: {
    hiking: '',
    glacier: '',
    tide: '',
    wildlife: '',
    temperature: '',
  },
  dailyNotes: {},
  inventory: [],
})

export const useTripStore = defineStore('trip', () => {
  // ============================
  // State 定义
  // ============================

  // ---- 用户相关 ----
  const currentUser = ref<Collaborator | null>(null)
  const isEditorMode = ref<boolean>(true) // true=可编辑, false=只读

  // ---- 行程 ----
  const tripStartDate = ref<string>(dayjs().format('YYYY-MM-DD'))
  const tripEndDate = ref<string>(
    dayjs().add(DEFAULT_TRIP_DURATION - 1, 'day').format('YYYY-MM-DD')
  )
  // 按日期存储 Map<YYYY-MM-DD, ScheduleItem[]>
  const schedules = ref<Map<string, ScheduleItem[]>>(new Map())

  // ---- 订单 ----
  const orders = ref<OrderItem[]>([])

  // ---- 注意事项 ----
  const noticeData = ref<NoticeData>(createEmptyNoticeData())

  // ---- 留言板 ----
  const messages = ref<ChatMessage[]>([])

  // ---- 操作日志（修改溯源）----
  const activityLogs = ref<ActivityLog[]>([])

  // ---- 在线状态 ----
  const isOnline = ref<boolean>(true)
  const isSyncing = ref<boolean>(false)
  const lastSyncAt = ref<number>(0)

  // ---- 汇率表（各币种对人民币，用户可调整）----
  const exchangeRates = ref<Record<Currency, number>>({ ...DEFAULT_EXCHANGE_RATES })

  // ---- 离线操作队列 ----
  interface OfflineOp {
    id: string
    type: 'schedule' | 'order' | 'notice' | 'message'
    payload: unknown
    timestamp: number
  }
  const offlineQueue = ref<OfflineOp[]>([])

  // ============================
  // Getters / Computed
  // ============================

  /** 旅行总天数 */
  const totalTripDays = computed(() => {
    return Math.max(
      1,
      dayjs(tripEndDate.value).diff(dayjs(tripStartDate.value), 'day') + 1
    )
  })

  /** 所有日期列表（按起止日期生成） */
  const tripDateList = computed<string[]>(() => {
    return generateDateRange(tripStartDate.value, tripEndDate.value)
  })

  /** 按日期分组的行程列表（带空骨架） */
  const daySchedules = computed<DaySchedule[]>(() => {
    return tripDateList.value.map((date) => ({
      date,
      items: (schedules.value.get(date) || []).slice().sort((a, b) => {
        // 先按开始时间排序（从早到晚），时间相同再按添加顺序保持稳定
        const timeCmp = a.timeStart.localeCompare(b.timeStart)
        if (timeCmp !== 0) return timeCmp
        return a.sortOrder - b.sortOrder
      }),
    }))
  })

  /** 行程总条目数 */
  const totalScheduleItems = computed(() => {
    let total = 0
    schedules.value.forEach((items) => (total += items.length))
    return total
  })

  /** 已预订订单数 */
  const paidOrderCount = computed(() => {
    return orders.value.filter(
      (o) => o.status === '已预订' || o.status === '已付款' || o.status === '已核销'
    ).length
  })

  /** 待办订单数（未预订） */
  const pendingOrderCount = computed(() => {
    return orders.value.filter((o) => o.status === '未预订').length
  })

  /** 订单总金额（原始各币种之和，仅作参考） */
  const totalOrderAmount = computed(() => {
    return orders.value.reduce((sum, o) => sum + (o.price || 0), 0)
  })

  /** 订单总金额（全部换算为人民币） */
  const totalOrderAmountCNY = computed(() => {
    return orders.value.reduce((sum, o) => {
      const cur = (o.currency || 'NZD') as Currency
      const rate = exchangeRates.value[cur] ?? 1
      return sum + (o.price || 0) * rate
    }, 0)
  })

  /** 更新汇率 */
  const updateExchangeRate = (currency: Currency, rate: number) => {
    exchangeRates.value = { ...exchangeRates.value, [currency]: rate }
    saveExchangeRatesToLocal()
  }

  /** 批量更新汇率 */
  const updateExchangeRates = (rates: Record<Currency, number>) => {
    exchangeRates.value = { ...exchangeRates.value, ...rates }
    saveExchangeRatesToLocal()
  }

  /** 汇率存本地 */
  const saveExchangeRatesToLocal = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATES, JSON.stringify(exchangeRates.value))
    } catch (e) {
      console.error('[Store] 汇率本地保存失败:', e)
    }
  }

  /** 从本地加载汇率 */
  const loadExchangeRatesFromLocal = () => {
    try {
      const str = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATES)
      if (str) {
        const parsed = JSON.parse(str)
        exchangeRates.value = { ...DEFAULT_EXCHANGE_RATES, ...parsed }
      }
    } catch (e) {
      console.error('[Store] 汇率本地加载失败:', e)
    }
  }

  /** 物资清单已备齐数量 */
  const packedInventoryCount = computed(() => {
    return noticeData.value.inventory.filter((i) => i.checked).length
  })

  /** 物资清单总数量 */
  const totalInventoryCount = computed(() => {
    return noticeData.value.inventory.length
  })

  /** 是否有权限编辑（当前用户存在 + 是编辑模式） */
  const canEdit = computed(() => {
    return !!currentUser.value && isEditorMode.value
  })

  // ============================
  // Actions - 用户 / 权限
  // ============================

  /** 设置当前用户（首次输入昵称时调用） */
  const setCurrentUser = (nickname: string, role: 'editor' | 'viewer' = 'editor') => {
    const color = hashColorFromString(nickname) || generateAvatarColor()
    currentUser.value = {
      id: generateId(),
      nickname,
      color,
      role,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    }
    isEditorMode.value = role === 'editor'
    // 首次进入后初始化数据
    void initData()
  }

  /** 切换编辑/只读模式 */
  const toggleEditorMode = (editor?: boolean) => {
    isEditorMode.value = editor ?? !isEditorMode.value
    if (currentUser.value) {
      currentUser.value.role = isEditorMode.value ? 'editor' : 'viewer'
    }
  }

  /** 更新用户活跃时间 */
  const touchActive = () => {
    if (currentUser.value) {
      currentUser.value.lastActiveAt = Date.now()
    }
  }

  // ============================
  // Actions - 数据初始化 + 同步
  // ============================

  /** 初始化数据：从云端拉取 + 订阅实时变更 */
  const initData = async () => {
    if (!isSupabaseReady()) {
      console.log('[Store] Supabase 未配置，使用本地模式')
      loadFromLocal()
      return
    }
    isSyncing.value = true
    try {
      // 并行拉取
      const [schedMap, orderList, noticeRes, settingsRes] = await Promise.all([
        fetchAllSchedules(),
        fetchAllOrders(),
        fetchNoticeAndMessages(),
        fetchTripSettings(),
      ])
      // 应用数据（云端优先，空数据才用本地兜底）
      schedules.value = schedMap.size > 0 ? schedMap : schedules.value
      orders.value = orderList.length > 0 ? orderList : orders.value
      if (noticeRes.notice) {
        noticeData.value = noticeRes.notice
      }
      messages.value = noticeRes.messages.length > 0 ? noticeRes.messages : messages.value
      // 应用云端旅行日期（覆盖本地默认值，实现多人同步）
      if (settingsRes) {
        tripStartDate.value = settingsRes.startDate
        tripEndDate.value = settingsRes.endDate
        // 补齐新日期范围的空行程骨架
        const dates = generateDateRange(settingsRes.startDate, settingsRes.endDate)
        dates.forEach((d) => {
          if (!schedules.value.has(d)) {
            schedules.value.set(d, [])
          }
        })
        schedules.value = new Map(schedules.value)
      }

      lastSyncAt.value = Date.now()
      addLog('schedule', 'update', '从云端同步行程数据')

      // 订阅实时变更
      subscribeRealtime({
        onScheduleChange: (date, items) => {
          schedules.value.set(date, items)
          // 触发响应式更新
          schedules.value = new Map(schedules.value)
        },
        onOrderChange: (newOrders) => {
          orders.value = newOrders
        },
        onNoticeChange: (notice, msgs) => {
          noticeData.value = notice
          messages.value = msgs
        },
        onSettingsChange: (startDate, endDate) => {
          // 其他协作者修改了旅行日期，实时同步
          tripStartDate.value = startDate
          tripEndDate.value = endDate
          const ds = generateDateRange(startDate, endDate)
          ds.forEach((d) => {
            if (!schedules.value.has(d)) {
              schedules.value.set(d, [])
            }
          })
          schedules.value = new Map(schedules.value)
          addLog('schedule', 'update', `协作者更新了旅行日期：${startDate} 至 ${endDate}`)
        },
      })
    } catch (e) {
      console.error('[Store] 初始化拉取失败，降级本地:', e)
      loadFromLocal()
    } finally {
      isSyncing.value = false
    }
  }

  /** 保存到本地缓存（离线兜底） */
  const saveToLocal = () => {
    try {
      // schedules Map 转 Object 存
      const schedObj: Record<string, ScheduleItem[]> = {}
      schedules.value.forEach((v, k) => (schedObj[k] = v))
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedObj))
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders.value))
      localStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(noticeData.value))
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages.value))
      if (currentUser.value) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser.value))
      }
    } catch (e) {
      console.error('[Store] 本地保存失败:', e)
    }
  }

  /** 从本地缓存加载 */
  const loadFromLocal = () => {
    try {
      const schedStr = localStorage.getItem(STORAGE_KEYS.SCHEDULES)
      if (schedStr) {
        const obj = JSON.parse(schedStr) as Record<string, ScheduleItem[]>
        const map = new Map<string, ScheduleItem[]>()
        Object.keys(obj).forEach((k) => map.set(k, obj[k]))
        schedules.value = map
      }
      const ordStr = localStorage.getItem(STORAGE_KEYS.ORDERS)
      if (ordStr) orders.value = JSON.parse(ordStr) as OrderItem[]
      const notStr = localStorage.getItem(STORAGE_KEYS.NOTICE)
      if (notStr) noticeData.value = JSON.parse(notStr) as NoticeData
      const msgStr = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      if (msgStr) messages.value = JSON.parse(msgStr) as ChatMessage[]
      const userStr = localStorage.getItem(STORAGE_KEYS.USER)
      if (userStr && !currentUser.value) {
        currentUser.value = JSON.parse(userStr) as Collaborator
      }
      // 加载汇率
      loadExchangeRatesFromLocal()
    } catch (e) {
      console.error('[Store] 本地加载失败:', e)
    }
  }

  /** 上线时同步离线操作队列 */
  const syncOfflineChanges = async () => {
    if (!isOnline.value || offlineQueue.value.length === 0) return
    isSyncing.value = true
    try {
      // 简单处理：按时间顺序逐个执行
      for (const op of [...offlineQueue.value]) {
        if (op.type === 'schedule') {
          const { date, items } = op.payload as { date: string; items: ScheduleItem[] }
          await saveDaySchedule(date, items, currentUser.value?.nickname || 'offline')
        } else if (op.type === 'order') {
          await saveAllOrders(orders.value, currentUser.value?.nickname || 'offline')
        } else if (op.type === 'notice') {
          await saveNoticeData(noticeData.value, currentUser.value?.nickname || 'offline')
        } else if (op.type === 'message') {
          const msg = op.payload as ChatMessage
          await appendChatMessage(msg, messages.value, currentUser.value?.nickname || 'offline')
        }
        // 成功就移除
        offlineQueue.value = offlineQueue.value.filter((o) => o.id !== op.id)
      }
      lastSyncAt.value = Date.now()
      addLog('schedule', 'update', '已同步离线操作')
    } catch (e) {
      console.error('[Store] 离线操作同步失败:', e)
    } finally {
      isSyncing.value = false
    }
  }

  /** 设置在线状态 */
  const setOnlineStatus = (online: boolean) => {
    isOnline.value = online
    addLog('schedule', 'update', online ? '网络已连接' : '网络已断开，进入离线模式')
  }

  // ============================
  // Actions - 行程 CRUD
  // ============================

  /** 更新旅行起止日期（会自动补齐缺失日期的空行程，并同步到云端） */
  const updateTripDates = (start: string, end: string) => {
    tripStartDate.value = start
    tripEndDate.value = end
    // 确保所有日期在 Map 中有空数组
    const dates = generateDateRange(start, end)
    dates.forEach((d) => {
      if (!schedules.value.has(d)) {
        schedules.value.set(d, [])
      }
    })
    // 触发响应式
    schedules.value = new Map(schedules.value)
    addLog('schedule', 'update', `调整行程日期：${start} 至 ${end}`)
    void syncDaySchedule(start, true) // 只选个代表性的同步
    // 同步旅行日期到 Supabase，让其他协作者实时收到变更
    if (currentUser.value && isSupabaseReady()) {
      void saveTripSettings(start, end, currentUser.value.nickname)
    }
  }

  /** 同步单日行程到云端 */
  const syncDaySchedule = async (date: string, fromQueue = false) => {
    if (!currentUser.value) return
    const items = schedules.value.get(date) || []
    const ok = await saveDaySchedule(date, items, currentUser.value.nickname)
    if (!ok && isOnline.value && !fromQueue) {
      // 在线但失败，入离线队列
      offlineQueue.value.push({
        id: generateId(),
        type: 'schedule',
        payload: { date, items: deepClone(items) },
        timestamp: Date.now(),
      })
    } else if (ok) {
      lastSyncAt.value = Date.now()
    }
  }

  /** 添加/更新一条行程 */
  const upsertScheduleItem = (date: string, item: ScheduleItem) => {
    if (!canEdit.value) return
    const list = schedules.value.get(date) || []
    const idx = list.findIndex((i) => i.id === item.id)
    const user = currentUser.value!
    if (idx >= 0) {
      // 更新
      list[idx] = {
        ...item,
        updatedBy: user.nickname,
        updatedAt: Date.now(),
      }
      addLog('schedule', 'update', `更新行程：${item.location || item.timeStart}`)
    } else {
      // 新增
      list.push({
        ...item,
        createdBy: user.nickname,
        createdAt: Date.now(),
        updatedBy: user.nickname,
        updatedAt: Date.now(),
        sortOrder: list.length,
      })
      addLog('schedule', 'create', `新增行程：${item.location || item.timeStart}`)
    }
    schedules.value.set(date, list)
    schedules.value = new Map(schedules.value)
    void syncDaySchedule(date)
  }

  /** 删除一条行程 */
  const deleteScheduleItem = (date: string, itemId: string) => {
    if (!canEdit.value) return
    const list = schedules.value.get(date) || []
    const target = list.find((i) => i.id === itemId)
    const newList = list.filter((i) => i.id !== itemId)
    schedules.value.set(date, newList)
    schedules.value = new Map(schedules.value)
    if (target) {
      addLog('schedule', 'delete', `删除行程：${target.location || target.timeStart}`)
    }
    void syncDaySchedule(date)
  }

  /** 重排某一天的行程（拖拽排序后调用） */
  const reorderScheduleItems = (date: string, orderedIds: string[]) => {
    if (!canEdit.value) return
    const list = schedules.value.get(date) || []
    const newList = orderedIds
      .map((id) => list.find((i) => i.id === id))
      .filter((i): i is ScheduleItem => !!i)
      .map((item, idx) => ({ ...item, sortOrder: idx }))
    // 把没在 orderedIds 里的也补上
    list.forEach((item) => {
      if (!newList.find((i) => i.id === item.id)) {
        newList.push({ ...item, sortOrder: newList.length })
      }
    })
    schedules.value.set(date, newList)
    schedules.value = new Map(schedules.value)
    addLog('schedule', 'update', `重新排序 ${formatDate(date)} 的行程`)
    void syncDaySchedule(date)
  }

  // ============================
  // Actions - 订单 CRUD
  // ============================

  const syncOrders = async () => {
    if (!currentUser.value) return
    const ok = await saveAllOrders(orders.value, currentUser.value.nickname)
    if (!ok && isOnline.value) {
      offlineQueue.value.push({
        id: generateId(),
        type: 'order',
        payload: deepClone(orders.value),
        timestamp: Date.now(),
      })
    } else if (ok) {
      lastSyncAt.value = Date.now()
    }
  }

  const upsertOrderItem = (order: OrderItem) => {
    if (!canEdit.value) return
    const user = currentUser.value!
    const idx = orders.value.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      orders.value[idx] = {
        ...order,
        updatedBy: user.nickname,
        updatedAt: Date.now(),
      }
      addLog('order', 'update', `更新订单：${order.title}`)
    } else {
      orders.value.unshift({
        ...order,
        createdBy: user.nickname,
        createdAt: Date.now(),
        updatedBy: user.nickname,
        updatedAt: Date.now(),
      })
      addLog('order', 'create', `新增订单：${order.title}`)
    }
    orders.value = [...orders.value]
    void syncOrders()
  }

  const deleteOrderItem = (orderId: string) => {
    if (!canEdit.value) return
    const target = orders.value.find((o) => o.id === orderId)
    orders.value = orders.value.filter((o) => o.id !== orderId)
    if (target) addLog('order', 'delete', `删除订单：${target.title}`)
    void syncOrders()
  }

  const updateOrderStatus = (orderId: string, status: OrderItem['status']) => {
    if (!canEdit.value) return
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx < 0) return
    orders.value[idx] = {
      ...orders.value[idx],
      status,
      updatedBy: currentUser.value!.nickname,
      updatedAt: Date.now(),
    }
    orders.value = [...orders.value]
    addLog('order', 'update', `订单状态变更：${orders.value[idx].title} → ${status}`)
    void syncOrders()
  }

  // ============================
  // Actions - 注意事项 CRUD
  // ============================

  const syncNotice = async () => {
    if (!currentUser.value) return
    const ok = await saveNoticeData(noticeData.value, currentUser.value.nickname)
    if (!ok && isOnline.value) {
      offlineQueue.value.push({
        id: generateId(),
        type: 'notice',
        payload: deepClone(noticeData.value),
        timestamp: Date.now(),
      })
    } else if (ok) {
      lastSyncAt.value = Date.now()
    }
  }

  /** 更新全局/安全须知的某个字段 */
  const updateNoticeField = (
    section: 'globalNotices' | 'safetyTips',
    field: string,
    value: string
  ) => {
    if (!canEdit.value) return
    const target = noticeData.value[section] as Record<string, string>
    if (target) {
      target[field] = value
      noticeData.value = { ...noticeData.value }
      addLog('notice', 'update', `更新${section}.${field}`)
      void syncNotice()
    }
  }

  /** 更新某日专属备注 */
  const updateDailyNote = (date: string, note: string) => {
    if (!canEdit.value) return
    if (note) {
      noticeData.value.dailyNotes[date] = note
    } else {
      delete noticeData.value.dailyNotes[date]
    }
    noticeData.value = { ...noticeData.value, dailyNotes: { ...noticeData.value.dailyNotes } }
    addLog('notice', 'update', `更新 ${formatDate(date)} 备注`)
    void syncNotice()
  }

  /** 切换物资勾选 */
  const toggleInventoryItem = (itemId: string) => {
    if (!canEdit.value) return
    const item = noticeData.value.inventory.find((i) => i.id === itemId)
    if (item) {
      item.checked = !item.checked
      noticeData.value = {
        ...noticeData.value,
        inventory: [...noticeData.value.inventory],
      }
      void syncNotice()
    }
  }

  /** 新增物资项 */
  const addInventoryItem = (item: NoticeData['inventory'][number]) => {
    if (!canEdit.value) return
    noticeData.value.inventory.push(item)
    noticeData.value = {
      ...noticeData.value,
      inventory: [...noticeData.value.inventory],
    }
    addLog('notice', 'create', `新增物资：${item.name}`)
    void syncNotice()
  }

  /** 删除物资项 */
  const deleteInventoryItem = (itemId: string) => {
    if (!canEdit.value) return
    const target = noticeData.value.inventory.find((i) => i.id === itemId)
    noticeData.value.inventory = noticeData.value.inventory.filter((i) => i.id !== itemId)
    noticeData.value = {
      ...noticeData.value,
      inventory: [...noticeData.value.inventory],
    }
    if (target) addLog('notice', 'delete', `删除物资：${target.name}`)
    void syncNotice()
  }

  // ============================
  // Actions - 留言板
  // ============================

  const sendMessage = (content: string) => {
    if (!currentUser.value || !content.trim()) return
    const msg: ChatMessage = {
      id: generateId(),
      senderId: currentUser.value.id,
      senderName: currentUser.value.nickname,
      senderColor: currentUser.value.color,
      content: content.trim(),
      createdAt: Date.now(),
    }
    messages.value = [...messages.value, msg]
    addLog('chat', 'create', `留言：${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`)
    void (async () => {
      if (!currentUser.value) return
      const ok = await appendChatMessage(msg, messages.value, currentUser.value.nickname)
      if (!ok && isOnline.value) {
        offlineQueue.value.push({
          id: generateId(),
          type: 'message',
          payload: deepClone(msg),
          timestamp: Date.now(),
        })
      } else if (ok) {
        lastSyncAt.value = Date.now()
      }
    })()
  }

  // ============================
  // 操作日志（修改溯源）
  // ============================
  const MAX_LOG = 100
  const addLog = (
    type: ActivityLog['type'],
    action: ActivityLog['action'],
    description: string
  ) => {
    if (!currentUser.value) return
    activityLogs.value.unshift({
      id: generateId(),
      type,
      action,
      description,
      operator: currentUser.value.nickname,
      operatorColor: currentUser.value.color,
      timestamp: Date.now(),
    })
    // 限制日志数量
    if (activityLogs.value.length > MAX_LOG) {
      activityLogs.value = activityLogs.value.slice(0, MAX_LOG)
    }
  }

  // ============================
  // 生命周期：页面关闭前保存本地
  // ============================
  const beforeUnload = () => {
    saveToLocal()
    unsubscribeRealtime()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', beforeUnload)
  }

  return {
    // State
    currentUser,
    isEditorMode,
    tripStartDate,
    tripEndDate,
    schedules,
    orders,
    noticeData,
    messages,
    activityLogs,
    isOnline,
    isSyncing,
    lastSyncAt,
    exchangeRates,
    // Getters
    totalTripDays,
    tripDateList,
    daySchedules,
    totalScheduleItems,
    paidOrderCount,
    pendingOrderCount,
    totalOrderAmount,
    totalOrderAmountCNY,
    packedInventoryCount,
    totalInventoryCount,
    canEdit,
    // Actions
    setCurrentUser,
    toggleEditorMode,
    touchActive,
    initData,
    saveToLocal,
    loadFromLocal,
    syncOfflineChanges,
    setOnlineStatus,
    updateTripDates,
    upsertScheduleItem,
    deleteScheduleItem,
    reorderScheduleItems,
    syncDaySchedule,
    upsertOrderItem,
    deleteOrderItem,
    updateOrderStatus,
    updateExchangeRate,
    updateExchangeRates,
    updateNoticeField,
    updateDailyNote,
    toggleInventoryItem,
    addInventoryItem,
    deleteInventoryItem,
    sendMessage,
  }
},
{
  // Pinia 持久化：用户信息存本地，其他数据通过 saveToLocal 精细控制
  persist: {
    key: STORAGE_KEYS.USER,
    paths: ['currentUser', 'isEditorMode', 'tripStartDate', 'tripEndDate'],
  },
})
