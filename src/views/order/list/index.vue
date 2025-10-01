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
            <el-button size="small" @click="handleExport" :loading="exportLoading">
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
        <el-table-column label="收货地址" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="address-info">{{ row.province }}{{ row.city }}{{ row.district }}{{ row.address }}</div>
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
        <el-table-column prop="payment_method" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.payment_method || "COD" }}</el-tag>
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
            {{ currentOrder.province }}{{ currentOrder.city }}{{ currentOrder.district }}{{ currentOrder.address }}
            <span v-if="currentOrder.postal_code">（{{ currentOrder.postal_code }}）</span>
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
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="OrderList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Box, Search, Refresh, Calendar, Edit, Delete, View, Download, ArrowDown } from "@element-plus/icons-vue";
import {
  getOrderListApi,
  getOrderDetailApi,
  updateOrderStatusApi,
  deleteOrderApi,
  batchDeleteOrdersApi,
  exportOrdersApi,
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

// 导出
const handleExport = async () => {
  exportLoading.value = true;
  try {
    const params: OrderListParams = {
      ...searchForm,
      order_number: searchForm.order_number || undefined,
      customer_name: searchForm.customer_name || undefined,
      phone: searchForm.phone || undefined,
      status: (searchForm.status as OrderStatus) || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined
    };

    const response = await exportOrdersApi(params);
    // console.log("导出API响应:", response);
    // console.log("响应数据类型:", typeof response);
    // console.log("响应数据:", response);

    // 检查响应数据 - API拦截器返回完整response对象
    let blobData;
    let csvData;

    // 处理不同类型的响应数据
    if (response && response.data) {
      // 标准的axios响应格式
      csvData = response.data;
    } else if (typeof response === "string" && response.trim()) {
      // 直接返回字符串数据
      csvData = response;
    } else {
      ElMessage.warning("没有数据可导出");
      return;
    }

    // console.log("CSV数据类型:", typeof csvData);
    // console.log("CSV数据长度:", csvData ? csvData.length : 0);

    // 检查数据是否为空
    if (!csvData || (typeof csvData === "string" && csvData.trim() === "")) {
      ElMessage.warning("导出的数据为空");
      return;
    }

    // 创建blob数据
    if (csvData instanceof Blob) {
      blobData = csvData;
    } else if (typeof csvData === "string") {
      blobData = new Blob([csvData], { type: "text/csv; charset=utf-8" });
    } else {
      // 尝试将其他类型转换为字符串
      const dataStr = typeof csvData === "object" ? JSON.stringify(csvData) : String(csvData);
      blobData = new Blob([dataStr], { type: "text/csv; charset=utf-8" });
    }

    // 检查blob大小
    if (blobData.size === 0) {
      ElMessage.warning("导出的数据为空");
      return;
    }

    // console.log("Blob数据大小:", blobData.size, "字节");

    // 创建下载链接
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.href = url;
    link.download = `订单列表_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success("导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败");
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
