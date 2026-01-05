<template>
  <div class="conversion-statistics-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>转化统计</h2>
      <p>分析各商品的访问量和下单转化情况（已排除重复单和取消单）</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="时间段">
          <el-select v-model="filterForm.timeRange" placeholder="请选择时间段" @change="loadData" style="width: 180px">
            <el-option label="今天" value="today" />
            <el-option label="昨天" value="yesterday" />
            <el-option label="最近3天" value="3d" />
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
            <el-option label="最近半年" value="6m" />
            <el-option label="最近一年" value="1y" />
            <el-option label="全部" value="all" />
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
              <div class="stat-icon visitors">
                <el-icon><View /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatNumber(statistics?.total_visitors || 0) }}</div>
                <div class="stat-label">总访客数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon orders">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatNumber(statistics?.total_order_users || 0) }}</div>
                <div class="stat-label">下单用户数</div>
                <div class="stat-sub">总订单: {{ statistics?.total_orders || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon rate">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics?.overall_conversion_rate || 0 }}%</div>
                <div class="stat-label">总体转化率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon products">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics?.product_count || 0 }}</div>
                <div class="stat-label">在售商品数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">商品转化详情</span>
        </div>
      </template>
      <el-table :data="statistics?.conversion_data || []" v-loading="loading" border>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <el-tag v-if="$index === 0" type="danger" size="small">{{ $index + 1 }}</el-tag>
            <el-tag v-else-if="$index === 1" type="warning" size="small">{{ $index + 1 }}</el-tag>
            <el-tag v-else-if="$index === 2" type="success" size="small">{{ $index + 1 }}</el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="250">
          <template #default="{ row }">
            <div class="product-cell">
              <el-avatar :size="50" v-if="row.product_image" shape="square">
                <img :src="row.product_image" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="50" v-else shape="square">
                <el-icon><Goods /></el-icon>
              </el-avatar>
              <div class="product-info">
                <div class="product-title">{{ row.product_title }}</div>
                <div class="product-id">ID: {{ row.product_id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="国家" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.country" type="info" size="small">{{ row.country }}</el-tag>
            <span v-else class="no-country">-</span>
          </template>
        </el-table-column>
        <el-table-column label="访问人数" width="120" align="center">
          <template #default="{ row }">
            <span class="visitor-count">{{ formatNumber(row.visitor_count) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下单人数" width="120" align="center">
          <template #default="{ row }">
            <span class="order-count">{{ formatNumber(row.order_count) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单数" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.total_orders }}</span>
          </template>
        </el-table-column>
        <el-table-column label="转化率" width="180">
          <template #default="{ row }">
            <div class="rate-cell">
              <el-progress
                :percentage="Math.min(row.conversion_rate, 100)"
                :stroke-width="12"
                :color="getProgressColor(row.conversion_rate)"
              />
              <span class="rate-text">{{ row.conversion_rate }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="ConversionStatisticsPage">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, View, ShoppingCart, TrendCharts, Goods } from "@element-plus/icons-vue";
import { getConversionStatisticsApi, type ConversionStatistics } from "@/api/modules/statistics";

// 筛选表单
const filterForm = reactive({
  timeRange: "today",
  timezone: "Asia/Shanghai"
});

// 加载状态
const loading = ref(false);

// 统计数据
const statistics = ref<ConversionStatistics | null>(null);

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return "0";
  return num.toLocaleString();
};

// 获取进度条颜色
const getProgressColor = (rate: number) => {
  if (rate >= 10) return "#67C23A";
  if (rate >= 5) return "#E6A23C";
  return "#F56C6C";
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getConversionStatisticsApi({
      timeRange: filterForm.timeRange,
      timezone: filterForm.timezone
    });

    if (response.code === 200) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error("加载转化统计数据失败:", error);
    ElMessage.error("加载转化统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const handleReset = () => {
  filterForm.timeRange = "today";
  filterForm.timezone = "Asia/Shanghai";
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.conversion-statistics-page {
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

.stat-icon.visitors {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.products {
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

/* 商品单元格 */
.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.visitor-count {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

.order-count {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-text {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 50px;
}

.no-country {
  color: #c0c4cc;
}
</style>
