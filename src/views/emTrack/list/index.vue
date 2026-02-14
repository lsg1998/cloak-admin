<template>
  <div class="em-track-management">
    <!-- 汇总统计卡片 -->
    <div class="summary-cards">
      <el-card class="summary-card" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.total_em_params }}</div>
          <div class="summary-label">EM账号总数</div>
        </div>
      </el-card>
      <el-card class="summary-card success" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.em_with_orders }}</div>
          <div class="summary-label">有订单</div>
        </div>
      </el-card>
      <el-card class="summary-card danger" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.em_without_orders }}</div>
          <div class="summary-label">无订单</div>
        </div>
      </el-card>
      <el-card class="summary-card primary" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.total_orders }}</div>
          <div class="summary-label">总订单数</div>
        </div>
      </el-card>
      <el-card class="summary-card info" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.total_visitors }}</div>
          <div class="summary-label">总访客数</div>
        </div>
      </el-card>
      <el-card class="summary-card warning" shadow="hover">
        <div class="summary-item">
          <div class="summary-value">{{ summary.order_rate }}%</div>
          <div class="summary-label">出单率</div>
        </div>
      </el-card>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            style="width: 280px"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="EM参数">
          <el-input
            v-model="searchForm.em_param"
            placeholder="搜索EM参数"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="出单状态">
          <el-select v-model="searchForm.has_order" placeholder="全部" clearable style="width: 130px">
            <el-option label="有订单" value="yes" />
            <el-option label="无订单" value="no" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        :row-class-name="getRowClassName"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="#" width="50" align="center" />

        <el-table-column label="EM参数(账号)" min-width="220" align="center">
          <template #default="{ row }">
            <div class="em-param-cell">
              <el-tag
                :class="row.has_order ? 'em-tag-success' : 'em-tag-danger'"
                :effect="row.has_order ? 'dark' : 'light'"
                size="default"
              >
                <el-icon><User /></el-icon>
                {{ row.em_param }}
              </el-tag>
              <div v-if="row.account_name" class="account-name">
                <el-tag size="small" type="warning" effect="plain">
                  {{ row.account_name }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="出单状态" width="110" align="center" sortable="custom" prop="has_order">
          <template #default="{ row }">
            <el-tag v-if="row.has_order" type="success" effect="dark" size="default">
              <el-icon><CircleCheck /></el-icon>
              有订单
            </el-tag>
            <el-tag v-else type="danger" effect="plain" size="default">
              <el-icon><CircleClose /></el-icon>
              无订单
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="访客数" width="100" align="center" sortable="custom" prop="visitor_count">
          <template #default="{ row }">
            <span class="count-badge visitor">{{ row.visitor_count }}</span>
          </template>
        </el-table-column>

        <el-table-column label="订单数" width="100" align="center" sortable="custom" prop="order_count">
          <template #default="{ row }">
            <span v-if="row.order_count > 0" class="count-badge order">{{ row.order_count }}</span>
            <span v-else class="count-badge zero">0</span>
          </template>
        </el-table-column>

        <el-table-column label="订单金额" width="140" align="center" sortable="custom" prop="total_amount">
          <template #default="{ row }">
            <div v-if="row.has_order" class="amount-cell">
              <span class="amount">{{ row.total_amount }}</span>
              <span class="currency">{{ row.currencies.join("/") }}</span>
            </div>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>

        <el-table-column label="订单号" min-width="200" align="center">
          <template #default="{ row }">
            <div v-if="row.order_numbers && row.order_numbers.length > 0" class="order-numbers-cell">
              <el-tag v-for="(num, idx) in row.order_numbers.slice(0, 3)" :key="idx" size="small" type="info" style="margin: 2px">
                {{ num }}
              </el-tag>
              <el-tag v-if="row.order_numbers.length > 3" size="small" type="warning" style="margin: 2px">
                +{{ row.order_numbers.length - 3 }}
              </el-tag>
            </div>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>

        <el-table-column label="访客国家" width="140" align="center">
          <template #default="{ row }">
            <div v-if="row.countries && row.countries.length > 0" class="countries-cell">
              <el-tag
                v-for="(country, idx) in row.countries.slice(0, 5)"
                :key="idx"
                size="small"
                type="success"
                effect="plain"
                style="margin: 1px"
              >
                {{ getCountryFlag(country) }} {{ country }}
              </el-tag>
            </div>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>

        <el-table-column label="最新访问" width="170" align="center" sortable="custom" prop="latest_visit">
          <template #default="{ row }">
            <span v-if="row.latest_visit" class="time-text">{{ row.latest_visit }}</span>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.has_order" type="primary" size="small" link @click="handleViewOrders(row)">
              <el-icon><View /></el-icon>
              查看订单
            </el-button>
            <el-button type="info" size="small" link @click="handleViewVisitors(row)">
              <el-icon><User /></el-icon>
              访客
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="orderDialogVisible" :title="`${currentEmParam} - 订单详情`" width="900px" top="5vh">
      <div v-loading="orderLoading">
        <el-table :data="emOrders" border stripe size="small">
          <el-table-column prop="order_number" label="订单号" width="160" />
          <el-table-column prop="customer_name" label="客户姓名" width="120" />
          <el-table-column prop="phone" label="电话" width="140" />
          <el-table-column label="金额" width="120" align="center">
            <template #default="{ row }"> {{ row.total_amount }} {{ row.currency }} </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="product_title" label="商品" min-width="150" show-overflow-tooltip />
          <el-table-column prop="ip_address" label="IP" width="130" />
          <el-table-column prop="created_at" label="下单时间" width="170" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 访客详情弹窗 -->
    <el-dialog v-model="visitorDialogVisible" :title="`${currentEmParam} - 访客列表`" width="800px" top="5vh">
      <div v-loading="visitorLoading">
        <el-table :data="emVisitors" border stripe size="small">
          <el-table-column prop="ip_address" label="IP地址" width="140" />
          <el-table-column label="国家/地区" width="120">
            <template #default="{ row }"> {{ getCountryFlag(row.country) }} {{ row.country }} </template>
          </el-table-column>
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="city" label="城市" width="120" />
          <el-table-column prop="organization" label="ISP" min-width="150" show-overflow-tooltip />
          <el-table-column prop="visit_count" label="访问次数" width="90" align="center" />
          <el-table-column prop="first_visit" label="首次访问" width="170" />
          <el-table-column prop="last_visit" label="最后访问" width="170" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, User, CircleCheck, CircleClose, View } from "@element-plus/icons-vue";
