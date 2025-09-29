<template>
  <div class="card content-box">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_number" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="商品ID">
          <el-input v-model="searchForm.product_id" placeholder="请输入商品ID" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border>
      <el-table-column prop="order_number" label="订单号" width="150" />
      <el-table-column prop="product_id" label="商品ID" width="120" />
      <el-table-column prop="sku_id" label="SKU ID" width="120" />
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column prop="total_price" label="总价" width="100" />
      <el-table-column prop="customer_name" label="客户姓名" width="120" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleView(row)">查看</el-button>
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
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
  </div>
</template>

<script setup lang="ts" name="OrderList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 响应式数据
const loading = ref(false);

// 搜索表单
const searchForm = reactive({
  order_number: "",
  product_id: "",
  status: null
});

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref([
  {
    order_number: "ORD202401150001",
    product_id: "PROD001",
    sku_id: "SKU001",
    quantity: 1,
    total_price: 8999.0,
    customer_name: "张三",
    phone: "13800138000",
    email: "zhangsan@example.com",
    status: "pending",
    created_at: "2024-01-15 10:30:00"
  },
  {
    order_number: "ORD202401150002",
    product_id: "PROD002",
    sku_id: "SKU002",
    quantity: 1,
    total_price: 12999.0,
    customer_name: "李四",
    phone: "13900139000",
    email: "lisi@example.com",
    status: "confirmed",
    created_at: "2024-01-15 11:20:00"
  },
  {
    order_number: "ORD202401150003",
    product_id: "PROD003",
    sku_id: "SKU003",
    quantity: 2,
    total_price: 15998.0,
    customer_name: "王五",
    phone: "13700137000",
    email: "wangwu@example.com",
    status: "shipped",
    created_at: "2024-01-15 14:15:00"
  }
]);

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: "warning",
    confirmed: "info",
    shipped: "primary",
    completed: "success",
    cancelled: "danger"
  };
  return types[status] || "info";
};

// 获取状态名称
const getStatusName = (status: string) => {
  const names = {
    pending: "待处理",
    confirmed: "已确认",
    shipped: "已发货",
    completed: "已完成",
    cancelled: "已取消"
  };
  return names[status] || status;
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    order_number: "",
    product_id: "",
    status: null
  });
  handleSearch();
};

// 查看
const handleView = (row: any) => {
  ElMessage.info(`查看订单: ${row.order_number}`);
};

// 编辑
const handleEdit = (row: any) => {
  ElMessage.info(`编辑订单: ${row.order_number}`);
};

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除订单"${row.id}"吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    ElMessage.success("删除成功");
    loadData();
  });
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
const loadData = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    pagination.total = tableData.value.length;
    loading.value = false;
  }, 500);
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.search-form {
  padding: 20px;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
