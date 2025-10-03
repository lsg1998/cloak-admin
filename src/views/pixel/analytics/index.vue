<template>
  <div class="pixel-analytics">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>像素跟踪数据</h2>
      <p>查看各平台的像素跟踪效果和转化数据</p>
    </div>

    <!-- 时间筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filterForm.platform" placeholder="选择平台" clearable @change="handleFilterChange">
            <el-option label="全部平台" value="" />
            <el-option label="Google Ads" value="google_ads" />
            <el-option label="Facebook" value="facebook" />
            <el-option label="TikTok" value="tiktok" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品">
          <el-select v-model="filterForm.productId" placeholder="选择商品" clearable filterable @change="handleFilterChange">
            <el-option label="全部商品" value="" />
            <el-option v-for="product in productList" :key="product.id" :label="product.title" :value="product.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAnalyticsData">
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

    <!-- 概览统计 -->
    <div class="overview-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewStats.totalConversions }}</div>
                <div class="stat-label">总转化数</div>
                <div class="stat-change" :class="overviewStats.conversionChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewStats.conversionChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewStats.conversionChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon revenue">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">¥{{ formatNumber(overviewStats.totalRevenue) }}</div>
                <div class="stat-label">总收入</div>
                <div class="stat-change" :class="overviewStats.revenueChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewStats.revenueChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewStats.revenueChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon cost">
                <el-icon><CreditCard /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">¥{{ formatNumber(overviewStats.totalCost) }}</div>
                <div class="stat-label">总成本</div>
                <div class="stat-change" :class="overviewStats.costChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewStats.costChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewStats.costChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon roi">
                <el-icon><PieChart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewStats.roi }}%</div>
                <div class="stat-label">ROI</div>
                <div class="stat-change" :class="overviewStats.roiChange >= 0 ? 'positive' : 'negative'">
                  <el-icon><ArrowUp v-if="overviewStats.roiChange >= 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(overviewStats.roiChange) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 平台对比 -->
    <el-card class="platform-comparison" shadow="never">
      <template #header>
        <div class="card-header">
          <span>平台效果对比</span>
          <el-button size="small" @click="loadAnalyticsData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="platformData" stripe border>
        <el-table-column prop="platform" label="平台" width="120">
          <template #default="{ row }">
            <div class="platform-info">
              <el-avatar :size="32" :class="`platform-avatar ${row.platform}`">
                <el-icon v-if="row.platform === 'google_ads'"><Platform /></el-icon>
                <el-icon v-else-if="row.platform === 'facebook'"><Share /></el-icon>
                <el-icon v-else><Monitor /></el-icon>
              </el-avatar>
              <span class="platform-name">{{ row.platformName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="impressions" label="展示次数" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.impressions) }}
          </template>
        </el-table-column>

        <el-table-column prop="clicks" label="点击次数" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.clicks) }}
          </template>
        </el-table-column>

        <el-table-column prop="conversions" label="转化次数" width="120" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.conversions) }}
          </template>
        </el-table-column>

        <el-table-column prop="conversionRate" label="转化率" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getConversionRateType(row.conversionRate)" size="small"> {{ row.conversionRate }}% </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="cost" label="成本" width="120" align="right">
          <template #default="{ row }"> ¥{{ formatNumber(row.cost) }} </template>
        </el-table-column>

        <el-table-column prop="revenue" label="收入" width="120" align="right">
          <template #default="{ row }"> ¥{{ formatNumber(row.revenue) }} </template>
        </el-table-column>

        <el-table-column prop="roi" label="ROI" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getRoiType(row.roi)" size="small"> {{ row.roi }}% </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="cpa" label="CPA" width="120" align="right">
          <template #default="{ row }"> ¥{{ formatNumber(row.cpa) }} </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 商品效果排行 -->
    <el-card class="product-ranking" shadow="never">
      <template #header>
        <div class="card-header">
          <span>商品效果排行</span>
          <el-button size="small" @click="loadProductRanking">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="productRanking" stripe border>
        <el-table-column type="index" label="排名" width="80" align="center">
          <template #default="{ $index }">
            <el-tag v-if="$index < 3" :type="$index === 0 ? 'danger' : $index === 1 ? 'warning' : 'success'" size="small">
              {{ $index + 1 }}
            </el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar v-if="row.image_urls && row.image_urls[0]" :size="32" :src="row.image_urls[0]" shape="square" />
              <el-avatar v-else :size="32" shape="square">
                <el-icon><Picture /></el-icon>
              </el-avatar>
              <span class="product-title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="conversions" label="转化数" width="100" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.conversions) }}
          </template>
        </el-table-column>

        <el-table-column prop="revenue" label="收入" width="120" align="right">
          <template #default="{ row }"> ¥{{ formatNumber(row.revenue) }} </template>
        </el-table-column>

        <el-table-column prop="conversionRate" label="转化率" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getConversionRateType(row.conversionRate)" size="small"> {{ row.conversionRate }}% </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="roi" label="ROI" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getRoiType(row.roi)" size="small"> {{ row.roi }}% </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleViewProduct(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 趋势图表 -->
    <el-card class="trend-chart" shadow="never">
      <template #header>
        <div class="card-header">
          <span>转化趋势</span>
          <div class="chart-controls">
            <el-radio-group v-model="chartType" size="small" @change="updateChart">
              <el-radio-button label="conversions">转化数</el-radio-button>
              <el-radio-button label="revenue">收入</el-radio-button>
              <el-radio-button label="roi">ROI</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div class="chart-container" ref="chartContainer">
        <div class="chart-placeholder">
          <el-icon class="chart-icon"><TrendCharts /></el-icon>
          <p>图表加载中...</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="PixelAnalytics">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Search,
  Refresh,
  TrendCharts,
  ArrowUp,
  ArrowDown,
  Money,
  CreditCard,
  PieChart,
  Platform,
  Share,
  Monitor,
  Picture,
  View
} from "@element-plus/icons-vue";
import { getProductListApi, type Product } from "@/api/modules/product";

