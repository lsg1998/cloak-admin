<template>
  <div class="customer-statistics">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">客户统计</h1>
      <p class="page-description">查看客户地区分布、购买行为等统计数据</p>
    </div>

    <!-- 时间范围选择器 -->
    <div class="date-range-selector">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="handleDateRangeChange"
        :default-value="[new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]"
      />
      <el-button type="primary" @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 基础统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(statistics?.total_customers || 0) }}</div>
          <div class="stat-label">总客户数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon new">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(statistics?.new_customers || 0) }}</div>
          <div class="stat-label">新客户数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon repeat">
          <el-icon><RefreshRight /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(statistics?.repeat_customers || 0) }}</div>
          <div class="stat-label">回头客数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon rate">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ calculateRepeatRate() }}%</div>
          <div class="stat-label">回头客比例</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 客户购买趋势图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>客户购买趋势</h3>
          <p>新客户获取趋势分析</p>
        </div>
        <div class="chart-content">
          <div ref="customerTrendChart" class="chart"></div>
        </div>
      </div>

      <!-- 客户地区分布图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>客户地区分布</h3>
          <p>按省份统计客户分布情况</p>
        </div>
        <div class="chart-content">
          <div ref="regionChart" class="chart"></div>
        </div>
      </div>

      <!-- 客户城市分布表格 -->
      <div class="chart-card full-width">
        <div class="chart-header">
          <h3>热门城市分布</h3>
          <p>客户数量最多的前10个城市</p>
        </div>
        <div class="chart-content">
          <el-table :data="statistics?.city_distribution || []" style="width: 100%">
            <el-table-column prop="province" label="省份" width="120" />
            <el-table-column prop="city" label="城市" width="120" />
            <el-table-column prop="customer_count" label="客户数量" width="100" align="center" />
            <el-table-column prop="order_count" label="订单数量" width="100" align="center" />
            <el-table-column label="客户占比" width="120" align="center">
              <template #default="{ row }">
                <span>{{ ((row.customer_count / (statistics?.total_customers || 1)) * 100).toFixed(2) }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="平均订单数" align="center">
              <template #default="{ row }">
                <span>{{ (row.order_count / row.customer_count).toFixed(1) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 客户订单频次分布图 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>客户购买频次分布</h3>
          <p>客户购买次数分布情况</p>
        </div>
        <div class="chart-content">
          <div ref="frequencyChart" class="chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { User, UserFilled, RefreshRight, TrendCharts, Refresh } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getCustomerStatisticsApi, type CustomerStatistics } from "@/api/modules/statistics";

// 响应式数据
const loading = ref(false);
const statistics = ref<CustomerStatistics | null>(null);
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  new Date().toISOString().split("T")[0]
]);

// 图表实例
const customerTrendChart = ref<HTMLElement>();
const regionChart = ref<HTMLElement>();
const frequencyChart = ref<HTMLElement>();

let customerTrendChartInstance: echarts.ECharts | null = null;
let regionChartInstance: echarts.ECharts | null = null;
let frequencyChartInstance: echarts.ECharts | null = null;

// 格式化数字
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// 计算回头客比例
const calculateRepeatRate = (): string => {
  if (!statistics.value || statistics.value.total_customers === 0) return "0.00";
  return ((statistics.value.repeat_customers / statistics.value.total_customers) * 100).toFixed(2);
};

// 处理日期范围变化
const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    dateRange.value = dates;
    fetchStatistics();
  }
};

// 刷新数据
const refreshData = () => {
  fetchStatistics();
};

