<template>
  <el-card class="traffic-statistics-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>流量统计</span>
        <div class="header-actions">
          <el-select v-model="timezone" size="small" @change="handleTimezoneChange" style="width: 140px; margin-right: 8px">
            <el-option label="北京时间" value="Asia/Shanghai" />
            <el-option label="欧洲时间" value="Europe/Paris" />
          </el-select>
          <el-select v-model="timeRange" size="small" @change="handleTimeRangeChange" style="width: 120px">
            <el-option label="最近24小时" value="24h" />
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
          </el-select>
          <el-button type="primary" size="small" @click="loadData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="traffic-content">
      <!-- 流量趋势图 -->
      <div class="hourly-chart">
        <div class="section-title">
          <span>
            {{ timeRange === "24h" ? "24小时" : timeRange === "7d" ? "7天" : "30天" }}流量趋势
            <span class="timezone-label">({{ timezone === "Asia/Shanghai" ? "北京时间" : "欧洲时间" }})</span>
          </span>
          <span class="stats-inline">
            <span class="total-visits-inline">总访问量：{{ trafficData.total_visits || 0 }}</span>
            <span v-if="trafficData.peak_hour !== undefined" class="peak-inline">
              峰值时段：{{ formatHour(trafficData.peak_hour) }} ({{ trafficData.peak_count }}次访问)
            </span>
          </span>
        </div>
        <div ref="hourlyChartRef" class="chart-container"></div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getTrafficStatisticsApi, type TrafficStatistics } from "@/api/modules/statistics";

// 响应式数据
const loading = ref(false);
const timeRange = ref("24h");
const timezone = ref("Asia/Shanghai"); // 默认北京时间
const trafficData = ref<TrafficStatistics>({
  total_visits: 0,
  source_stats: [],
  hourly_stats: [],
  daily_stats: [],
  peak_hour: 0,
  peak_count: 0,
  low_hour: null,
  low_count: 0
});

// 图表引用
const hourlyChartRef = ref<HTMLElement>();
let hourlyChart: echarts.ECharts | null = null;

// 格式化小时
const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, "0")}:00`;
};

// 初始化24小时流量图表
const initHourlyChart = () => {
  if (!hourlyChartRef.value) return;

  hourlyChart = echarts.init(hourlyChartRef.value);

  const hours = trafficData.value.hourly_stats.map(item => item.label);
  const counts = trafficData.value.hourly_stats.map(item => item.count);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>访问量: ${param.value}`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: hours,
      axisLabel: {
        rotate: 45,
        interval: timeRange.value === "24h" ? 2 : 0 // 24小时每2小时显示一个标签，其他全部显示
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
          color: "#409EFF"
        },
        lineStyle: {
          color: "#409EFF",
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
                color: "rgba(64, 158, 255, 0.3)"
              },
              {
                offset: 1,
                color: "rgba(64, 158, 255, 0.1)"
              }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            color: "#66b1ff"
          }
        }
      }
    ]
  };

  hourlyChart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", handleResize);
};

// 处理窗口大小变化
const handleResize = () => {
  if (hourlyChart) {
    hourlyChart.resize();
  }
};

// 时区变化处理
const handleTimezoneChange = () => {
  loadData();
};

// 时间范围变化处理
const handleTimeRangeChange = () => {
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getTrafficStatisticsApi({
      timeRange: timeRange.value,
      timezone: timezone.value
    });
    if (response.code === 200) {
      trafficData.value = response.data;

      // 等待DOM更新后初始化图表
      await nextTick();
      if (hourlyChart) {
        hourlyChart.dispose();
      }
      initHourlyChart();
    }
  } catch (error) {
    console.error("加载流量统计数据失败:", error);
    ElMessage.error("加载流量统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  loadData();
});

// 清理
onUnmounted(() => {
  if (hourlyChart) {
    hourlyChart.dispose();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.traffic-statistics-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.traffic-content {
  min-height: 300px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.timezone-label {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  margin-left: 8px;
}

.stats-inline {
  display: flex;
  gap: 16px;
  font-size: 14px;
  font-weight: 400;
  color: #606266;
}

.total-visits-inline {
  color: #409eff;
}

.peak-inline {
  color: #409eff;
}

.chart-container {
  height: 220px;
  width: 100%;
}
</style>