// 响应式数据
const loading = ref(false);
const chartContainer = ref<HTMLElement>();
const chartType = ref("conversions");

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  platform: "",
  productId: ""
});

// 商品列表
const productList = ref<Product[]>([]);

// 概览统计
const overviewStats = reactive({
  totalConversions: 0,
  totalRevenue: 0,
  totalCost: 0,
  roi: 0,
  conversionChange: 0,
  revenueChange: 0,
  costChange: 0,
  roiChange: 0
});

// 平台数据 - 从后端API加载
const platformData = ref([]);

// 商品排行 - 从后端API加载
const productRanking = ref([]);

// 时间筛选变化
const handleDateChange = () => {
  loadAnalyticsData();
};

// 筛选变化
const handleFilterChange = () => {
  loadAnalyticsData();
};

// 重置筛选
const handleReset = () => {
  filterForm.dateRange = [];
  filterForm.platform = "";
  filterForm.productId = "";
  loadAnalyticsData();
};

// 加载分析数据
const loadAnalyticsData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新概览统计
    updateOverviewStats();

    ElMessage.success("数据加载成功");
  } catch (error) {
    ElMessage.error("数据加载失败");
  } finally {
    loading.value = false;
  }
};

// 加载商品排行
const loadProductRanking = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    ElMessage.success("排行数据已更新");
  } catch (error) {
    ElMessage.error("排行数据加载失败");
  }
};

// 更新概览统计
const updateOverviewStats = () => {
  const totalConversions = platformData.value.reduce((sum, item) => sum + item.conversions, 0);
  const totalRevenue = platformData.value.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = platformData.value.reduce((sum, item) => sum + item.cost, 0);
  const roi = totalCost > 0 ? Math.round((totalRevenue / totalCost - 1) * 100) : 0;

  overviewStats.totalConversions = totalConversions;
  overviewStats.totalRevenue = totalRevenue;
  overviewStats.totalCost = totalCost;
  overviewStats.roi = roi;

  // 模拟变化数据
  overviewStats.conversionChange = Math.random() * 20 - 10;
  overviewStats.revenueChange = Math.random() * 20 - 10;
  overviewStats.costChange = Math.random() * 20 - 10;
  overviewStats.roiChange = Math.random() * 20 - 10;
};

// 更新图表
const updateChart = () => {
  // 这里可以集成ECharts或其他图表库
  console.log("更新图表类型:", chartType.value);
};

// 查看商品详情
const handleViewProduct = (row: any) => {
  ElMessage.info(`查看商品 ${row.title} 的详细数据`);
};

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// 获取转化率类型
const getConversionRateType = (rate: number) => {
  if (rate >= 5) return "success";
  if (rate >= 3) return "warning";
  return "danger";
};

// 获取ROI类型
const getRoiType = (roi: number) => {
  if (roi >= 300) return "success";
  if (roi >= 200) return "warning";
  return "danger";
};

// 加载商品列表
const loadProductList = async () => {
  try {
    const { data } = await getProductListApi({ page: 1, size: 1000 });
    productList.value = data.list;
  } catch (error) {
    console.error("加载商品列表失败:", error);
  }
};

// 初始化
onMounted(() => {
  loadProductList();
  loadAnalyticsData();
  updateOverviewStats();
});
</script>

<style scoped>
.pixel-analytics {
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
  margin-bottom: 24px;
}

.filter-form {
  margin: 0;
}

.overview-stats {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.cost {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-icon.roi {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  margin-top: 4px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.platform-comparison,
.product-ranking,
.trend-chart {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  gap: 12px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-avatar {
  border-radius: 6px;
}

.platform-avatar.google_ads {
  background: linear-gradient(135deg, #4285f4, #34a853);
}

.platform-avatar.facebook {
  background: linear-gradient(135deg, #1877f2, #42a5f5);
}

.platform-avatar.tiktok {
  background: linear-gradient(135deg, #000000, #ff0050);
}

.platform-name {
  font-weight: 500;
  color: #303133;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-title {
  font-weight: 500;
  color: #303133;
}

.chart-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
