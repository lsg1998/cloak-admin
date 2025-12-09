<template>
  <div class="device-statistics-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>设备统计分析</h2>
      <p>根据设备类型和时间段进行详细的设备使用分析</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="时间段">
          <el-select
            v-model="filterForm.timeRange"
            placeholder="请选择时间段"
            @change="handleTimeRangeChange"
            style="width: 180px"
          >
            <el-option label="最近24小时" value="24h" />
            <el-option label="最近3天" value="3d" />
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.device" placeholder="请选择设备" clearable @change="loadData" style="width: 180px">
            <el-option label="全部设备" value="" />
            <el-option label="iOS" value="iOS" />
            <el-option label="iPad" value="iPad" />
            <el-option label="Android" value="Android" />
            <el-option label="Android Tablet" value="Android Tablet" />
            <el-option label="Windows" value="Windows" />
            <el-option label="Windows Mobile" value="Windows Mobile" />
            <el-option label="macOS" value="macOS" />
            <el-option label="Linux" value="Linux" />
            <el-option label="Mobile" value="Mobile" />
            <el-option label="其他" value="其他" />
            <el-option label="未知" value="未知" />
          </el-select>
        </el-form-item>
        <el-form-item label="时区">
          <el-select v-model="filterForm.timezone" @change="loadData" style="width: 140px">
            <el-option label="北京时间" value="Asia/Shanghai" />
            <el-option label="欧洲时间" value="Europe/Paris" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData" :loading="loading">
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

    <!-- 概览统计卡片 -->
    <div class="overview-stats">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatNumber(statistics?.total_visits || 0) }}</div>
                <div class="stat-label">总访问量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon devices">
                <el-icon><Iphone /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics?.device_count || 0 }}</div>
                <div class="stat-label">设备类型数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon peak">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatHour(statistics?.peak_hour) || "-" }}</div>
                <div class="stat-label">峰值时段</div>
                <div class="stat-sub">{{ statistics?.peak_count || 0 }}次访问</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon avg">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics?.avg_visits_per_hour || 0 }}</div>
                <div class="stat-label">平均每小时</div>
                <div class="stat-sub">访问量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 设备趋势图 -->
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span>{{ getTimeRangeLabel() }}设备访问趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 设备分布饼图 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>设备类型分布</span>
          </template>
          <div ref="deviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">设备详细数据</span>
        </div>
      </template>
      <el-table :data="statistics?.device_stats || []" v-loading="loading" border>
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <el-tag v-if="$index === 0" type="danger" size="small">{{ $index + 1 }}</el-tag>
            <el-tag v-else-if="$index === 1" type="warning" size="small">{{ $index + 1 }}</el-tag>
            <el-tag v-else-if="$index === 2" type="success" size="small">{{ $index + 1 }}</el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备类型" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getDeviceTagType(row.device)" size="small">{{ row.device }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问量" width="120" align="right">
          <template #default="{ row }">
            <span class="visit-count">{{ formatNumber(row.count) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" width="200">
          <template #default="{ row }">
            <div class="percentage-cell">
              <el-progress :percentage="getPercentage(row.count)" :stroke-width="10" />
              <span class="percentage-text">{{ getPercentage(row.count) }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="DeviceStatisticsPage">
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, Monitor, Iphone, TrendCharts, DataAnalysis } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getDeviceStatisticsApi, type DeviceStatistics } from "@/api/modules/statistics";

// 筛选表单
const filterForm = reactive({
  timeRange: "24h",
  device: "",
  timezone: "Asia/Shanghai"
});

// 加载状态
const loading = ref(false);

// 统计数据
const statistics = ref<DeviceStatistics | null>(null);

// 图表引用
const trendChartRef = ref<HTMLElement>();
const deviceChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let deviceChart: echarts.ECharts | null = null;

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return "0";
  return num.toLocaleString();
};

// 格式化小时
const formatHour = (hour: number | null | undefined) => {
  if (hour === null || hour === undefined) return null;
  return `${hour.toString().padStart(2, "0")}:00`;
};

// 获取时间段标签
const getTimeRangeLabel = () => {
  const labels: Record<string, string> = {
    "24h": "24小时",
    "3d": "最近3天",
    week: "本周",
    month: "本月",
    "7d": "最近7天",
    "30d": "最近30天"
  };
  return labels[filterForm.timeRange] || "设备";
};

// 获取设备标签类型
const getDeviceTagType = (device: string) => {
  const typeMap: Record<string, string> = {
    iOS: "danger",
    iPad: "warning",
    Android: "success",
    "Android Tablet": "success",
    Windows: "primary",
    "Windows Mobile": "primary",
    macOS: "info",
    Linux: "",
    Mobile: "success",
    其他: "",
    未知: ""
  };
  return typeMap[device] || "";
};

// 获取占比
const getPercentage = (count: number) => {
  if (!statistics.value || !statistics.value.total_visits) return 0;
  return Math.round((count / statistics.value.total_visits) * 100);
};

// 时间范围变化处理
const handleTimeRangeChange = () => {
  loadData();
};

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value || !statistics.value) return;

  trendChart = echarts.init(trendChartRef.value);

  const isHourly = filterForm.timeRange === "24h" || filterForm.timeRange === "3d";
  const data = isHourly ? statistics.value.hourly_stats : statistics.value.daily_stats;
  const labels = data.map(item => (isHourly ? item.label : item.date));
  const counts = data.map(item => item.count);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>访问量: ${formatNumber(param.value)}`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        rotate: isHourly ? 0 : 45,
        interval: isHourly ? (filterForm.timeRange === "24h" ? 2 : 0) : 0
      }
    },
    yAxis: {
      type: "value",
      name: "访问量"
    },
    series: [
      {
        name: "访问量",
        type: "line",
        data: counts,
        smooth: true,
        itemStyle: {
          color: "#67C23A"
        },
        lineStyle: {
          color: "#67C23A",
          width: 2
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(103, 194, 58, 0.3)"
              },
              {
                offset: 1,
                color: "rgba(103, 194, 58, 0.1)"
              }
            ]
          }
        }
      }
    ]
  };

  trendChart.setOption(option);
  window.addEventListener("resize", handleResize);
};

// 初始化设备分布图表
const initDeviceChart = () => {
  if (!deviceChartRef.value || !statistics.value || !statistics.value.device_stats.length) return;

  deviceChart = echarts.init(deviceChartRef.value);

  const deviceData = statistics.value.device_stats.slice(0, 10).map(item => ({
    value: item.count,
    name: item.device
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const percentage = ((params.value / statistics.value!.total_visits) * 100).toFixed(1);
        return `${params.name}<br/>访问量: ${formatNumber(params.value)}<br/>占比: ${percentage}%`;
      }
    },
    legend: {
      orient: "vertical",
      left: "left",
      top: "middle",
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: "设备类型",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        },
        data: deviceData
      }
    ]
  };

  deviceChart.setOption(option);
  window.addEventListener("resize", handleResize);
};

// 处理窗口大小变化
const handleResize = () => {
  if (trendChart) {
    trendChart.resize();
  }
  if (deviceChart) {
    deviceChart.resize();
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getDeviceStatisticsApi({
      timeRange: filterForm.timeRange,
      device: filterForm.device || undefined,
      timezone: filterForm.timezone
    });

    if (response.code === 200) {
      statistics.value = response.data;

      // 等待DOM更新后初始化图表
      await nextTick();
      if (trendChart) {
        trendChart.dispose();
      }
      if (deviceChart) {
        deviceChart.dispose();
      }
      initTrendChart();
      initDeviceChart();
    }
  } catch (error) {
    console.error("加载设备统计数据失败:", error);
    ElMessage.error("加载设备统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const handleReset = () => {
  filterForm.timeRange = "24h";
  filterForm.device = "";
  filterForm.timezone = "Asia/Shanghai";
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
});

// 清理
onUnmounted(() => {
  if (trendChart) {
    trendChart.dispose();
  }
  if (deviceChart) {
    deviceChart.dispose();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.device-statistics-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 0;
}

/* 概览统计卡片 */
.overview-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 28px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.devices {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.peak {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.avg {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 2px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 350px;
  width: 100%;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.visit-count {
  color: #67c23a;
  font-weight: 500;
}

.percentage-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage-text {
  font-size: 12px;
  color: #909399;
  min-width: 40px;
}
</style>
