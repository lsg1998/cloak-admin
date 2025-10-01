<template>
  <div class="performance-logs-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.search"
            placeholder="搜索页面URL、IP地址、页面标识"
            clearable
            style="width: 300px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.device_type" placeholder="选择设备类型" clearable style="width: 120px">
            <el-option label="桌面端" value="desktop" />
            <el-option label="移动端" value="mobile" />
            <el-option label="平板" value="tablet" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息卡片 -->
    <el-card class="stats-card" shadow="never" v-if="statsData">
      <template #header>
        <div class="stats-header">
          <span>性能统计</span>
          <el-tag type="info" size="small"> {{ statsData.date_range.start_date }} 至 {{ statsData.date_range.end_date }} </el-tag>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statsData.basic_stats.total_requests }}</div>
            <div class="stat-label">总请求数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statsData.basic_stats.avg_fcp }}ms</div>
            <div class="stat-label">平均FCP</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statsData.basic_stats.avg_lcp }}ms</div>
            <div class="stat-label">平均LCP</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statsData.basic_stats.avg_page_load_time }}ms</div>
            <div class="stat-label">平均页面加载时间</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <span>性能日志列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" type="danger" @click="handleBatchDelete" :disabled="selectedLogs.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button size="small" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#606266' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="referrer" label="来源URL" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="url-info">
              <el-icon class="url-icon"><Link /></el-icon>
              <span>{{ getShortUrl(row.referrer) || "直接访问" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="pd_val" label="页面标识" width="150" show-overflow-tooltip />
        <el-table-column prop="device_type" label="设备类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTagFromUA(row.user_agent)" size="small">
              {{ getDeviceTypeTextFromUA(row.user_agent) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fcp" label="FCP(ms)" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPerformanceTag(row.fcp, 'fcp')" size="small">
              {{ row.fcp }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lcp" label="LCP(ms)" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getPerformanceTag(row.lcp, 'lcp')" size="small">
              {{ row.lcp }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="page_load_time" label="页面加载(ms)" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getPerformanceTag(row.page_load_time, 'load')" size="small">
              {{ row.page_load_time }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="记录时间" width="180" align="center">
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Clock /></el-icon>
              <span>{{ row.created_at }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedLogs.length > 0" class="batch-actions">
        <el-alert :title="`已选择 ${selectedLogs.length} 条日志`" type="info" show-icon :closable="false">
          <template #default>
            <div class="batch-buttons">
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="性能日志详情" width="80%" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="页面标识">{{ currentLog.pd_val }}</el-descriptions-item>
          <el-descriptions-item label="会话ID">{{ currentLog.session_id }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            <el-tag :type="getDeviceTypeTag(currentLog.device_type)">
              {{ getDeviceTypeText(currentLog.device_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="页面URL" :span="2">
            <el-link :href="currentLog.page_url" target="_blank" type="primary">
              {{ currentLog.page_url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="来源页面" :span="2">
            {{ currentLog.referrer || "直接访问" }}
          </el-descriptions-item>
          <el-descriptions-item label="语言代码">{{ currentLog.language_code }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="屏幕分辨率">{{ currentLog.screen_resolution }}</el-descriptions-item>
          <el-descriptions-item label="视口大小">{{ currentLog.viewport_size }}</el-descriptions-item>
          <el-descriptions-item label="记录时间">{{ currentLog.created_at }}</el-descriptions-item>
          <el-descriptions-item label="进入时间">{{ currentLog.enter_time }}ms</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">性能指标</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card header="网络性能">
              <el-descriptions :column="1" size="small">
                <el-descriptions-item label="DNS解析时间">{{ currentLog.dns_time }}ms</el-descriptions-item>
                <el-descriptions-item label="TCP连接时间">{{ currentLog.tcp_time }}ms</el-descriptions-item>
                <el-descriptions-item label="SSL握手时间">{{ currentLog.ssl_time }}ms</el-descriptions-item>
                <el-descriptions-item label="首字节响应时间">{{ currentLog.ttfb }}ms</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card header="页面性能">
              <el-descriptions :column="1" size="small">
                <el-descriptions-item label="DOM加载时间">{{ currentLog.dom_load_time }}ms</el-descriptions-item>
                <el-descriptions-item label="页面加载时间">{{ currentLog.page_load_time }}ms</el-descriptions-item>
                <el-descriptions-item label="总加载时间">{{ currentLog.total_load_time }}ms</el-descriptions-item>
                <el-descriptions-item label="onload事件时间">{{ currentLog.onload_time }}ms</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">Web Vitals 核心指标</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-card header="FCP">
              <div class="metric-value">{{ currentLog.fcp }}ms</div>
              <div class="metric-desc">首次内容绘制</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card header="LCP">
              <div class="metric-value">{{ currentLog.lcp }}ms</div>
              <div class="metric-desc">最大内容绘制</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card header="FID">
              <div class="metric-value">{{ currentLog.fid }}ms</div>
              <div class="metric-desc">首次输入延迟</div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card header="CLS">
              <div class="metric-value">{{ currentLog.cls }}</div>
              <div class="metric-desc">累积布局偏移</div>
            </el-card>
          </el-col>
        </el-row>

        <el-divider content-position="left">用户代理信息</el-divider>
        <el-input v-model="currentLog.user_agent" type="textarea" :rows="3" readonly placeholder="用户代理信息" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="performanceLogs">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh, Delete, View, Link, Clock } from "@element-plus/icons-vue";
import {
  getPerformanceLogsApi,
  getPerformanceLogDetailApi,
  getPerformanceStatsApi,
  deletePerformanceLogApi,
  batchDeletePerformanceLogsApi,
  type PerformanceLog,
  type PerformanceLogListParams
} from "@/api/modules/performanceLogs";

// 响应式数据
const loading = ref(false);
const tableData = ref<PerformanceLog[]>([]);
const selectedLogs = ref<PerformanceLog[]>([]);
const detailDialogVisible = ref(false);
const currentLog = ref<PerformanceLog | null>(null);
const statsData = ref<any>(null);

// 搜索表单
const searchForm = reactive({
  search: "",
  device_type: "",
  start_date: "",
  end_date: ""
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
  loadStats();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    search: "",
    device_type: "",
    start_date: "",
    end_date: ""
  });
  dateRange.value = null;
  handleSearch();
};

// 日期范围变化
const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    searchForm.start_date = dates[0];
    searchForm.end_date = dates[1];
  } else {
    searchForm.start_date = "";
    searchForm.end_date = "";
  }
};

// 查看详情
const handleViewDetail = async (row: PerformanceLog) => {
  try {
    const { data } = await getPerformanceLogDetailApi(row.id);
    currentLog.value = data;
    detailDialogVisible.value = true;
  } catch (error) {
    ElMessage.error("获取日志详情失败");
  }
};

// 删除
const handleDelete = async (row: PerformanceLog) => {
  try {
    await ElMessageBox.confirm("确定要删除这条性能日志吗？", "确认删除", {
      type: "warning"
    });

    await deletePerformanceLogApi(row.id);
    ElMessage.success("删除成功");
    loadData();
    loadStats();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedLogs.value.length === 0) {
    ElMessage.warning("请选择要删除的日志");
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedLogs.value.length} 条性能日志吗？`, "确认批量删除", {
      type: "warning"
    });

    const ids = selectedLogs.value.map(log => log.id);
    await batchDeletePerformanceLogsApi(ids);
    ElMessage.success("批量删除成功");
    loadData();
    loadStats();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("批量删除失败");
    }
  }
};

// 选择变化
const handleSelectionChange = (selection: PerformanceLog[]) => {
  selectedLogs.value = selection;
};

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadData();
};

// 当前页变化
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: PerformanceLogListParams = {
      page: pagination.current,
      limit: pagination.size,
      search: searchForm.search || undefined,
      device_type: searchForm.device_type || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined
    };

    const { data } = await getPerformanceLogsApi(params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取性能日志失败");
  } finally {
    loading.value = false;
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const params = {
      start_date: searchForm.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end_date: searchForm.end_date || new Date().toISOString().split("T")[0]
    };

    const { data } = await getPerformanceStatsApi(params);
    statsData.value = data;
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
};

// 从User Agent解析设备类型
const parseDeviceTypeFromUA = (userAgent: string): string => {
  if (!userAgent || userAgent === "") {
    return "desktop";
  }

  const ua = userAgent.toLowerCase();

  // 移动设备检测
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("blackberry") ||
    ua.includes("windows phone")
  ) {
    return "mobile";
  }

  // 平板设备检测
  if (ua.includes("ipad") || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"))) {
    return "tablet";
  }

  // 桌面设备检测
  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("mac os") || ua.includes("linux") || ua.includes("x11")) {
    return "desktop";
  }

  return "desktop"; // 默认桌面端
};

// 获取设备类型标签类型（基于UA）
const getDeviceTypeTagFromUA = (userAgent: string) => {
  const deviceType = parseDeviceTypeFromUA(userAgent);
  const typeMap: Record<string, string> = {
    desktop: "primary",
    mobile: "success",
    tablet: "warning"
  };
  return typeMap[deviceType] || "info";
};

// 获取设备类型文本（基于UA）
const getDeviceTypeTextFromUA = (userAgent: string) => {
  const deviceType = parseDeviceTypeFromUA(userAgent);
  const textMap: Record<string, string> = {
    desktop: "桌面端",
    mobile: "移动端",
    tablet: "平板"
  };
  return textMap[deviceType] || "未知";
};

// 获取短URL显示
const getShortUrl = (url: string) => {
  if (!url || url === "") return "";
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    // 如果不是完整URL，直接返回原字符串
    return url.length > 30 ? url.substring(0, 30) + "..." : url;
  }
};

// 获取性能指标标签类型
const getPerformanceTag = (value: string, type: string) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "info";

  switch (type) {
    case "fcp":
      return numValue <= 1800 ? "success" : numValue <= 3000 ? "warning" : "danger";
    case "lcp":
      return numValue <= 2500 ? "success" : numValue <= 4000 ? "warning" : "danger";
    case "load":
      return numValue <= 2000 ? "success" : numValue <= 4000 ? "warning" : "danger";
    default:
      return "info";
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
  loadStats();
});
</script>

<style scoped>
.performance-logs-management {
  min-height: 100vh;
  padding: 20px;
  background: #f5f7fa;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.search-form {
  margin: 0;
}

.search-form .el-form-item {
  margin-bottom: 0;
}

/* 统计卡片 */
.stats-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 表格卡片 */
.table-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 表格内容样式 */
.url-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.url-icon {
  color: #409eff;
  font-size: 14px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  color: #909399;
  font-size: 14px;
}

/* 批量操作 */
.batch-actions {
  margin-top: 20px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 详情对话框 */
.log-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  margin-bottom: 5px;
}

.metric-desc {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}
</style>
