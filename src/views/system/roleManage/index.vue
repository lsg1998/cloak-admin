<template>
  <div class="role-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加角色
            </el-button>
            <span>角色列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
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
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="角色名称" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="role-info">
              <el-avatar :size="32" class="role-avatar">
                {{ row.name.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="role-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="角色描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="description-info">
              <el-icon class="description-icon"><Document /></el-icon>
              <span>{{ row.description }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="权限数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small" effect="light">
              {{ row.permissions ? row.permissions.length : 0 }} 个权限
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ row.created_at }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="warning" link @click="handlePermissions(row)">
                <el-icon><Key /></el-icon>
                权限
              </el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="role-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入角色名称" :prefix-icon="UserFilled" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">
                  <el-tag type="success" size="small">启用</el-tag>
                </el-radio>
                <el-radio :label="0">
                  <el-tag type="danger" size="small">禁用</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="权限设置" width="600px" :close-on-click-modal="false" destroy-on-close>
      <div class="permission-content">
        <div class="permission-header">
          <span>为角色 "{{ currentRole?.name }}" 设置权限</span>
        </div>
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTreeData"
          :props="{ children: 'children', label: 'name' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          class="permission-tree"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePermissions" :loading="permissionLoading"> 保存权限 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="roleManage">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, UserFilled, Search, Refresh, Calendar, Edit, Delete, Key, Document } from "@element-plus/icons-vue";
import { getRoleListApi, createRoleApi, updateRoleApi, deleteRoleApi, type Role, type RoleListParams } from "@/api/modules/role";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const permissionLoading = ref(false);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();
const permissionTreeRef = ref();
const currentRole = ref<Role | null>(null);

// 搜索表单
const searchForm = reactive({
  name: "",
  status: null
});

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<Role[]>([]);

// 表单数据
const form = reactive({
  id: null,
  name: "",
  description: "",
  status: 1
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入角色名称", trigger: "blur" },
    { min: 2, max: 20, message: "角色名称长度在 2 到 20 个字符", trigger: "blur" }
  ],
  description: [{ required: true, message: "请输入角色描述", trigger: "blur" }]
};

// 权限树数据
const permissionTreeData = ref([
  {
    id: "system",
    name: "系统管理",
    children: [
      { id: "system.user", name: "用户管理" },
      { id: "system.role", name: "角色管理" },
      { id: "system.log", name: "操作日志" }
    ]
  },
  {
    id: "product",
    name: "商品管理",
    children: [
      { id: "product.view", name: "查看商品" },
      { id: "product.add", name: "添加商品" },
      { id: "product.edit", name: "编辑商品" },
      { id: "product.delete", name: "删除商品" }
    ]
  },
  {
    id: "order",
    name: "订单管理",
    children: [
      { id: "order.view", name: "查看订单" },
      { id: "order.edit", name: "编辑订单" },
      { id: "order.delete", name: "删除订单" }
    ]
  }
]);

// 已选中的权限
const checkedPermissions = ref<string[]>([]);

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    name: "",
    status: null
  });
  handleSearch();
};

// 添加
const handleAdd = () => {
  dialogTitle.value = "添加角色";
  Object.assign(form, {
    id: null,
    name: "",
    description: "",
    status: 1
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: Role) => {
  dialogTitle.value = "编辑角色";
  Object.assign(form, { ...row });
  dialogVisible.value = true;
};

// 权限设置
const handlePermissions = (row: Role) => {
  currentRole.value = row;
  // 根据角色设置已选中的权限
  if (row.name === "admin") {
    checkedPermissions.value = ["system", "product", "order"];
  } else if (row.name === "editor") {
    checkedPermissions.value = ["product.view", "product.add", "product.edit", "order.view", "order.edit"];
  } else {
    checkedPermissions.value = ["product.view", "order.view"];
  }
  permissionDialogVisible.value = true;
};

// 删除
const handleDelete = (row: Role) => {
  ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？删除后无法恢复！`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteRoleApi(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 状态切换
const handleStatusChange = async (row: Role) => {
  try {
    await updateRoleApi(row.id, { status: row.status });
    ElMessage.success(row.status ? "角色已启用" : "角色已禁用");
  } catch (error) {
    ElMessage.error("状态更新失败");
    // 恢复原状态
    row.status = row.status ? 0 : 1;
  }
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (form.id) {
          await updateRoleApi(form.id, form);
          ElMessage.success("更新成功");
        } else {
          await createRoleApi(form);
          ElMessage.success("添加成功");
        }
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        ElMessage.error(form.id ? "更新失败" : "添加失败");
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 保存权限
const handleSavePermissions = async () => {
  if (!permissionTreeRef.value || !currentRole.value) return;

  permissionLoading.value = true;
  try {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys();
    await updateRoleApi(currentRole.value.id, { permissions: checkedKeys });
    ElMessage.success("权限保存成功");
    permissionDialogVisible.value = false;
    loadData();
  } catch (error) {
    ElMessage.error("权限保存失败");
  } finally {
    permissionLoading.value = false;
  }
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
    const params: RoleListParams = {
      page: pagination.current,
      size: pagination.size,
      name: searchForm.name || undefined,
      status: searchForm.status || undefined
    };

    const { data } = await getRoleListApi(params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取角色列表失败");
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
.role-management {
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
.table-title .el-button {
  margin-right: 8px;
}
.table-actions {
  display: flex;
  gap: 8px;
}

/* 角色信息 */
.role-info {
  display: flex;
  gap: 8px;
  align-items: center;
}
.role-avatar {
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.role-name {
  font-weight: 500;
}
.description-info {
  display: flex;
  gap: 6px;
  align-items: center;
}
.description-icon {
  font-size: 14px;
  color: #909399;
}
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
  gap: 8px;
  justify-content: center;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 对话框 */
.role-form {
  padding: 0 20px;
}
.dialog-footer {
  text-align: right;
}

/* 权限设置 */
.permission-content {
  padding: 0 20px;
}
.permission-header {
  padding: 12px;
  margin-bottom: 20px;
  font-weight: 500;
  background: #f8f9fa;
  border-radius: 8px;
}
.permission-tree {
  max-height: 400px;
  padding: 12px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 响应式设计 */
@media (width <= 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  .search-form {
    flex-direction: column;
  }
  .search-form .el-form-item {
    width: 100%;
  }
  .action-buttons {
    flex-direction: column;
  }
}
</style>