import {
  getEmTrackListApi,
  getEmOrdersApi,
  type EmTrackItem,
  type EmTrackSummary,
  type EmTrackListParams
} from "@/api/modules/emTrack";

// ==================== 日期快捷选项 ====================
const dateShortcuts = [
  {
    text: "今天",
    value: () => {
      const today = new Date();
      return [today, today];
    }
  },
  {
    text: "昨天",
    value: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return [yesterday, yesterday];
    }
  },
  {
    text: "最近3天",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      return [start, end];
    }
  },
  {
    text: "最近7天",
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [start, end];
    }
  },
  {
    text: "本月",
    value: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return [start, end];
    }
  }
];

// ==================== 状态 ====================
const loading = ref(false);
const tableData = ref<EmTrackItem[]>([]);
const total = ref(0);
const summary = ref<EmTrackSummary>({
  total_em_params: 0,
  em_with_orders: 0,
  em_without_orders: 0,
  total_orders: 0,
  total_visitors: 0,
  order_rate: 0
});

// 今天的日期
const today = new Date().toISOString().slice(0, 10);
const dateRange = ref<string[]>([today, today]);

const searchForm = reactive<EmTrackListParams>({
  start_date: today,
  end_date: today,
  em_param: "",
  has_order: "",
  page: 1,
  size: 50
});

// 订单弹窗
const orderDialogVisible = ref(false);
const orderLoading = ref(false);
const currentEmParam = ref("");
const emOrders = ref<any[]>([]);

// 访客弹窗
const visitorDialogVisible = ref(false);
const visitorLoading = ref(false);
const emVisitors = ref<any[]>([]);

// ==================== 方法 ====================

const handleDateChange = (val: string[] | null) => {
  if (val && val.length === 2) {
    searchForm.start_date = val[0];
    searchForm.end_date = val[1];
  } else {
    searchForm.start_date = today;
    searchForm.end_date = today;
  }
  searchForm.page = 1;
  fetchData();
};

const handleSearch = () => {
  searchForm.page = 1;
  fetchData();
};

const handleReset = () => {
  dateRange.value = [today, today];
  searchForm.start_date = today;
  searchForm.end_date = today;
  searchForm.em_param = "";
  searchForm.has_order = "";
  searchForm.page = 1;
  searchForm.size = 50;
  fetchData();
};

