<template>
  <div class="order-statistics">
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

    <!-- 数据表格 -->
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

<script setup lang="ts" name="OrderStatistics">
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { ShoppingCart, Money, Clock, Check, ArrowRight } from "@element-plus/icons-vue";
import * as echarts from "echarts";

// 响应式数据
const loading = ref(false);
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  new Date().toISOString().slice(0, 10)
]);

// 图表引用
const orderTrendChart = ref();
const orderStatusChart = ref();

// 统计卡片数据
const statsCards = reactive([
  {
    key: "total",
    label: "总订单数",
    value: "1,234",
    icon: ShoppingCart,
    color: "#409EFF"
  },
  {
    key: "amount",
    label: "总销售额",
    value: "¥123,456",
    icon: Money,
    color: "#67C23A"
  },
  {
    key: "pending",
    label: "待处理",
    value: "56",
    icon: Clock,
    color: "#E6A23C"
  },
  {
    key: "completed",
    label: "已完成",
    value: "1,178",
    icon: Check,
    color: "#67C23A"
  }
]);

// 最近订单数据
const recentOrders = ref([
  {
    order_number: "ORD20241201001",
    customer_name: "张三",
    total_amount: "9999.00",
    currency: "JPY",
    status: "pending",
    created_at: "2024-12-01 10:30:00"
  },
  {
    order_number: "ORD20241201002",
    customer_name: "李四",
    total_amount: "19999.00",
    currency: "JPY",
    status: "confirmed",
    created_at: "2024-12-01 11:15:00"
  },
  {
    order_number: "ORD20241201003",
    customer_name: "王五",
    total_amount: "1999.00",
    currency: "JPY",
    status: "shipped",
    created_at: "2024-12-01 14:20:00"
  }
]);

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: "warning",
    confirmed: "primary",
    processing: "info",
    shipped: "success",
    delivered: "success",
    cancelled: "danger",
    refunded: "danger"
  };
  return types[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    pending: "待确认",
    confirmed: "已确认",
    processing: "处理中",
    shipped: "已发货",
    delivered: "已送达",
    cancelled: "已取消",
    refunded: "已退款"
  };
  return texts[status] || status;
};

// 初始化订单趋势图表
const initOrderTrendChart = () => {
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
      data: ["11-25", "11-26", "11-27", "11-28", "11-29", "11-30", "12-01"]
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
        data: [12, 15, 18, 22, 25, 28, 32],
        smooth: true,
        itemStyle: {
          color: "#409EFF"
        }
      },
      {
        name: "销售额",
        type: "bar",
        yAxisIndex: 1,
        data: [120000, 150000, 180000, 220000, 250000, 280000, 320000],
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
const initOrderStatusChart = () => {
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
        data: [
          { value: 56, name: "待确认", itemStyle: { color: "#E6A23C" } },
          { value: 234, name: "已确认", itemStyle: { color: "#409EFF" } },
          { value: 178, name: "处理中", itemStyle: { color: "#909399" } },
          { value: 456, name: "已发货", itemStyle: { color: "#67C23A" } },
          { value: 310, name: "已完成", itemStyle: { color: "#67C23A" } }
        ]
      }
    ]
  };

  chart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    chart.resize();
  });
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
    // TODO: 调用API获取统计数据
    // const { data } = await getOrderStatisticsApi({
    //   start_date: dateRange.value[0],
    //   end_date: dateRange.value[1]
    // });

    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500));

    ElMessage.success("统计数据加载成功");
  } catch (error) {
    ElMessage.error("加载统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(async () => {
  await loadStatistics();

  // 等待DOM渲染完成后初始化图表
  nextTick(() => {
    initOrderTrendChart();
    initOrderStatusChart();
  });
});
</script>

<style scoped>
.order-statistics {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
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
  .order-statistics {
    padding: 10px;
  }

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
