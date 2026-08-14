// ================================
// 页面视图：出行须知（全局/安全须知 + 物资清单）
// ================================
<script setup lang="ts">
import { computed, ref } from "vue";
import { useTripStore } from "@/stores/trip";
import type { InventoryItem, NoticeData } from "@/types";
import { INVENTORY_CATEGORIES } from "@/utils/constants";
import { generateId } from "@/utils";
import {
  IconInfo,
  IconShield,
  IconPackage,
  IconPlus,
  IconTrash,
  IconCheck,
  IconAlert,
} from "@/components/icons";

const store = useTripStore();

// 当前激活 Tab
type TabKey = "global" | "safety" | "inventory";
const activeTab = ref<TabKey>("global");

// 物资清单筛选
const filterCategory = ref<(typeof INVENTORY_CATEGORIES)[number] | "全部">(
  "全部",
);
const filterOwner = ref<"全部" | "共用" | string>("全部");
const filterChecked = ref<"全部" | "已备齐" | "未备齐">("全部");

// 新增物资表单
const showAddItem = ref(false);
const newItemName = ref("");
const newItemCategory = ref<(typeof INVENTORY_CATEGORIES)[number]>("证件");
const newItemOwner = ref<string>("共用");
const newItemQuantity = ref(1);

// 全局须知配置字段
interface FieldDef {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
  cardColor: string;
  stickerColor: string;
}

const globalFields: FieldDef[] = [
  {
    key: "entryCustoms",
    label: "入境禁忌 & 海关申报",
    icon: "🛃",
    placeholder: "禁止携带物品、申报要求、免税额度...",
    cardColor: "trip-card--pink",
    stickerColor: "title-sticker--pink",
  },
  {
    key: "trafficRules",
    label: "交通规则（靠左行驶）",
    icon: "🚗",
    placeholder: "让行规则、限速、酒驾规定、山路驾驶...",
    cardColor: "trip-card--mint",
    stickerColor: "title-sticker--mint",
  },
  {
    key: "paymentNetwork",
    label: "支付 & 网络",
    icon: "💳",
    placeholder: "信用卡、电话卡、WiFi覆盖...",
    cardColor: "trip-card--lemon",
    stickerColor: "title-sticker--lemon",
  },
  {
    key: "emergencyContact",
    label: "紧急联系电话",
    icon: "📞",
    placeholder: "报警/急救、大使馆、道路救援、旅游投诉...",
    cardColor: "trip-card--sky",
    stickerColor: "title-sticker--sky",
  },
  {
    key: "campingRules",
    label: "露营规范",
    icon: "⛺",
    placeholder: "DOC营地预订、自由露营限制、环保要求...",
    cardColor: "trip-card--grape",
    stickerColor: "title-sticker--grape",
  },
];

const safetyFields: FieldDef[] = [
  {
    key: "hiking",
    label: "徒步安全须知",
    icon: "🥾",
    placeholder: "DOC难度、装备要求、路线规划、紧急预案...",
    cardColor: "trip-card--pink",
    stickerColor: "title-sticker--pink",
  },
  {
    key: "glacier",
    label: "冰川活动须知",
    icon: "🧊",
    placeholder: "跟团要求、装备准备、冰缝风险...",
    cardColor: "trip-card--sky",
    stickerColor: "title-sticker--sky",
  },
  {
    key: "tide",
    label: "潮汐注意事项",
    icon: "🌊",
    placeholder: "潮汐查询、海边安全、涨潮速度...",
    cardColor: "trip-card--lemon",
    stickerColor: "title-sticker--lemon",
  },
  {
    key: "wildlife",
    label: "野生动物注意",
    icon: "🦭",
    placeholder: "海豹/企鹅距离、喂食禁令、沙蝇防护...",
    cardColor: "trip-card--mint",
    stickerColor: "title-sticker--mint",
  },
  {
    key: "temperature",
    label: "南北岛温差防护",
    icon: "🌡️",
    placeholder: "季节温度、洋葱穿衣、山区天气突变...",
    cardColor: "trip-card--grape",
    stickerColor: "title-sticker--grape",
  },
];

// 保存字段（防抖内联处理）
const saveGlobal = (key: string, value: string) => {
  store.updateNoticeField("globalNotices", key, value);
};

const saveSafety = (key: string, value: string) => {
  store.updateNoticeField("safetyTips", key, value);
};

