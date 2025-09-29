<template>
  <div class="user-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
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
              添加用户
            </el-button>
            <span>用户列表</span>
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
        <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.avatar" class="user-avatar">
                {{ row.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="email-info">
              <el-icon class="email-icon"><Message /></el-icon>
              <span>{{ row.email }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small" effect="light">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Clock /></el-icon>
              <span>{{ row.last_login || "从未登录" }}</span>
            </div>
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
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="user-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="Message" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="!form.id">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password :prefix-icon="Lock" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请确认密码"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="超级管理员" value="admin">
                  <el-tag type="danger" size="small">超级管理员</el-tag>
                </el-option>
                <el-option label="编辑员" value="editor">
                  <el-tag type="warning" size="small">编辑员</el-tag>
                </el-option>
                <el-option label="查看员" value="viewer">
                  <el-tag type="info" size="small">查看员</el-tag>
                </el-option>
              </el-select>
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="accountManage">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, User, Search, Message, Refresh, Clock, Calendar, Edit, Delete, Lock } from "@element-plus/icons-vue";
import {
  getUserListApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  type User as UserType,
  type UserListParams
} from "@/api/modules/user";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  username: "",
  email: "",
  status: null
});

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<UserType[]>([]);

// 表单数据
const form = reactive({
  id: null,
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "viewer",
  status: 1
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在 3 到 20 个字符", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== form.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }]
};

// 获取角色类型
const getRoleType = (role: string) => {
  const types = {
    admin: "danger",
    editor: "warning",
    viewer: "info"
  };
  return types[role] || "info";
};

// 获取角色名称
const getRoleName = (role: string) => {
  const names = {
    admin: "超级管理员",
    editor: "编辑员",
    viewer: "查看员"
  };
  return names[role] || role;
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    username: "",
    email: "",
    status: null
  });
  handleSearch();
};

// 添加
const handleAdd = () => {
  dialogTitle.value = "添加用户";
  Object.assign(form, {
    id: null,
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "viewer",
    status: 1
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: UserType) => {
  dialogTitle.value = "编辑用户";
  Object.assign(form, { ...row, confirmPassword: "" });
  dialogVisible.value = true;
};

// 删除
const handleDelete = (row: UserType) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？删除后无法恢复！`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteUserApi(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 状态切换
const handleStatusChange = async (row: UserType) => {
  try {
    await updateUserApi(row.id, { status: row.status });
    ElMessage.success(row.status ? "用户已启用" : "用户已禁用");
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
        const submitData = { ...form };
        delete submitData.confirmPassword;

        if (form.id) {
          await updateUserApi(form.id, submitData);
          ElMessage.success("更新成功");
        } else {
          await createUserApi(submitData);
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
    const params: UserListParams = {
      page: pagination.current,
      size: pagination.size,
      username: searchForm.username || undefined,
      email: searchForm.email || undefined,
      status: searchForm.status || undefined
    };

    const { data } = await getUserListApi(params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取用户列表失败");
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
.user-management {
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

/* 用户信息 */
.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
}
.user-avatar {
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.username {
  font-weight: 500;
}
.email-info {
  display: flex;
  gap: 6px;
  align-items: center;
}
.email-icon {
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
.user-form {
  padding: 0 20px;
}
.dialog-footer {
  text-align: right;
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
