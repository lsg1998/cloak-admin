<template>
  <div class="pixel-templates">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>像素模板管理</h2>
      <p>管理常用的像素配置模板，快速应用到商品</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleCreateTemplate">
        <el-icon><Plus /></el-icon>
        新建模板
      </el-button>
      <el-button @click="handleImportTemplate">
        <el-icon><Upload /></el-icon>
        导入模板
      </el-button>
      <el-button @click="handleExportTemplate">
        <el-icon><Download /></el-icon>
        导出模板
      </el-button>
    </div>

    <!-- 模板列表 -->
    <el-card class="templates-card" shadow="never">
      <div class="templates-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          :class="{ active: selectedTemplate?.id === template.id }"
          @click="handleSelectTemplate(template)"
        >
          <div class="template-header">
            <div class="template-title">
              <h3>{{ template.name }}</h3>
              <el-tag :type="getTemplateTypeColor(template.type)" size="small">
                {{ getTemplateTypeName(template.type) }}
              </el-tag>
            </div>
            <div class="template-actions">
              <el-button size="small" type="primary" link @click.stop="handleEditTemplate(template)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" type="danger" link @click.stop="handleDeleteTemplate(template)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="template-description">
            <p>{{ template.description }}</p>
          </div>

          <div class="template-platforms">
            <div class="platform-tags">
              <el-tag
                v-for="platform in getEnabledPlatforms(template.config)"
                :key="platform"
                :type="getPlatformType(platform)"
                size="small"
                class="platform-tag"
              >
                {{ getPlatformName(platform) }}
              </el-tag>
            </div>
          </div>

          <div class="template-footer">
            <div class="template-stats">
              <span class="stat-item">
                <el-icon><User /></el-icon>
                使用 {{ template.usageCount }} 次
              </span>
              <span class="stat-item">
                <el-icon><Calendar /></el-icon>
                {{ template.updatedAt }}
              </span>
            </div>
            <div class="template-apply">
              <el-button size="small" type="success" @click.stop="handleApplyTemplate(template)">
                <el-icon><Check /></el-icon>
                应用
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 模板详情 -->
    <el-card v-if="selectedTemplate" class="template-detail" shadow="never">
      <template #header>
        <div class="detail-header">
          <span>模板详情 - {{ selectedTemplate.name }}</span>
          <div class="detail-actions">
            <el-button size="small" @click="handleEditTemplate(selectedTemplate)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="success" @click="handleApplyTemplate(selectedTemplate)">
              <el-icon><Check /></el-icon>
              应用到商品
            </el-button>
          </div>
        </div>
      </template>

      <div class="template-config">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="Google Ads" name="google_ads">
            <div class="config-section">
              <el-form :model="selectedTemplate.config.google_ads" label-width="120px">
                <el-form-item label="启用状态">
                  <el-switch v-model="selectedTemplate.config.google_ads.enabled" disabled />
                </el-form-item>
                <el-form-item label="转化ID">
                  <el-input v-model="selectedTemplate.config.google_ads.conversion_id" disabled placeholder="AW-XXXXXXXXX" />
                </el-form-item>
                <el-form-item label="转化标签">
                  <el-input
                    v-model="selectedTemplate.config.google_ads.conversion_label"
                    disabled
                    placeholder="AbCdEfGhIjKlMnOp"
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Facebook" name="facebook">
            <div class="config-section">
              <el-form :model="selectedTemplate.config.facebook" label-width="120px">
                <el-form-item label="启用状态">
                  <el-switch v-model="selectedTemplate.config.facebook.enabled" disabled />
                </el-form-item>
                <el-form-item label="像素ID">
                  <el-input v-model="selectedTemplate.config.facebook.pixel_id" disabled placeholder="123456789012345" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="TikTok" name="tiktok">
            <div class="config-section">
              <el-form :model="selectedTemplate.config.tiktok" label-width="120px">
                <el-form-item label="启用状态">
                  <el-switch v-model="selectedTemplate.config.tiktok.enabled" disabled />
                </el-form-item>
                <el-form-item label="像素ID">
                  <el-input v-model="selectedTemplate.config.tiktok.pixel_id" disabled placeholder="C1234567890ABCDEF" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="自定义像素" name="custom">
            <div class="config-section">
              <div v-if="selectedTemplate.config.custom.length === 0" class="empty-custom">
                <el-empty description="暂无自定义像素" />
              </div>
              <div v-else>
                <div v-for="(custom, index) in selectedTemplate.config.custom" :key="index" class="custom-pixel-item">
                  <div class="custom-pixel-header">
                    <span class="custom-pixel-name">{{ custom.name }}</span>
                    <el-tag :type="custom.enabled ? 'success' : 'info'" size="small">
                      {{ custom.enabled ? "启用" : "禁用" }}
                    </el-tag>
                  </div>
                  <div class="custom-pixel-code">
                    <pre><code>{{ custom.code }}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 新建/编辑模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="isEdit ? '编辑模板' : '新建模板'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="templateFormRef" :model="templateForm" :rules="templateRules" label-width="120px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="模板类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="请选择模板类型">
            <el-option label="通用模板" value="general" />
            <el-option label="Google Ads专用" value="google_ads" />
            <el-option label="Facebook专用" value="facebook" />
            <el-option label="TikTok专用" value="tiktok" />
            <el-option label="多平台组合" value="multi_platform" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板描述" prop="description">
          <el-input v-model="templateForm.description" type="textarea" :rows="3" placeholder="请输入模板描述" />
        </el-form-item>

        <el-form-item label="像素配置">
          <el-tabs v-model="configActiveTab" type="card">
            <el-tab-pane label="Google Ads" name="google_ads">
              <div class="config-form">
                <el-form-item label="启用状态">
                  <el-switch v-model="templateForm.config.google_ads.enabled" />
                </el-form-item>
                <el-form-item label="转化ID" prop="config.google_ads.conversion_id">
                  <el-input v-model="templateForm.config.google_ads.conversion_id" placeholder="AW-XXXXXXXXX" />
                </el-form-item>
                <el-form-item label="转化标签" prop="config.google_ads.conversion_label">
                  <el-input v-model="templateForm.config.google_ads.conversion_label" placeholder="AbCdEfGhIjKlMnOp" />
                </el-form-item>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Facebook" name="facebook">
              <div class="config-form">
                <el-form-item label="启用状态">
                  <el-switch v-model="templateForm.config.facebook.enabled" />
                </el-form-item>
                <el-form-item label="像素ID" prop="config.facebook.pixel_id">
                  <el-input v-model="templateForm.config.facebook.pixel_id" placeholder="123456789012345" />
                </el-form-item>
              </div>
            </el-tab-pane>

            <el-tab-pane label="TikTok" name="tiktok">
              <div class="config-form">
                <el-form-item label="启用状态">
                  <el-switch v-model="templateForm.config.tiktok.enabled" />
                </el-form-item>
                <el-form-item label="像素ID" prop="config.tiktok.pixel_id">
                  <el-input v-model="templateForm.config.tiktok.pixel_id" placeholder="C1234567890ABCDEF" />
                </el-form-item>
              </div>
            </el-tab-pane>

            <el-tab-pane label="自定义像素" name="custom">
              <div class="custom-pixel-config">
                <div class="custom-pixel-header">
                  <el-button type="primary" size="small" @click="handleAddCustomPixel">
                    <el-icon><Plus /></el-icon>
                    添加自定义像素
                  </el-button>
                </div>

                <div v-for="(custom, index) in templateForm.config.custom" :key="index" class="custom-pixel-item">
                  <div class="custom-pixel-form">
                    <el-form-item label="名称" :prop="`config.custom.${index}.name`">
                      <el-input v-model="custom.name" placeholder="像素名称" />
                    </el-form-item>
                    <el-form-item label="启用">
                      <el-switch v-model="custom.enabled" />
                    </el-form-item>
                    <el-button type="danger" size="small" @click="handleRemoveCustomPixel(index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-form-item label="代码" :prop="`config.custom.${index}.code`">
                    <el-input v-model="custom.code" type="textarea" :rows="4" placeholder="请输入像素代码" />
                  </el-form-item>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTemplate" :loading="saveLoading">
            {{ isEdit ? "更新" : "创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 应用模板对话框 -->
    <el-dialog v-model="applyDialogVisible" title="应用模板到商品" width="600px" :close-on-click-modal="false">
      <el-form :model="applyForm" label-width="120px">
        <el-form-item label="选择商品">
          <el-select v-model="applyForm.productIds" multiple filterable placeholder="请选择要应用模板的商品" style="width: 100%">
            <el-option v-for="product in productList" :key="product.id" :label="product.title" :value="product.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="应用方式">
          <el-radio-group v-model="applyForm.mode">
            <el-radio label="replace">替换现有配置</el-radio>
            <el-radio label="merge">合并现有配置</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmApply" :loading="applyLoading"> 确认应用 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PixelTemplates">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload, Download, Edit, Delete, Check, User, Calendar } from "@element-plus/icons-vue";
import { getProductListApi, type Product } from "@/api/modules/product";

// 响应式数据
const templateDialogVisible = ref(false);
const applyDialogVisible = ref(false);
const saveLoading = ref(false);
const applyLoading = ref(false);
const isEdit = ref(false);
const selectedTemplate = ref<any>(null);
const activeTab = ref("google_ads");
const configActiveTab = ref("google_ads");
const productList = ref<Product[]>([]);

// 模板列表 - 从后端API加载
const templates = ref([]);

// 模板表单
const templateForm = reactive({
  name: "",
  type: "general",
  description: "",
  config: {
    google_ads: {
      enabled: false,
      conversion_id: "",
      conversion_label: ""
    },
    facebook: {
      enabled: false,
      pixel_id: ""
    },
    tiktok: {
      enabled: false,
      pixel_id: ""
    },
    custom: []
  }
});

// 应用表单
const applyForm = reactive({
  productIds: [],
  mode: "replace"
});

// 表单验证规则
const templateRules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择模板类型", trigger: "change" }],
  description: [{ required: true, message: "请输入模板描述", trigger: "blur" }]
};