// 物资分类筛选
const inventoryOwners = computed(() => {
  const set = new Set<string>(["共用"]);
  store.noticeData.inventory.forEach((i) => {
    if (i.owner !== "共用") set.add(i.owner);
  });
  return Array.from(set);
});

const filteredInventory = computed(() => {
  return store.noticeData.inventory.filter((i) => {
    if (filterCategory.value !== "全部" && i.category !== filterCategory.value)
      return false;
    if (filterOwner.value !== "全部" && i.owner !== filterOwner.value)
      return false;
    if (filterChecked.value === "已备齐" && !i.checked) return false;
    if (filterChecked.value === "未备齐" && i.checked) return false;
    return true;
  });
});

// 按分类分组显示
const groupedInventory = computed(() => {
  const groups: Record<string, InventoryItem[]> = {};
  INVENTORY_CATEGORIES.forEach((c) => (groups[c] = []));
  filteredInventory.value.forEach((i) => {
    if (!groups[i.category]) groups[i.category] = [];
    groups[i.category].push(i);
  });
  return Object.entries(groups).filter(([, list]) => list.length > 0);
});

const progressPercent = computed(() => {
  const total = store.noticeData.inventory.length;
  if (total === 0) return 0;
  return Math.round((store.packedInventoryCount / total) * 100);
});

// 物资分类胶带/卡片颜色映射
const inventoryCatColors: Record<
  string,
  { card: string; sticker: string; emoji: string }
> = {
  证件: {
    card: "trip-card--pink",
    sticker: "sticker-badge--pink",
    emoji: "📄",
  },
  衣物: {
    card: "trip-card--mint",
    sticker: "sticker-badge--mint",
    emoji: "👕",
  },
  电子: {
    card: "trip-card--sky",
    sticker: "sticker-badge--sky",
    emoji: "📱",
  },
  洗漱: {
    card: "trip-card--lemon",
    sticker: "sticker-badge--lemon",
    emoji: "🧴",
  },
  药品: {
    card: "trip-card--grape",
    sticker: "sticker-badge--grape",
    emoji: "💊",
  },
  户外: {
    card: "trip-card--pink",
    sticker: "sticker-badge--peach",
    emoji: "🏔️",
  },
  其他: {
    card: "trip-card--mint",
    sticker: "sticker-badge--sky",
    emoji: "📦",
  },
};

