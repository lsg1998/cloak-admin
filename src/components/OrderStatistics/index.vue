<template>
  <div class="order-statistics-component">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in statsCards" :key="stat.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span>订单趋势</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleDateChange"
                size="small"
              />
            </div>
          </template>
          <div ref="orderTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div ref="orderStatusChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近订单表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span>最近订单</span>
          <el-button type="primary" size="small" @click="$router.push('/order/list')">
            查看全部
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="recentOrders" v-loading="loading" stripe>
        <el-table-column prop="order_number" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="total_amount" label="金额" width="100" align="center">
          <template #default="{ row }">
            <span class="amount">{{ row.total_amount }} {{ row.currency }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { ShoppingCart, Money, Clock, Check, ArrowRight } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import {
  getOrderStatisticsApi,
  type OrderStatistics,
  type Order,
  OrderStatusLabels,
  OrderStatusColors
} from "@/api/modules/order";

// 响应式数据
const loading = ref(false);
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  new Date().toISOString().slice(0, 10)
]);

// 图表引用
const orderTrendChart = ref();
const orderStatusChart = ref();

// 统计数据
const statisticsData = ref<OrderStatistics | null>(null);

// 统计卡片数据
const statsCards = reactive([
  {
    key: "total",
    label: "总订单数",
    value: "0",
    icon: ShoppingCart,
    color: "#409EFF"
  },
  {
    key: "amount",
    label: "总销售额",
    value: "¥0",
    icon: Money,
    color: "#67C23A"
  },
  {
    key: "pending",
    label: "待处理",
    value: "0",
    icon: Clock,
    color: "#E6A23C"
  },
  {
    key: "completed",
    label: "已完成",
    value: "0",
    icon: Check,
    color: "#67C23A"
  }
]);

// 最近订单数据
const recentOrders = ref<Order[]>([]);

// 获取状态类型
const getStatusType = (status: string) => {
  return OrderStatusColors[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string) => {
  return OrderStatusLabels[status] || status;
};

// 更新统计卡片数据
const updateStatsCards = (data: OrderStatistics) => {
  statsCards[0].value = data.total_orders.toLocaleString();

  // 根据货币类型显示正确的符号
  const currencySymbol = getCurrencySymbol(data.currency);
  statsCards[1].value = `${currencySymbol}${data.total_amount.toLocaleString()}`;

  statsCards[2].value = data.pending_orders.toLocaleString();
  statsCards[3].value = data.completed_orders.toLocaleString();
};

// 获取货币符号
const getCurrencySymbol = (currency: string) => {
  const symbols = {
    JPY: "¥",
    USD: "$",
    EUR: "€",
    CNY: "¥",
    GBP: "£"
  };
  return symbols[currency] || currency;
};

// 初始化订单趋势图表
const initOrderTrendChart = (data: OrderStatistics) => {
  const chart = echarts.init(orderTrendChart.value);

  const option = {
    title: {
      text: "订单趋势",
      left: "center",
      textStyle: {
        fontSize: 14,
        color: "#666"
      }
    },
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["订单数量", "销售额"],
      bottom: 0
    },
    xAxis: {
      type: "category",
      data: data.trend_data.dates
    },
    yAxis: [
      {
        type: "value",
        name: "订单数",
        position: "left"
      },
      {
        type: "value",
        name: "销售额",
        position: "right"
      }
    ],
    series: [
      {
        name: "订单数量",
        type: "line",
        data: data.trend_data.order_counts,
        smooth: true,
        itemStyle: {
          color: "#409EFF"
        }
      },
      {
        name: "销售额",
        type: "bar",
        yAxisIndex: 1,
        data: data.trend_data.amounts,
        itemStyle: {
          color: "#67C23A"
        }
      }
    ]
  };

  chart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    chart.resize();
  });
};

// 初始化订单状态分布图表
const initOrderStatusChart = (data: OrderStatistics) => {
  const chart = echarts.init(orderStatusChart.value);

  const option = {
    title: {
      text: "订单状态分布",
      left: "center",
      textStyle: {
        fontSize: 14,
        color: "#666"
      }
    },
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left"
    },
    series: [
      {
        name: "订单状态",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
            fontWeight: "bold"
          }
        },
        labelLine: {
          show: false
        },
        data: data.status_distribution.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: getStatusColor(item.status)
          }
        }))
      }
    ]
  };

  chart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    chart.resize();
  });
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors = {
    pending: "#E6A23C",
    confirmed: "#409EFF",
    processing: "#909399",
    shipped: "#67C23A",
    delivered: "#67C23A",
    cancelled: "#F56C6C",
    refunded: "#F56C6C"
  };
  return colors[status] || "#909399";
};

// 日期范围变化处理
const handleDateChange = (dates: [string, string] | null) => {
  if (dates) {
    // 重新加载数据
    loadStatistics();
  }
};

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true;
  try {
    const { data } = await getOrderStatisticsApi({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      limit: 5 // 首页只显示5条最近订单
    });

    statisticsData.value = data;
    recentOrders.value = data.recent_orders;

    // 更新统计卡片
    updateStatsCards(data);

    // 等待DOM更新后初始化图表
    await nextTick();
    initOrderTrendChart(data);
    initOrderStatusChart(data);
  } catch (error) {
    console.error("加载统计数据失败:", error);
    ElMessage.error("加载统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(async () => {
  await loadStatistics();
});
</script>

<style scoped>
.order-statistics-component {
  width: 100%;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgb(0 0 0 / 15%);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-container {
  height: 300px;
  width: 100%;
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

.amount {
  font-weight: 600;
  color: #e6a23c;
}

/* 响应式设计 */
@media (width <= 768px) {
  .chart-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
