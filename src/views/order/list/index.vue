<template>
  <div class="order-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.order_number"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input
            v-model="searchForm.customer_name"
            placeholder="请输入客户姓名"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option v-for="(label, status) in OrderStatusLabels" :key="status" :label="label" :value="status" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
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
        <el-form-item label="商品筛选">
          <el-input
            v-model="selectedProductName"
            placeholder="点击选择商品"
            readonly
            style="width: 200px"
            @click="openProductDialog"
          >
            <template #suffix>
              <el-icon v-if="searchForm.product_id" @click.stop="clearProduct" style="cursor: pointer"><Close /></el-icon>
              <el-icon v-else><Search /></el-icon>
            </template>
          </el-input>
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

    <!-- 数据表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <span>订单列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" @click="handleExportDialog" :loading="exportLoading">
              <el-icon><Download /></el-icon>
              导出
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
        <el-table-column label="商品信息" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar :size="40" class="product-avatar" v-if="row.product_images && row.product_images[0]">
                <img :src="row.product_images[0]" :alt="row.product_title" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="40" class="product-avatar" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-details">
                <div class="product-title">{{ row.product_title || "商品已删除" }}</div>
                <div class="product-subtitle">数量: {{ row.quantity }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户信息" width="180">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="customer-name">{{ row.customer_name }}</div>
              <div class="customer-phone">{{ row.phone }}</div>
              <div v-if="row.email" class="customer-email">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="address-info">
              <div class="address-line">
                <span class="address-label">省市区:</span>
                <span class="address-value">{{ getAddressString(row.province, row.city, row.district) }}</span>
              </div>
              <div class="address-line" v-if="row.postal_code">
                <span class="address-label">邮编:</span>
                <span class="address-value">{{ row.postal_code }}</span>
              </div>
              <div class="address-line" v-if="row.address">
                <span class="address-label">详细:</span>
                <span class="address-value">{{ row.address }}</span>
              </div>
              <div class="address-line" v-if="row.comments && row.comments.trim()">
                <span class="address-label">备注:</span>
                <span class="address-value comments-value">{{ row.comments }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付信息" width="220" align="center">
          <template #default="{ row }">
            <div class="payment-info-combined">
              <div class="amount-info">
                <span class="amount">{{ row.total_amount || row.product_price * row.quantity }}</span>
                <span class="currency">{{ row.currency || "JPY" }}</span>
              </div>
              <div class="payment-method-info">
                <el-tag size="small" type="info">{{ row.payment_method || "COD" }}</el-tag>
                <el-tag
                  v-if="row.product_type"
                  size="small"
                  :type="getProductTypeColor(row.product_type)"
                  style="margin-left: 4px"
                >
                  {{ getProductTypeLabel(row.product_type) }}
                </el-tag>
              </div>
              <div class="status-info">
                <el-tag :type="OrderStatusColors[row.status]" size="small">
                  {{ OrderStatusLabels[row.status] || row.status }}
                </el-tag>
              </div>
              <div class="time-info">
                <el-icon class="time-icon"><Calendar /></el-icon>
                <span>{{ row.created_at }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="IP/来源" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="ip-url-info">
              <div class="ip-sk-row" v-if="row.ip_address">
                <div class="ip-address">
                  <el-tag size="small" type="info">{{ row.ip_address }}</el-tag>
                </div>
                <div class="sk-info" v-if="row.product_type">
                  <el-tag size="small" :type="getProductTypeColor(row.product_type)">
                    {{ getProductTypeLabel(row.product_type) }}
                  </el-tag>
                </div>
              </div>
              <div class="ip-location" v-if="row.ip_address && row.ip_info && (row.ip_info.country || row.ip_info.city)">
                <el-tag size="small" type="success" v-if="row.ip_info.country">
                  {{ row.ip_info.country }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="row.ip_info.city" style="margin-left: 4px">
                  {{ row.ip_info.city }}
                </el-tag>
                <el-tag size="small" type="info" v-if="row.ip_info.organization" style="margin-left: 4px">
                  {{ row.ip_info.organization }}
                </el-tag>
              </div>
              <div class="ip-no-location" v-if="row.ip_address && (!row.ip_info || (!row.ip_info.country && !row.ip_info.city))">
                <el-tag size="small" type="info" plain>未获取到地理位置</el-tag>
              </div>
              <div class="url-section" v-if="row.from_url">
                <div class="url-info">
                  <el-link :href="row.from_url" target="_blank" type="primary" size="small">
                    {{ row.from_url.length > 60 ? row.from_url.substring(0, 60) + "..." : row.from_url }}
                  </el-link>
                </div>
              </div>
              <div v-if="!row.ip_address && !row.from_url" class="no-data">--</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleViewDetail(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-dropdown @command="command => handleStatusChange(row, command)">
                <el-button size="small" type="success" link>
                  <el-icon><Edit /></el-icon>
                  状态
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(label, status) in OrderStatusLabels"
                      :key="status"
                      :command="status"
                      :disabled="row.status === status"
                    >
                      <el-tag :type="OrderStatusColors[status]" size="small">{{ label }}</el-tag>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedOrders.length > 0" class="batch-actions">
        <el-alert :title="`已选择 ${selectedOrders.length} 个订单`" type="info" show-icon :closable="false">
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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-descriptions title="订单信息" :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_number }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="OrderStatusColors[currentOrder.status]" size="small">
              {{ OrderStatusLabels[currentOrder.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrder.updated_at }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentOrder.payment_method }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">
            {{ currentOrder.total_amount || currentOrder.product_price * currentOrder.quantity }} {{ currentOrder.currency }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 客户信息 -->
        <el-descriptions title="客户信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="客户姓名">{{ currentOrder.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱地址" :span="2">{{ currentOrder.email || "未填写" }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            <div class="address-detail">
              <div class="address-line">
                <span class="address-label">省市区:</span>
                <span class="address-value">{{
                  getAddressString(currentOrder.province, currentOrder.city, currentOrder.district)
                }}</span>
              </div>
              <div class="address-line" v-if="currentOrder.postal_code">
                <span class="address-label">邮编:</span>
                <span class="address-value">{{ currentOrder.postal_code }}</span>
              </div>
              <div class="address-line" v-if="currentOrder.address">
                <span class="address-label">详细地址:</span>
                <span class="address-value">{{ currentOrder.address }}</span>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.comments && currentOrder.comments.trim()" label="客户备注" :span="2">
            {{ currentOrder.comments }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品信息 -->
        <el-descriptions title="商品信息" :column="1" border style="margin-top: 20px">
          <el-descriptions-item label="商品">
            <div class="product-detail-info">
              <el-avatar :size="60" v-if="currentOrder.product_images && currentOrder.product_images[0]">
                <img
                  :src="currentOrder.product_images[0]"
                  :alt="currentOrder.product_title"
                  style="width: 100%; height: 100%; object-fit: cover"
                />
              </el-avatar>
              <el-avatar :size="60" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-detail-text">
                <div class="product-title">{{ currentOrder.product_title || "商品已删除" }}</div>
                <div class="product-price">单价: {{ currentOrder.product_price }} {{ currentOrder.currency }}</div>
                <div class="product-quantity">数量: {{ currentOrder.quantity }}</div>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 技术信息 -->
        <el-descriptions title="技术信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="下单IP">
            <el-tag v-if="currentOrder.ip_address" type="info" size="small">{{ currentOrder.ip_address }}</el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="语言代码">
            <el-tag v-if="currentOrder.language_code" type="success" size="small">
              {{ currentOrder.language_code.toUpperCase() }}
            </el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="页面追踪标识" :span="2">
            <el-tag v-if="currentOrder.pd_val" type="warning" size="small">{{ currentOrder.pd_val }}</el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="来源URL" :span="2">
            <el-link v-if="currentOrder.from_url" :href="currentOrder.from_url" target="_blank" type="primary" size="small">
              {{ currentOrder.from_url }}
            </el-link>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="浏览器信息" :span="2">
            <div v-if="currentOrder.user_agent" class="user-agent-info">
              <el-text size="small" type="info">{{ currentOrder.user_agent }}</el-text>
            </div>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导出字段选择对话框 -->
    <!-- 匈牙利发货模板导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出匈牙利发货订单" width="600px" :close-on-click-modal="false">
      <div class="export-config">
        <el-form :model="exportConfig" label-width="120px">
          <el-form-item label="导出数量">
            <el-input-number
              v-model="exportConfig.exportLimit"
              :min="1"
              :max="10000"
              :step="10"
              placeholder="请输入导出数量"
              style="width: 200px"
            />
            <div class="form-tip">最多可导出 10000 条订单，当前筛选条件下共 {{ pagination.total }} 条</div>
          </el-form-item>

          <el-form-item label="客户单号起始">
            <el-input
              v-model="exportConfig.customerNumberStart"
              placeholder="请输入客户单号起始值，如：A1150"
              style="width: 200px"
            >
              <template #prepend>A</template>
            </el-input>
            <div class="form-tip">将从 {{ exportConfig.customerNumberStart }} 开始递增</div>
          </el-form-item>

          <el-form-item label="运输方式">
            <el-input v-model="exportConfig.transportMethod" placeholder="请输入运输方式" style="width: 300px" />
          </el-form-item>

          <el-form-item label="国家/地区">
            <el-input v-model="exportConfig.country" placeholder="请输入国家/地区" style="width: 300px" />
          </el-form-item>

          <el-form-item label="规格信息">
            <el-input v-model="exportConfig.specification" placeholder="请输入规格信息" style="width: 300px" />
          </el-form-item>

          <el-form-item label="SKU">
            <el-input v-model="exportConfig.sku" placeholder="请输入SKU" style="width: 300px" />
          </el-form-item>
        </el-form>

        <el-alert title="导出说明" type="info" show-icon :closable="false" style="margin-top: 20px">
          <template #default>
            <div class="export-description">
              <p>将按照匈牙利发货模板格式导出订单数据，包含以下信息：</p>
              <ul>
                <li>
                  📦 导出数量：{{ Math.min(exportConfig.exportLimit, pagination.total) }} 条（共
                  {{ pagination.total }} 条符合条件）
                </li>
                <li>✅ 收件人信息（姓名、邮箱、地址、电话等）</li>
                <li>✅ 财务信息（代收货款币种、金额等）</li>
                <li>✅ 商品信息（配货信息、货物类型、数量等）</li>
                <li>✅ 地址备注1将自动填充原始联系地址内容</li>
                <li>✅ 智能处理联系地址：如果联系地址以城市名开头，自动去掉城市名部分</li>
                <li>
                  ✅ 客户单号将自动生成：{{ exportConfig.customerNumberStart }}, A{{
                    parseInt(exportConfig.customerNumberStart.substring(1)) + 1
                  }}, A{{ parseInt(exportConfig.customerNumberStart.substring(1)) + 2 }}...
                </li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="exportLoading" @click="handleHungaryExport">
            <el-icon><Download /></el-icon>
            确认导出
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 商品选择对话框 -->
    <el-dialog v-model="productDialogVisible" title="选择商品" width="800px" :close-on-click-modal="false">
      <div class="product-selector">
        <div class="product-search">
          <el-input
            v-model="productSearchKeyword"
            placeholder="搜索商品名称"
            clearable
            @input="searchProducts"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-table
          :data="productList"
          v-loading="productLoading"
          @selection-change="handleProductSelectionChange"
          style="width: 100%; margin-top: 16px"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="商品名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="sell_price" label="价格" width="100" align="center">
            <template #default="{ row }">
              <span>¥{{ row.sell_price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="product_type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getProductTypeColor(row.product_type)" size="small">
                {{ getProductTypeLabel(row.product_type) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="product-pagination">
          <el-pagination
            v-model:current-page="productPagination.current"
            v-model:page-size="productPagination.size"
            :page-sizes="[10, 20, 50]"
            :total="productPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleProductSizeChange"
            @current-change="handleProductCurrentChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmProductSelection" :disabled="selectedProducts.length === 0">
            确定选择 ({{ selectedProducts.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="OrderList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Box, Search, Refresh, Calendar, Edit, Delete, View, Download, ArrowDown, Close } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  getOrderListApi,
  getOrderDetailApi,
  updateOrderStatusApi,
  deleteOrderApi,
  batchDeleteOrdersApi,
  type Order,
  type OrderListParams,
  OrderStatus,
  OrderStatusLabels,
  OrderStatusColors
} from "@/api/modules/order";
import { getProductListApi, type Product } from "@/api/modules/product";

// 响应式数据
const loading = ref(false);
const exportLoading = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);

// 导出配置
const exportConfig = reactive({
  customerNumberStart: "A1150",
  transportMethod: "欧洲备货-30HU",
  country: "斯洛伐克",
  specification: "welding gun",
  sku: "DH20251006*1",
  exportLimit: 100 // 默认导出100条
});
const selectedOrders = ref<Order[]>([]);

// 搜索表单
const searchForm = reactive({
  order_number: "",
  customer_name: "",
  phone: "",
  status: "",
  start_date: "",
  end_date: "",
  product_id: ""
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<Order[]>([]);

// 商品筛选相关
const productDialogVisible = ref(false);
const productList = ref<Product[]>([]);
const productLoading = ref(false);
const productSearchKeyword = ref("");
const selectedProducts = ref<Product[]>([]);
const selectedProductName = ref("");
const productPagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    order_number: "",
    customer_name: "",
    phone: "",
    status: "",
    start_date: "",
    end_date: "",
    product_id: ""
  });
  dateRange.value = null;
  selectedProductName.value = "";
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
const handleViewDetail = async (row: Order) => {
  try {
    const { data } = await getOrderDetailApi(row.id);
    currentOrder.value = data;
    detailDialogVisible.value = true;
  } catch (error) {
    ElMessage.error("获取订单详情失败");
  }
};

// 状态变更
const handleStatusChange = async (row: Order, newStatus: OrderStatus) => {
  try {
    await updateOrderStatusApi(row.id, { status: newStatus });
    ElMessage.success("订单状态更新成功");
    loadData();
  } catch (error) {
    ElMessage.error("订单状态更新失败");
  }
};

// 删除
const handleDelete = (row: Order) => {
  ElMessageBox.confirm(`确定要删除订单 "${row.order_number}" 吗？删除后无法恢复！`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteOrderApi(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  const orderNumbers = selectedOrders.value.map(order => order.order_number).join("、");
  ElMessageBox.confirm(`确定要删除选中的 ${selectedOrders.value.length} 个订单吗？\n订单号：${orderNumbers}`, "批量删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      const ids = selectedOrders.value.map(order => order.id);
      await batchDeleteOrdersApi(ids);
      ElMessage.success("批量删除成功");
      selectedOrders.value = [];
      loadData();
    } catch (error) {
      ElMessage.error("批量删除失败");
    }
  });
};

// 打开导出对话框
const handleExportDialog = () => {
  exportDialogVisible.value = true;
};

// 匈牙利发货模板导出
const handleHungaryExport = async () => {
  await handleExportConfirm();
  exportDialogVisible.value = false;
};

// 导出确认 - 匈牙利发货模板格式
const handleExportConfirm = async () => {
  exportLoading.value = true;
  try {
    // 获取订单数据（使用用户设置的导出数量）
    const exportLimit = exportConfig.exportLimit || 100;
    const params: OrderListParams = {
      page: 1,
      size: exportLimit, // 使用用户设置的导出数量
      order_number: searchForm.order_number || undefined,
      customer_name: searchForm.customer_name || undefined,
      phone: searchForm.phone || undefined,
      status: (searchForm.status as OrderStatus) || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined,
      product_id: searchForm.product_id || undefined
    };

    console.log("获取订单数据参数:", params);

    const { data } = await getOrderListApi(params);
    const orders = data.list;

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    console.log(`获取到 ${orders.length} 条订单数据`);

    // 匈牙利发货模板字段映射（使用原始模板的表头）
    const hungaryTemplateFields = [
      "仓库编码",
      "客户编码",
      "客户单号",
      "物流编码",
      "物流网点",
      "物流单号",
      "物流单号2",
      "运输方式",
      "国家/地区",
      "收件人姓名",
      "邮箱",
      "州,省",
      "城市",
      "联系地址",
      "地址备注1",
      "地址备注2",
      "收件人电话",
      "收件人邮编",
      "代收货款币种",
      "代收款金额",
      "订单备注",
      "配货信息",
      "货物类型",
      "规格信息",
      "申报品数量",
      "SKU",
      "配货名称",
      "申报币种",
      "申报金额",
      "税号类型"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];

    // 添加表头
    excelData.push(hungaryTemplateFields);

    // 在模板基础上添加新的订单数据
    orders.forEach((order, index) => {
      const row: any[] = [];

      // 仓库编码 - 固定值
      row.push("HU01");

      // 客户编码 - 固定值
      row.push("773");

      // 客户单号 - 使用配置的起始值递增
      const startNumber = parseInt(exportConfig.customerNumberStart.substring(1));
      row.push(`A${startNumber + index}`);

      // 物流编码 - 空
      row.push("");

      // 物流网点 - 空
      row.push("");

      // 物流单号 - 空
      row.push("");

      // 物流单号2 - 空
      row.push("");

      // 运输方式 - 使用配置的值
      row.push(exportConfig.transportMethod);

      // 国家/地区 - 使用配置的值
      row.push(exportConfig.country);

      // 收件人姓名
      row.push(order.customer_name || "");

      // 邮箱
      row.push(order.email || "");

      // 州,省
      row.push(order.province || "");

      // 城市
      row.push(order.city || "");

      // 处理联系地址规则：如果地址以城市名开头，去掉城市名部分
      let processedAddress = order.address || "";
      if (order.city && order.address) {
        // 如果联系地址以城市名开头，去掉城市名部分
        if (order.address.startsWith(order.city)) {
          processedAddress = order.address.substring(order.city.length).trim();
          // 如果去掉城市名后还有内容，使用处理后的地址；否则使用原地址
          if (processedAddress) {
            // 如果处理后的地址以逗号开头，去掉逗号
            if (processedAddress.startsWith(",")) {
              processedAddress = processedAddress.substring(1).trim();
            }
          } else {
            processedAddress = order.address;
          }
        }
      }

      // 联系地址
      row.push(processedAddress);

      // 地址备注1 - 默认填充原始联系地址
      row.push(order.address || "");

      // 地址备注2 - 空
      row.push("");

      // 收件人电话
      row.push(order.phone || "");

      // 收件人邮编
      row.push(order.postal_code || "");

      // 代收货款币种
      row.push(order.currency || "EUR");

      // 代收款金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 订单备注 - 空
      row.push("");

      // 配货信息
      row.push(order.product_title || "");

      // 货物类型（默认为P，只有仿品才是R）
      row.push(order.product_type === "replica" ? "R" : "P");

      // 规格信息 - 使用配置的值
      row.push(exportConfig.specification);

      // 申报品数量
      row.push(order.quantity || 1);

      // SKU - 使用配置的值
      row.push(exportConfig.sku);

      // 配货名称
      row.push(order.product_title || "");

      // 申报币种
      row.push(order.currency || "EUR");

      // 申报金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 税号类型 - 空
      row.push("");

      // 添加到Excel数据中
      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = hungaryTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "匈牙利发货订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `匈牙利发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为匈牙利发货模板`);
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
  }
};

// 选择变化
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection;
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  loadData();
};

// 当前页改变
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: OrderListParams = {
      page: pagination.current,
      size: pagination.size,
      order_number: searchForm.order_number || undefined,
      customer_name: searchForm.customer_name || undefined,
      phone: searchForm.phone || undefined,
      status: (searchForm.status as OrderStatus) || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined,
      product_id: searchForm.product_id || undefined
    };

    const { data } = await getOrderListApi(params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
};

// 地址字符串处理函数
const getAddressString = (province: string, city: string, district: string): string => {
  return [province, city, district].filter(Boolean).join(" ") || "--";
};

// 商品类型标签
const getProductTypeLabel = (type: string): string => {
  const labels = {
    original: "正品",
    replica: "仿品"
  };
  return labels[type as keyof typeof labels] || type;
};

// 商品类型颜色
const getProductTypeColor = (type: string): string => {
  const colors = {
    original: "success",
    replica: "warning"
  };
  return colors[type as keyof typeof colors] || "info";
};

// 商品筛选相关方法
const openProductDialog = () => {
  productDialogVisible.value = true;
  productSearchKeyword.value = "";
  selectedProducts.value = [];
  productPagination.current = 1;
  loadProducts();
};

const loadProducts = async () => {
  productLoading.value = true;
  try {
    const params = {
      page: productPagination.current,
      size: productPagination.size,
      title: productSearchKeyword.value || undefined
    };

    const response = await getProductListApi(params);

    if (response && response.data) {
      productList.value = response.data.list || [];
      productPagination.total = response.data.total || 0;
    } else {
      productList.value = [];
      productPagination.total = 0;
    }
  } catch (error) {
    console.error("加载商品列表失败:", error);
    ElMessage.error("加载商品列表失败");
    productList.value = [];
    productPagination.total = 0;
  } finally {
    productLoading.value = false;
  }
};

const searchProducts = () => {
  productPagination.current = 1;
  loadProducts();
};

const handleProductSelectionChange = (selection: Product[]) => {
  selectedProducts.value = selection;
};

const confirmProductSelection = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning("请选择商品");
    return;
  }

  if (selectedProducts.value.length > 1) {
    ElMessage.warning("只能选择一个商品");
    return;
  }

  const product = selectedProducts.value[0];
  searchForm.product_id = product.id;
  selectedProductName.value = product.title;
  productDialogVisible.value = false;
  handleSearch();
};

const clearProduct = () => {
  searchForm.product_id = "";
  selectedProductName.value = "";
  selectedProducts.value = [];
  handleSearch();
};

const handleProductSizeChange = (size: number) => {
  productPagination.size = size;
  loadProducts();
};

const handleProductCurrentChange = (current: number) => {
  productPagination.current = current;
  loadProducts();
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.order-management {
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
  font-size: 16px;
  font-weight: 600;
}
.table-actions {
  display: flex;
  gap: 8px;
}

/* 订单号 */
.order-number {
  font-family: "Courier New", monospace;
  font-weight: 500;
}

/* 商品信息 */
.product-info {
  display: flex;
  gap: 12px;
  align-items: center;
}
.product-avatar {
  flex-shrink: 0;
  color: white;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.product-details {
  flex: 1;
  min-width: 0;
}
.product-title {
  margin-bottom: 4px;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-subtitle {
  overflow: hidden;
  font-size: 12px;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 客户信息 */
.customer-info {
  line-height: 1.5;
}
.customer-name {
  font-weight: 500;
  margin-bottom: 2px;
}
.customer-phone {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}
.customer-email {
  font-size: 12px;
  color: #999;
}

/* 地址信息 */
.address-info {
  line-height: 1.4;
  color: #666;
}

.address-line {
  display: flex;
  margin-bottom: 2px;
  font-size: 12px;
}

.address-label {
  color: #909399;
  margin-right: 4px;
  min-width: 30px;
  flex-shrink: 0;
}

.address-value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

/* 备注行特殊样式 - 只限制备注为一行 */
.comments-value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.address-detail {
  line-height: 1.6;
}

.address-detail .address-line {
  margin-bottom: 4px;
  font-size: 14px;
}

.address-detail .address-label {
  color: #909399;
  margin-right: 8px;
  min-width: 60px;
  flex-shrink: 0;
}

.address-detail .address-value {
  color: #606266;
  flex: 1;
}

/* 支付信息合并样式 */
.payment-info-combined {
  text-align: center;
  line-height: 1.5;
}

.payment-info-combined .amount-info {
  margin-bottom: 6px;
}

.payment-info-combined .amount {
  font-weight: 600;
  color: #e6a23c;
  margin-right: 4px;
}

.payment-info-combined .currency {
  font-size: 12px;
  color: #999;
}

.payment-info-combined .payment-method-info {
  margin-bottom: 6px;
}

.payment-info-combined .status-info {
  margin-bottom: 6px;
}

.payment-info-combined .time-info {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

.payment-info-combined .time-icon {
  font-size: 12px;
  color: #909399;
}

/* IP/来源合并样式 */
.ip-url-info {
  line-height: 1.5;
}

.ip-url-info .ip-sk-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ip-url-info .ip-address {
  flex-shrink: 0;
}

.ip-url-info .sk-info {
  flex-shrink: 0;
}

.ip-url-info .ip-location {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 4px;
}

.ip-url-info .ip-no-location {
  text-align: center;
  margin-bottom: 4px;
}

.ip-url-info .url-section {
  margin-top: 6px;
}

.ip-url-info .url-info {
  text-align: center;
  word-break: break-all;
}

/* 时间信息 */
.time-info {
  display: flex;
  gap: 6px;
  align-items: center;
}
.time-icon {
  font-size: 14px;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 批量操作 */
.batch-actions {
  margin: 16px 0;
}
.batch-buttons {
  margin-top: 8px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 订单详情 */
.order-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.product-detail-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.product-detail-text {
  flex: 1;
}

.product-detail-text .product-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.product-detail-text .product-price,
.product-detail-text .product-quantity {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

/* 新增字段样式 */
.ip-info {
  text-align: center;
}

.ip-address {
  margin-bottom: 4px;
}

.ip-location {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
}

.ip-no-location {
  margin-top: 4px;
  text-align: center;
}

.url-info {
  word-break: break-all;
}

.user-agent-info {
  word-break: break-all;
  max-width: 300px;
}

.no-data {
  color: #999;
  font-size: 12px;
}

/* 对话框 */
.dialog-footer {
  text-align: right;
}

/* 商品选择对话框样式 */
.product-selector {
  max-height: 60vh;
  overflow-y: auto;
}

.product-search {
  margin-bottom: 16px;
}

.product-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 导出配置对话框样式 */
.export-config {
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .export-description {
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    li {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}

/* 响应式设计 */
@media (width <= 768px) {
  .search-form {
    flex-direction: column;
  }
  .search-form .el-form-item {
    width: 100%;
  }
  .action-buttons {
    flex-direction: column;
  }
  .product-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .table-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