const handleSortChange = () => {
  // 前端排序由el-table自动处理
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getEmTrackListApi(searchForm);
    if (res.data) {
      tableData.value = res.data.list || [];
      total.value = res.data.total || 0;
      summary.value = res.data.summary || summary.value;
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 查看订单详情
const handleViewOrders = async (row: EmTrackItem) => {
  currentEmParam.value = row.em_param;
  orderDialogVisible.value = true;
  orderLoading.value = true;
  try {
    const res = await getEmOrdersApi({
      em_param: row.em_param,
      start_date: searchForm.start_date,
      end_date: searchForm.end_date
    });
    if (res.data) {
      emOrders.value = res.data.orders || [];
    }
  } catch (error: any) {
    ElMessage.error("获取订单详情失败");
  } finally {
    orderLoading.value = false;
  }
};

// 查看访客列表
const handleViewVisitors = async (row: EmTrackItem) => {
  currentEmParam.value = row.em_param;
  visitorDialogVisible.value = true;
  visitorLoading.value = true;
  try {
    const res = await getEmOrdersApi({
      em_param: row.em_param,
      start_date: searchForm.start_date,
      end_date: searchForm.end_date
    });
    if (res.data) {
      emVisitors.value = res.data.visitors || [];
    }
  } catch (error: any) {
    ElMessage.error("获取访客列表失败");
  } finally {
    visitorLoading.value = false;
  }
};

// 行样式
const getRowClassName = ({ row }: { row: EmTrackItem }) => {
  return row.has_order ? "row-has-order" : "row-no-order";
};

// 状态映射
const statusLabels: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  processing: "处理中",
  shipped: "已发货",
  delivered: "已送达",
  cancelled: "已取消",
  refunded: "已退款",
  deleted: "已删除",
  duplicate: "已重复"
};

const statusTypes: Record<string, string> = {
  pending: "warning",
  confirmed: "primary",
  processing: "info",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
  deleted: "info",
  duplicate: "warning"
};

const getStatusLabel = (status: string) => statusLabels[status] || status;
const getStatusType = (status: string) => statusTypes[status] || "info";

// 国旗emoji
const countryFlags: Record<string, string> = {
  JP: "🇯🇵",
  HU: "🇭🇺",
  SK: "🇸🇰",
  CZ: "🇨🇿",
  AT: "🇦🇹",
  PL: "🇵🇱",
  ES: "🇪🇸",
  IT: "🇮🇹",
  PT: "🇵🇹",
  DE: "🇩🇪",
  FR: "🇫🇷",
  HR: "🇭🇷",
  SI: "🇸🇮",
  LT: "🇱🇹",
  LV: "🇱🇻",
  US: "🇺🇸",
  GB: "🇬🇧",
  CN: "🇨🇳",
  RO: "🇷🇴",
  BG: "🇧🇬",
  GR: "🇬🇷",
  NL: "🇳🇱",
  BE: "🇧🇪",
  SE: "🇸🇪",
  DK: "🇩🇰",
  FI: "🇫🇮",
  IE: "🇮🇪",
  EE: "🇪🇪"
};

const getCountryFlag = (code: string) => {
  if (!code) return "🌍";
  return countryFlags[code.toUpperCase()] || "🌍";
};

// ==================== 初始化 ====================
onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.em-track-management {
  padding: 16px;
}

/* 汇总卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  text-align: center;
  border-top: 3px solid #dcdfe6;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }

  &.success {
    border-top-color: #67c23a;
  }
  &.danger {
    border-top-color: #f56c6c;
  }
  &.primary {
    border-top-color: #409eff;
  }
  &.info {
    border-top-color: #909399;
  }
  &.warning {
    border-top-color: #e6a23c;
  }

  :deep(.el-card__body) {
    padding: 16px 12px;
  }
}

.summary-item {
  .summary-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
    line-height: 1.2;
  }
  .summary-label {
    font-size: 13px;
    color: #909399;
    margin-top: 6px;
  }
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px 20px 4px;
  }
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

/* 表格卡片 */
.table-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

/* EM参数单元格 */
.em-param-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.account-name {
  margin-top: 2px;
}

.em-tag-success {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold;
  font-size: 13px;

  .el-icon {
    margin-right: 4px;
  }
}

.em-tag-danger {
  border-color: #f56c6c !important;
  color: #f56c6c !important;
  font-weight: bold;
  font-size: 13px;

  .el-icon {
    margin-right: 4px;
  }
}

/* 计数徽章 */
.count-badge {
  display: inline-block;
  min-width: 36px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  text-align: center;

  &.visitor {
    background: #ecf5ff;
    color: #409eff;
  }
  &.order {
    background: #f0f9eb;
    color: #67c23a;
  }
  &.zero {
    background: #fef0f0;
    color: #f56c6c;
  }
}

/* 金额 */
.amount-cell {
  .amount {
    font-weight: bold;
    color: #303133;
    font-size: 14px;
  }
  .currency {
    margin-left: 4px;
    color: #909399;
    font-size: 12px;
  }
}

/* 订单号 */
.order-numbers-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

/* 国家 */
.countries-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

/* 时间 */
.time-text {
  font-size: 12px;
  color: #606266;
}

.no-data {
  color: #c0c4cc;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 行样式 */
:deep(.row-has-order) {
  td {
    background-color: #f0f9eb !important;
  }
}

:deep(.row-no-order) {
  td {
    background-color: #fef0f0 !important;
  }
}

/* 响应式 */
@media screen and (max-width: 1400px) {
  .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