const addInventoryItem = () => {
  if (!newItemName.value.trim()) return;
  const item: InventoryItem = {
    id: generateId(),
    name: newItemName.value.trim(),
    category: newItemCategory.value,
    owner: newItemOwner.value,
    quantity: Math.max(1, Number(newItemQuantity.value) || 1),
    checked: false,
  };
  store.addInventoryItem(item);
  // 重置
  newItemName.value = "";
  newItemQuantity.value = 1;
  showAddItem.value = false;
};
</script>
<template>
  <div class="space-y-5 md:space-y-6" id="notice-view">
    <!-- ===== 页面标题 ===== -->
    <div class="page-header">
      <div>
        <h1 class="page-title">📋 注意事项 & 物资清单</h1>
        <p class="page-subtitle">~ 出行须知逐条确认 · 物资清单打包不漏 ~</p>
      </div>
    </div>
    <!-- ===== Tab 切换：贴纸风 ===== -->
    <div
      class="trip-card trip-card--lemon p-2 md:p-3 flex gap-1.5 md:gap-2 pt-6 relative flex-wrap"
    >
      <button
        type="button"
        class="flex-1 min-w-[100px] py-2.5 md:py-3 px-2 md:px-4 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sticker-hover"
        :class="
          activeTab === 'global'
            ? 'bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sticker border-2 border-white'
            : 'bg-white text-ink-600 border-2 border-dashed border-ink-200/40 hover:border-primary-300 hover:bg-primary-50/50'
        "
        @click="activeTab = 'global'"
      >
        <IconInfo :size="16" /> 全局须知
      </button>
      <button
        type="button"
        class="flex-1 min-w-[100px] py-2.5 md:py-3 px-2 md:px-4 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sticker-hover"
        :class="
          activeTab === 'safety'
            ? 'bg-gradient-to-br from-strawberry-300 to-strawberry-500 text-white shadow-sticker border-2 border-white'
            : 'bg-white text-ink-600 border-2 border-dashed border-ink-200/40 hover:border-strawberry-300 hover:bg-strawberry-50/50'
        "
        @click="activeTab = 'safety'"
      >
        <IconShield :size="16" /> 安全须知
      </button>
      <button
        type="button"
        class="flex-1 min-w-[100px] py-2.5 md:py-3 px-2 md:px-4 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sticker-hover relative"
        :class="
          activeTab === 'inventory'
            ? 'bg-gradient-to-br from-grape-300 to-grape-500 text-white shadow-sticker border-2 border-white'
            : 'bg-white text-ink-600 border-2 border-dashed border-ink-200/40 hover:border-grape-300 hover:bg-grape-50/50'
        "
        @click="activeTab = 'inventory'"
      >
        <IconPackage :size="16" /> 物资清单
        <span
          v-if="store.totalInventoryCount > 0"
          class="absolute -top-1.5 -right-1.5"
        >
          <span
            class="sticker-badge !px-1.5 !py-0.5 !text-[9px]"
            :class="
              activeTab === 'inventory'
                ? '!bg-white !text-grape-600 !border-grape-200'
                : 'sticker-badge--grape'
            "
          >
            {{ store.packedInventoryCount }}/{{ store.totalInventoryCount }}
          </span>
        </span>
      </button>
    </div>
    <!-- ===== 只读提示 ===== -->
    <div
      v-if="!store.canEdit"
      class="sticky-note sticky-note--blue max-w-xl mx-auto !py-3 !px-4"
    >
      <div class="flex items-center gap-2 text-ink-700 text-sm">
        <IconInfo :size="16" class="text-skyblue-600 shrink-0" />
        <span>当前为只读模式，如需修改请切换至编辑模式哦~</span>
      </div>
    </div>
    <!-- ===== 全局须知：5个分类不同颜色胶带 ===== -->
    <div v-show="activeTab === 'global'" class="space-y-4 md:space-y-5">
      <div
        v-for="(f, fIdx) in globalFields"
        :key="f.key"
        :class="[
          f.cardColor,
          'trip-card p-4 md:p-5 pt-8 relative overflow-hidden',
        ]"
      >
        <!-- 标题贴纸 -->
        <div class="flex items-center gap-2.5 mb-4 flex-wrap">
          <span :class="['title-sticker text-sm md:text-base', f.stickerColor]">
            <span class="mr-1">{{ f.icon }}</span
            >{{ f.label }}
          </span>
        </div>
        <!-- 便签风格输入区 -->
        <div class="sticky-note sticky-note--mint">
          <textarea
            :value="
              (store.noticeData.globalNotices as Record<string, string>)[
                f.key
              ] || ''
            "
            :disabled="!store.canEdit"
            rows="5"
            class="textarea-base !bg-white/60 !py-2.5 text-sm"
            :class="{ 'cursor-default !bg-white/80': !store.canEdit }"
            :placeholder="
              store.canEdit ? f.placeholder : '（主人还没有填写内容哦~）'
            "
            @blur="
              (e) => saveGlobal(f.key, (e.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>
    </div>
    <!-- ===== 安全须知：5个分类不同颜色胶带 ===== -->
    <div v-show="activeTab === 'safety'" class="space-y-4 md:space-y-5">
      <div
        v-for="(f, fIdx) in safetyFields"
        :key="f.key"
        :class="[
          f.cardColor,
          'trip-card p-4 md:p-5 pt-8 relative overflow-hidden',
        ]"
        :style="{ borderLeft: fIdx === 0 ? '6px solid #fb4277' : undefined }"
      >
        <!-- 标题贴纸 -->
        <div class="flex items-center gap-2.5 mb-4 flex-wrap">
          <span :class="['title-sticker text-sm md:text-base', f.stickerColor]">
            <span class="mr-1">{{ f.icon }}</span
            >{{ f.label }}
          </span>
          <span class="sticker-badge sticker-badge--pink !text-[10px]">
            ⚠️ 请务必确认
          </span>
        </div>
        <!-- 粉色便签风格输入区 -->
        <div class="sticky-note sticky-note--pink">
          <textarea
            :value="
              (store.noticeData.safetyTips as Record<string, string>)[f.key] ||
              ''
            "
            :disabled="!store.canEdit"
            rows="4"
            class="textarea-base !bg-white/60 !py-2.5 text-sm !border-strawberry-200"
            :class="{ 'cursor-default !bg-white/80': !store.canEdit }"
            :placeholder="
              store.canEdit ? f.placeholder : '（主人还没有填写内容哦~）'
            "
            @blur="
              (e) => saveSafety(f.key, (e.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>
    </div>
    <!-- ===== 物资清单 ===== -->
    <div
      v-show="activeTab === 'inventory'"
      class="space-y-4 md:space-y-5"
      id="inventory"
    >
      <!-- 进度卡片 -->
      <div class="trip-card trip-card--grape p-5 pt-8 relative">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <span
              class="sticker-badge sticker-badge--grape text-sm mb-2 inline-block"
            >
              🎯 准备进度
            </span>
            <div class="text-xl md:text-2xl font-extrabold text-ink-800">
              {{ store.packedInventoryCount }} / {{ store.totalInventoryCount }}
              <span class="text-sm md:text-base text-ink-500 ml-2 font-normal">
                已完成 {{ progressPercent }}%
              </span>
            </div>
            <div
              v-if="progressPercent === 100"
              class="sticker-badge sticker-badge--mint mt-2"
            >
              🎉 太棒了！全部准备完成~
            </div>
          </div>
          <div
            class="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white shadow-sticker border-4 border-white"
            style="
              background: linear-gradient(135deg, #c084fc 0%, #9333ea 100%);
              box-shadow:
                0 4px 0 #7e22ce,
                0 8px 20px rgba(147, 51, 234, 0.35);
            "
          >
            <span class="text-xl md:text-2xl font-extrabold"
              >{{ progressPercent }}%</span
            >
          </div>
        </div>
        <!-- 彩虹进度条 -->
        <div
          class="h-4 bg-lemon-50 rounded-full overflow-hidden border-2 border-lemon-200"
        >
          <div
            class="h-full rounded-full transition-all duration-500 relative"
            style="
              background: linear-gradient(
                90deg,
                #fb4277 0%,
                #ffd518 33%,
                #4bb04a 66%,
                #a855f7 100%
              );
            "
            :style="{ width: `${progressPercent}%` }"
          >
            <span class="absolute right-1 top-0 text-xs">🐑</span>
          </div>
        </div>
      </div>
      <!-- 筛选 + 新增 -->
      <div class="trip-card trip-card--sky p-4 pt-7 space-y-3 relative">
        <div class="flex flex-wrap gap-2 items-center">
          <select
            v-model="filterCategory"
            class="select-base py-2 text-xs md:text-sm !w-auto min-w-[100px]"
          >
            <option value="全部">📂 全部分类</option>
            <option v-for="c in INVENTORY_CATEGORIES" :key="c" :value="c">
              {{ inventoryCatColors[c].emoji }} {{ c }}
            </option>
          </select>
          <select
            v-model="filterOwner"
            class="select-base py-2 text-xs md:text-sm !w-auto min-w-[90px]"
          >
            <option value="全部">👥 全部归属</option>
            <option v-for="o in inventoryOwners" :key="o" :value="o">
              {{ o === "共用" ? "🤝 共用" : "🧑 " + o }}
            </option>
          </select>
          <select
            v-model="filterChecked"
            class="select-base py-2 text-xs md:text-sm !w-auto min-w-[90px]"
          >
            <option value="全部">📋 全部状态</option>
            <option value="已备齐">✅ 已备齐</option>
            <option value="未备齐">⏳ 未备齐</option>
          </select>
          <div class="flex-1" />
          <button
            v-if="store.canEdit"
            type="button"
            class="btn-primary !py-2 !px-4 text-xs md:text-sm"
            @click="showAddItem = !showAddItem"
          >
            <IconPlus :size="14" /> {{ showAddItem ? "取消" : "新增物资" }}
          </button>
        </div>
        <!-- 新增表单：胶带贴纸风格 -->
        <transition name="expand">
          <div
            v-if="showAddItem && store.canEdit"
            class="sticky-note sticky-note--lemon"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center"
            >
              <input
                v-model="newItemName"
                type="text"
                class="input-base py-2 text-sm md:col-span-5 !bg-white/80"
                placeholder="📝 物品名称，如：冲锋衣"
                @keyup.enter="addInventoryItem"
              />
              <select
                v-model="newItemCategory"
                class="select-base py-2 text-sm md:col-span-2 !bg-white/80"
              >
                <option v-for="c in INVENTORY_CATEGORIES" :key="c" :value="c">
                  {{ inventoryCatColors[c].emoji }} {{ c }}
                </option>
              </select>
              <input
                v-model="newItemOwner"
                type="text"
                class="input-base py-2 text-sm md:col-span-2 !bg-white/80"
                placeholder="👤 共用/人名"
              />
              <input
                v-model.number="newItemQuantity"
                type="number"
                min="1"
                class="input-base py-2 text-sm md:col-span-1 !bg-white/80 text-center"
                placeholder="x1"
              />
              <button
                type="button"
                class="btn-primary py-2 text-sm md:col-span-2"
                @click="addInventoryItem"
                :disabled="!newItemName.trim()"
              >
                <IconCheck :size="14" /> 添加 ✨
              </button>
            </div>
          </div>
        </transition>
      </div>
      <!-- 空状态 -->
      <div
        v-if="filteredInventory.length === 0"
        class="trip-card trip-card--mint p-8 md:p-10 text-center pt-10 relative"
      >
        <div class="sticky-note sticky-note--pink mx-auto max-w-sm py-6">
          <div class="text-5xl mb-2 opacity-80">🎒</div>
          <p class="text-ink-700 text-sm">
            {{
              store.noticeData.inventory.length === 0
                ? "还没有任何物资呢~ 点击「新增物资」开始准备吧！"
                : "当前筛选条件下没有物资哦~"
            }}
          </p>
        </div>
      </div>
      <!-- 分组列表：每个分类一个手风琴卡片 -->
      <div
        v-for="[cat, list] in groupedInventory"
        :key="cat"
        :class="[
          inventoryCatColors[cat].card,
          'trip-card p-0 pt-6 relative overflow-hidden',
        ]"
      >
        <!-- 分类标题 -->
        <div
          class="flex items-center justify-between px-4 md:px-5 py-3 border-b-2 border-dashed border-ink-100/60"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <span
              :class="[
                'sticker-badge !px-3 !py-1  text-sm',
                inventoryCatColors[cat].sticker,
              ]"
            >
              <span class="mr-1">{{ inventoryCatColors[cat].emoji }}</span
              >{{ cat }}
            </span>
          </div>
          <span
            class="sticker-badge sticker-badge--lemon !px-2 !py-0.5 !text-[10px]"
          >
            ✅ {{ list.filter((i) => i.checked).length }} / {{ list.length }}
          </span>
        </div>
        <!-- 物资条目 -->
        <div class="divide-y divide-dashed divide-ink-100">
          <div
            v-for="(item, iIdx) in list"
            :key="item.id"
            class="flex items-center gap-3 p-3 md:p-4 hover:bg-white/60 transition-colors group"
          >
            <!-- 勾选框：草莓色圆形贴纸风格 -->
            <button
              type="button"
              class="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
              :class="
                item.checked
                  ? 'bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sticker-sm border-2 border-white scale-90'
                  : 'bg-white border-[3px] border-dashed border-strawberry-300 text-transparent hover:border-strawberry-500 hover:bg-strawberry-50 shadow-sticker-sm'
              "
              :disabled="!store.canEdit"
              @click="store.toggleInventoryItem(item.id)"
            >
              <IconCheck v-if="item.checked" :size="18" :stroke-width="3" />
            </button>
            <!-- 名称 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <div
                  class="text-sm md:text-base font-bold"
                  :class="
                    item.checked
                      ? 'text-ink-400 line-through decoration-2 decoration-strawberry-400'
                      : 'text-ink-800'
                  "
                >
                  {{ item.name }}
                </div>
                <span
                  v-if="item.quantity > 1"
                  class="sticker-badge sticker-badge--sky !px-2 !py-0.5 !text-[10px]"
                >
                  ×{{ item.quantity }}
                </span>
                <!-- 完成贴纸 -->
                <span
                  v-if="item.checked"
                  class="sticker-badge sticker-badge--mint !px-2 !py-0.5 !text-[10px]"
                >
                  ✅ 已备齐
                </span>
              </div>
              <div
                class="mt-1 flex items-center gap-2 text-[11px] text-ink-500"
              >
                <span
                  :class="[
                    'sticker-badge !px-2 !py-0.5 !text-[10px] ',
                    item.owner === '共用'
                      ? 'sticker-badge--grape'
                      : 'sticker-badge--sky',
                  ]"
                >
                  {{ item.owner === "共用" ? "🤝" : "👤" }} {{ item.owner }}
                </span>
              </div>
            </div>

            <!-- 删除 -->
            <button
              v-if="store.canEdit"
              type="button"
              class="btn-ghost !p-1.5 text-ink-300 hover:text-strawberry-500 hover:bg-strawberry-50 opacity-0 group-hover:opacity-100 transition-all"
              @click="store.deleteInventoryItem(item.id)"
            >
              <IconTrash :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
}
</style>
