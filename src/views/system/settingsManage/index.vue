<template>
  <div class="main-box">
    <TreeFilter label="网站设置" title="网站设置管理" />
    <div class="table-box">
      <!-- 网站基本信息卡片 -->
      <el-card class="box-card" style="margin-bottom: 20px">
        <template #header>
          <div class="card-header">
            <span>网站基本信息</span>
            <el-button type="primary" @click="handleSave">保存设置</el-button>
          </div>
        </template>

        <el-form :model="websiteSettings" :rules="rules" ref="settingsFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="网站名称" prop="site_name">
                <el-input v-model="websiteSettings.site_name" placeholder="请输入网站名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="默认语言" prop="default_language">
                <el-select v-model="websiteSettings.default_language" placeholder="请选择默认语言" style="width: 100%">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="繁体中文" value="zh-TW" />
                  <el-option label="English" value="en-US" />
                  <el-option label="日本語" value="ja-JP" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="每页显示条数" prop="items_per_page">
                <el-input-number v-model="websiteSettings.items_per_page" :min="10" :max="100" :step="10" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上传文件大小" prop="upload_max_size">
                <el-input-number v-model="uploadMaxSizeMB" :min="1" :max="100" :step="1" style="width: 100%" />
                <span style="margin-left: 10px; color: #909399">MB</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="网站Logo">
            <div class="logo-upload-container">
              <div class="logo-preview" v-if="websiteSettings.site_logo">
                <img :src="getLogoUrl(websiteSettings.site_logo)" alt="网站Logo" />
              </div>
              <div class="logo-placeholder" v-else>
                <el-icon><Picture /></el-icon>
                <span>暂无Logo</span>
              </div>
              <div class="logo-actions">
                <el-upload
                  ref="uploadRef"
                  :show-file-list="false"
                  :before-upload="beforeLogoUpload"
                  :http-request="handleLogoUpload"
                  accept="image/*"
                >
                  <el-button type="primary" :icon="Upload">上传Logo</el-button>
                </el-upload>
                <el-button v-if="websiteSettings.site_logo" type="danger" :icon="Delete" @click="handleRemoveLogo">
                  删除Logo
                </el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 操作按钮卡片 -->
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>快捷操作</span>
          </div>
        </template>

        <div class="action-buttons">
          <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新设置</el-button>
          <el-button type="warning" :icon="RefreshRight" @click="handleReset">重置为默认值</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts" name="settingsManage">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox, FormInstance, FormRules, UploadRequestOptions } from "element-plus";
import { Picture, Upload, Delete, Refresh, RefreshRight } from "@element-plus/icons-vue";
import TreeFilter from "@/components/TreeFilter/index.vue";
import {
  getWebsiteSettingsApi,
  updateWebsiteSettingsApi,
  resetWebsiteSettingsApi,
  uploadLogoApi,
  updateSettingApi
} from "@/api/modules/settings";

// 表单引用
const settingsFormRef = ref<FormInstance>();

// 网站设置数据
const websiteSettings = reactive({
  site_name: "",
  site_logo: "",
  default_language: "zh-CN",
  items_per_page: 20,
  upload_max_size: 10485760
});

// 计算属性：将字节转换为MB显示
const uploadMaxSizeMB = computed({
  get: () => Math.round(websiteSettings.upload_max_size / 1024 / 1024),
  set: (value: number) => {
    websiteSettings.upload_max_size = value * 1024 * 1024;
  }
});

// 表单验证规则
const rules: FormRules = {
  site_name: [
    { required: true, message: "请输入网站名称", trigger: "blur" },
    { min: 2, max: 50, message: "网站名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  default_language: [{ required: true, message: "请选择默认语言", trigger: "change" }],
  items_per_page: [
    { required: true, message: "请输入每页显示条数", trigger: "blur" },
    { type: "number", min: 10, max: 100, message: "每页显示条数在 10 到 100 之间", trigger: "blur" }
  ]
};

// 获取网站设置
const getWebsiteSettings = async () => {
  try {
    const { data } = await getWebsiteSettingsApi();

    // 更新设置数据
    if (data.site_name) {
      websiteSettings.site_name = data.site_name.value;
    }
    if (data.site_logo) {
      websiteSettings.site_logo = data.site_logo.value;
    }
    if (data.default_language) {
      websiteSettings.default_language = data.default_language.value;
    }
    if (data.items_per_page) {
      websiteSettings.items_per_page = parseInt(data.items_per_page.value);
    }
    if (data.upload_max_size) {
      websiteSettings.upload_max_size = parseInt(data.upload_max_size.value);
    }
  } catch (error) {
    ElMessage.error("获取网站设置失败");
  }
};

// 保存设置
const handleSave = async () => {
  if (!settingsFormRef.value) return;

  try {
    await settingsFormRef.value.validate();

    const updateData = {
      site_name: websiteSettings.site_name,
      default_language: websiteSettings.default_language,
      items_per_page: websiteSettings.items_per_page.toString(),
      upload_max_size: websiteSettings.upload_max_size.toString()
    };

    await updateWebsiteSettingsApi(updateData);
    ElMessage.success("网站设置保存成功");
  } catch (error) {
    ElMessage.error("保存网站设置失败");
  }
};

// 刷新设置
const handleRefresh = () => {
  getWebsiteSettings();
  ElMessage.success("设置已刷新");
};

// 重置为默认值
const handleReset = async () => {
  try {
    await ElMessageBox.confirm("确定要重置所有网站设置为默认值吗？此操作不可撤销！", "重置确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    await resetWebsiteSettingsApi();
    await getWebsiteSettings();
    ElMessage.success("网站设置已重置为默认值");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("重置网站设置失败");
    }
  }
};

// Logo上传前验证
const beforeLogoUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("上传图片大小不能超过 2MB!");
    return false;
  }
  return true;
};

// 处理Logo上传
const handleLogoUpload = async (options: UploadRequestOptions) => {
  try {
    const { data } = await uploadLogoApi(options.file as File);
    websiteSettings.site_logo = data.logo_url;
    ElMessage.success("Logo上传成功");
  } catch (error) {
    ElMessage.error("Logo上传失败");
  }
};

// 删除Logo
const handleRemoveLogo = async () => {
  try {
    await ElMessageBox.confirm("确定要删除当前Logo吗？", "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    await updateSettingApi("site_logo", { value: "" });
    websiteSettings.site_logo = "";
    ElMessage.success("Logo删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除Logo失败");
    }
  }
};

// 获取Logo URL
const getLogoUrl = (logoPath: string) => {
  if (logoPath.startsWith("http")) {
    return logoPath;
  }
  return `${import.meta.env.VITE_API_URL}${logoPath}`;
};

// 页面初始化
onMounted(() => {
  getWebsiteSettings();
});
</script>

<style scoped lang="scss">
.main-box {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-upload-container {
    display: flex;
    align-items: center;
    gap: 20px;

    .logo-preview {
      width: 100px;
      height: 100px;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .logo-placeholder {
      width: 100px;
      height: 100px;
      border: 1px dashed #dcdfe6;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 12px;

      .el-icon {
        font-size: 24px;
        margin-bottom: 5px;
      }
    }

    .logo-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 15px;
  }
}
</style>
