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
        <el-table-column prop="order_number" label="订单号" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="order-number">
              <el-link type="primary" @click="handleViewDetail(row)">
                {{ row.order_number }}
              </el-link>
            </div>
          </template>
        </el-table-column>
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
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120" align="center">
          <template #default="{ row }">
            <div class="amount-info">
              <span class="amount">{{ row.total_amount || row.product_price * row.quantity }}</span>
              <span class="currency">{{ row.currency || "JPY" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="120" align="center">
          <template #default="{ row }">
            <div class="payment-info">
              <el-tag size="small" type="info">{{ row.payment_method || "COD" }}</el-tag>
              <div class="product-type" v-if="row.product_type">
                <el-tag size="small" :type="getProductTypeColor(row.product_type)">
                  {{ getProductTypeLabel(row.product_type) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="OrderStatusColors[row.status]" size="small">
              {{ OrderStatusLabels[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ row.created_at }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="下单IP" width="250" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="ip-info" v-if="row.ip_address">
              <div class="ip-address">
                <el-tag size="small" type="info">{{ row.ip_address }}</el-tag>
              </div>
              <div class="ip-location" v-if="row.ip_info && (row.ip_info.country || row.ip_info.city)">
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
              <div class="ip-no-location" v-else>
                <el-tag size="small" type="info" plain>未获取到地理位置</el-tag>
              </div>
            </div>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="language_code" label="语言" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="success" v-if="row.language_code">
              {{ row.language_code.toUpperCase() }}
            </el-tag>
            <span v-else class="no-data">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="from_url" label="来源URL" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="url-info">
              <el-link v-if="row.from_url" :href="row.from_url" target="_blank" type="primary" size="small">
                {{ row.from_url.length > 50 ? row.from_url.substring(0, 50) + "..." : row.from_url }}
              </el-link>
              <span v-else class="no-data">--</span>
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
          <el-descriptions-item v-if="currentOrder.comments" label="客户备注" :span="2">
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
    <ExportDialog v-model="exportDialogVisible" :available-fields="availableExportFields" @confirm="handleExportConfirm" />
  </div>
</template>

<script setup lang="ts" name="OrderList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Box, Search, Refresh, Calendar, Edit, Delete, View, Download, ArrowDown } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import ExportDialog from "@/components/ExportDialog/index.vue";
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

// 响应式数据
const loading = ref(false);
const exportLoading = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);
const selectedOrders = ref<Order[]>([]);

// 搜索表单
const searchForm = reactive({
  order_number: "",
  customer_name: "",
  phone: "",
  status: "",
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

// 表格数据
const tableData = ref<Order[]>([]);

// 可导出的字段定义
const availableExportFields = [
  // 基本信息
  { key: "order_number", label: "订单号", group: "基本信息" },
  { key: "customer_name", label: "客户姓名", group: "基本信息" },
  { key: "phone", label: "手机号", group: "基本信息" },
  { key: "email", label: "邮箱", group: "基本信息" },
  { key: "status", label: "订单状态", group: "基本信息" },
  { key: "created_at", label: "下单时间", group: "基本信息" },

  // 商品信息
  { key: "product_title", label: "商品标题", group: "商品信息" },
  { key: "product_price", label: "商品价格", group: "商品信息" },
  { key: "quantity", label: "数量", group: "商品信息" },
  { key: "product_type", label: "商品类型", group: "商品信息" },

  // 地址信息
  { key: "province", label: "省份", group: "地址信息" },
  { key: "city", label: "城市", group: "地址信息" },
  { key: "district", label: "区县", group: "地址信息" },
  { key: "address", label: "详细地址", group: "地址信息" },
  { key: "postal_code", label: "邮编", group: "地址信息" },

  // 金额信息
  { key: "total_amount", label: "订单金额", group: "金额信息" },
  { key: "currency", label: "货币类型", group: "金额信息" },
  { key: "payment_method", label: "支付方式", group: "金额信息" },

  // 时间信息
  { key: "confirmed_at", label: "确认时间", group: "时间信息" },
  { key: "shipped_at", label: "发货时间", group: "时间信息" },
  { key: "delivered_at", label: "送达时间", group: "时间信息" },
  { key: "updated_at", label: "更新时间", group: "时间信息" },

  // 技术信息
  { key: "ip_address", label: "IP地址", group: "技术信息" },
  { key: "language_code", label: "语言代码", group: "技术信息" },
  { key: "from_url", label: "来源URL", group: "技术信息" },
  { key: "user_agent", label: "用户代理", group: "技术信息" },
  { key: "pd_val", label: "PD值", group: "技术信息" },

  // 其他信息
  { key: "comments", label: "备注", group: "其他信息" }
];

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

// 导出确认
const handleExportConfirm = async (selectedFields: string[]) => {
  exportLoading.value = true;
  try {
    // 获取所有订单数据（不分页）
    const params: OrderListParams = {
      page: 1,
      size: 10000, // 获取大量数据
      order_number: searchForm.order_number || undefined,
      customer_name: searchForm.customer_name || undefined,
      phone: searchForm.phone || undefined,
      status: (searchForm.status as OrderStatus) || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined
    };

    console.log("获取订单数据参数:", params);
    console.log("选择的字段:", selectedFields);

    const { data } = await getOrderListApi(params);
    const orders = data.list;

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    console.log(`获取到 ${orders.length} 条订单数据`);

    // 字段标签映射
    const fieldLabels: { [key: string]: string } = {
      id: "订单ID",
      order_number: "订单号",
      customer_name: "客户姓名",
      phone: "手机号",
      email: "邮箱",
      status: "订单状态",
      created_at: "下单时间",
      updated_at: "更新时间",
      product_title: "商品标题",
      product_price: "商品价格",
      quantity: "数量",
      product_type: "商品类型",
      province: "省份",
      city: "城市",
      district: "区县",
      address: "详细地址",
      postal_code: "邮编",
      total_amount: "订单金额",
      currency: "货币类型",
      payment_method: "支付方式",
      ip_address: "IP地址",
      language_code: "语言代码",
      from_url: "来源URL",
      user_agent: "用户代理",
      pd_val: "PD值",
      comments: "备注"
    };

    // 状态标签映射
    const statusLabels: { [key: string]: string } = {
      pending: "待确认",
      confirmed: "已确认",
      processing: "处理中",
      shipped: "已发货",
      delivered: "已送达",
      cancelled: "已取消",
      refunded: "已退款",
      deleted: "已删除"
    };

    // 商品类型标签映射
    const productTypeLabels: { [key: string]: string } = {
      original: "正品",
      replica: "仿品"
    };

    // 准备Excel数据
    const excelData: any[][] = [];

    // 添加表头
    const headers = selectedFields.map(field => fieldLabels[field] || field);
    excelData.push(headers);

    // 添加数据行
    orders.forEach(order => {
      const row: any[] = [];
      selectedFields.forEach(field => {
        let value = order[field] || "";

        // 特殊处理某些字段
        if (field === "status") {
          value = statusLabels[value] || value;
        } else if (field === "product_type") {
          value = productTypeLabels[value] || value;
        } else if (field === "total_amount" || field === "product_price") {
          value = parseFloat(value) || 0;
        } else if (field === "quantity") {
          value = parseInt(value) || 0;
        }

        row.push(value);
      });
      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = selectedFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "订单列表");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据`);
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
      end_date: searchForm.end_date || undefined
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

/* 金额信息 */
.amount-info {
  text-align: center;
}
.amount {
  font-weight: 600;
  color: #e6a23c;
  margin-right: 4px;
}
.currency {
  font-size: 12px;
  color: #999;
}

/* 支付方式信息 */
.payment-info {
  text-align: center;
}
.product-type {
  margin-top: 4px;
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