// 选择模板
const handleSelectTemplate = (template: any) => {
  selectedTemplate.value = template;
  activeTab.value = "google_ads";
};

// 新建模板
const handleCreateTemplate = () => {
  isEdit.value = false;
  resetTemplateForm();
  templateDialogVisible.value = true;
};

// 编辑模板
const handleEditTemplate = (template: any) => {
  isEdit.value = true;
  Object.assign(templateForm, {
    ...template,
    config: JSON.parse(JSON.stringify(template.config))
  });
  templateDialogVisible.value = true;
};

// 删除模板
const handleDeleteTemplate = (template: any) => {
  ElMessageBox.confirm(`确定要删除模板 "${template.name}" 吗？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    const index = templates.value.findIndex(t => t.id === template.id);
    if (index > -1) {
      templates.value.splice(index, 1);
      ElMessage.success("模板删除成功");
    }
  });
};

// 应用模板
const handleApplyTemplate = (template: any) => {
  selectedTemplate.value = template;
  applyForm.productIds = [];
  applyForm.mode = "replace";
  applyDialogVisible.value = true;
};

// 添加自定义像素
const handleAddCustomPixel = () => {
  templateForm.config.custom.push({
    name: "",
    enabled: true,
    code: ""
  });
};

// 删除自定义像素
const handleRemoveCustomPixel = (index: number) => {
  templateForm.config.custom.splice(index, 1);
};

// 保存模板
const handleSaveTemplate = async () => {
  saveLoading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEdit.value) {
      // 更新模板
      const index = templates.value.findIndex(t => t.id === selectedTemplate.value?.id);
      if (index > -1) {
        templates.value[index] = {
          ...templates.value[index],
          ...templateForm,
          updatedAt: new Date().toISOString().split("T")[0]
        };
      }
      ElMessage.success("模板更新成功");
    } else {
      // 创建新模板
      const newTemplate = {
        ...templateForm,
        id: Date.now().toString(),
        usageCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0]
      };
      templates.value.unshift(newTemplate);
      ElMessage.success("模板创建成功");
    }

    templateDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("保存失败");
  } finally {
    saveLoading.value = false;
  }
};

// 确认应用
const handleConfirmApply = async () => {
  if (applyForm.productIds.length === 0) {
    ElMessage.warning("请选择要应用模板的商品");
    return;
  }

  applyLoading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新使用次数
    if (selectedTemplate.value) {
      selectedTemplate.value.usageCount += applyForm.productIds.length;
    }

    ElMessage.success(`模板已成功应用到 ${applyForm.productIds.length} 个商品`);
    applyDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("应用失败");
  } finally {
    applyLoading.value = false;
  }
};

// 导入模板
const handleImportTemplate = () => {
  ElMessage.info("导入模板功能开发中...");
};

// 导出模板
const handleExportTemplate = () => {
  ElMessage.info("导出模板功能开发中...");
};

// 重置模板表单
const resetTemplateForm = () => {
  Object.assign(templateForm, {
    name: "",
    type: "general",
    description: "",
    config: {
      google_ads: {
        enabled: false,
        conversion_id: "",
        conversion_label: ""
      },
      facebook: {
        enabled: false,
        pixel_id: ""
      },
      tiktok: {
        enabled: false,
        pixel_id: ""
      },
      custom: []
    }
  });
};

// 获取模板类型颜色
const getTemplateTypeColor = (type: string) => {
  const colors = {
    general: "info",
    google_ads: "success",
    facebook: "primary",
    tiktok: "warning",
    multi_platform: "danger"
  };
  return colors[type] || "info";
};

// 获取模板类型名称
const getTemplateTypeName = (type: string) => {
  const names = {
    general: "通用",
    google_ads: "Google Ads",
    facebook: "Facebook",
    tiktok: "TikTok",
    multi_platform: "多平台"
  };
  return names[type] || "未知";
};

// 获取启用的平台
const getEnabledPlatforms = (config: any) => {
  const platforms = [];
  if (config.google_ads?.enabled) platforms.push("google_ads");
  if (config.facebook?.enabled) platforms.push("facebook");
  if (config.tiktok?.enabled) platforms.push("tiktok");
  if (config.custom?.length > 0) platforms.push("custom");
  return platforms;
};

// 获取平台类型
const getPlatformType = (platform: string) => {
  const types = {
    google_ads: "success",
    facebook: "primary",
    tiktok: "warning",
    custom: "info"
  };
  return types[platform] || "info";
};

// 获取平台名称
const getPlatformName = (platform: string) => {
  const names = {
    google_ads: "Google Ads",
    facebook: "Facebook",
    tiktok: "TikTok",
    custom: "自定义"
  };
  return names[platform] || "未知";
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
});
</script>

<style scoped>
.pixel-templates {
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

.action-bar {
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
}

.templates-card {
  margin-bottom: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.template-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.template-card.active {
  border-color: #409eff;
  background: #f0f8ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.template-title {
  flex: 1;
}

.template-title h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.template-description {
  margin-bottom: 16px;
}

.template-description p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.template-platforms {
  margin-bottom: 16px;
}

.platform-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.platform-tag {
  font-size: 12px;
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.template-apply {
  flex-shrink: 0;
}

.template-detail {
  margin-bottom: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.template-config {
  padding: 20px 0;
}

.config-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.empty-custom {
  text-align: center;
  padding: 40px 0;
}

.custom-pixel-item {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.custom-pixel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.custom-pixel-name {
  font-weight: 500;
  color: #303133;
}

.custom-pixel-code {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
}

.custom-pixel-code pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

.config-form {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.custom-pixel-config {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.custom-pixel-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.custom-pixel-form .el-form-item {
  margin-bottom: 0;
}

.dialog-footer {
  text-align: right;
}
</style>