// 获取统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true;
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    };

    const response = await getCustomerStatisticsApi(params);
    if (response.code === 200) {
      statistics.value = response.data;
      await nextTick();
      initCharts();
    } else {
      ElMessage.error(response.message || "获取统计数据失败");
    }
  } catch (error) {
    console.error("获取客户统计数据失败:", error);
    ElMessage.error("获取统计数据失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 初始化图表
const initCharts = () => {
  initCustomerTrendChart();
  initRegionChart();
  initFrequencyChart();
};

// 初始化客户趋势图表
const initCustomerTrendChart = () => {
  if (!customerTrendChart.value || !statistics.value) return;

  if (customerTrendChartInstance) {
    customerTrendChartInstance.dispose();
  }

  customerTrendChartInstance = echarts.init(customerTrendChart.value);

  const option = {
    title: {
      text: "新客户获取趋势",
      left: "center",
      textStyle: { fontSize: 14, color: "#333" }
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}<br/>新客户: {c}人"
    },
    xAxis: {
      type: "category",
      data: statistics.value.customer_trend.map(item => item.date),
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: "value",
      name: "新客户数"
    },
    series: [
      {
        data: statistics.value.customer_trend.map(item => item.new_customer_count),
        type: "line",
        smooth: true,
        itemStyle: { color: "#409EFF" },
        areaStyle: { color: "rgba(64, 158, 255, 0.1)" }
      }
    ],
    grid: { top: 60, right: 30, bottom: 80, left: 60 }
  };

  customerTrendChartInstance.setOption(option);
};

// 初始化地区分布图表
const initRegionChart = () => {
  if (!regionChart.value || !statistics.value) return;

  if (regionChartInstance) {
    regionChartInstance.dispose();
  }

  regionChartInstance = echarts.init(regionChart.value);

  const option = {
    title: {
      text: "客户地区分布",
      left: "center",
      textStyle: { fontSize: 14, color: "#333" }
    },
    tooltip: {
      trigger: "item",
      formatter: "{a}<br/>{b}: {c}人 ({d}%)"
    },
    series: [
      {
        name: "客户分布",
        type: "pie",
        radius: ["40%", "70%"],
        data: statistics.value.region_distribution.map(item => ({
          name: item.province,
          value: item.customer_count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  };

  regionChartInstance.setOption(option);
};

// 初始化购买频次图表
const initFrequencyChart = () => {
  if (!frequencyChart.value || !statistics.value) return;

  if (frequencyChartInstance) {
    frequencyChartInstance.dispose();
  }

  frequencyChartInstance = echarts.init(frequencyChart.value);

  const option = {
    title: {
      text: "客户购买频次分布",
      left: "center",
      textStyle: { fontSize: 14, color: "#333" }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: "{b}<br/>客户数: {c}人<br/>占比: {d}%"
    },
    xAxis: {
      type: "category",
      data: statistics.value.purchase_frequency.map(item => item.frequency_range),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: {
      type: "value",
      name: "客户数"
    },
    series: [
      {
        data: statistics.value.purchase_frequency.map(item => ({
          value: item.customer_count,
          d: item.percentage
        })),
        type: "bar",
        itemStyle: { color: "#67C23A" },
        barWidth: "60%"
      }
    ],
    grid: { top: 60, right: 30, bottom: 80, left: 60 }
  };

  frequencyChartInstance.setOption(option);
};

// 窗口大小变化时重新调整图表
const handleResize = () => {
  customerTrendChartInstance?.resize();
  regionChartInstance?.resize();
  frequencyChartInstance?.resize();
};

// 组件挂载
onMounted(() => {
  fetchStatistics();
  window.addEventListener("resize", handleResize);
});

// 组件卸载时清理
onUnmounted(() => {
  customerTrendChartInstance?.dispose();
  regionChartInstance?.dispose();
  frequencyChartInstance?.dispose();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.customer-statistics {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.date-range-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.new {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.repeat {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  padding: 20px 24px 0;
  border-bottom: 1px solid #ebeef5;
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.chart-header p {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px 0;
}

.chart-content {
  padding: 20px;
}

.chart {
  width: 100%;
  height: 350px;
}

@media (max-width: 768px) {
  .customer-statistics {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .charts-container {
    grid-template-columns: 1fr;
  }

  .date-range-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
