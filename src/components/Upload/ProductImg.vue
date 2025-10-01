<template>
  <div class="product-upload-box">
    <el-upload
      :id="uuid"
      :action="uploadUrl"
      :class="['upload', self_disabled ? 'disabled' : '', drag ? 'no-border' : '']"
      :multiple="false"
      :disabled="self_disabled"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="uploadSuccess"
      :on-error="uploadError"
      :drag="drag"
      :accept="fileType.join(',')"
    >
      <template v-if="imageUrl">
        <img :src="imageUrl" class="upload-image" />
        <div class="upload-handle" @click.stop>
          <div v-if="!self_disabled" class="handle-icon" @click="editImg">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </div>
          <div class="handle-icon" @click="imgViewVisible = true">
            <el-icon><ZoomIn /></el-icon>
            <span>查看</span>
          </div>
          <div v-if="!self_disabled" class="handle-icon" @click="deleteImg">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="upload-empty">
          <slot name="empty">
            <el-icon><Plus /></el-icon>
            <span>请上传图片</span>
          </slot>
        </div>
      </template>
    </el-upload>
    <div class="el-upload__tip">
      <slot name="tip"></slot>
    </div>
    <el-image-viewer v-if="imgViewVisible" :url-list="[imageUrl]" @close="imgViewVisible = false" />
  </div>
</template>

<script setup lang="ts" name="ProductUploadImg">
import { ref, computed, inject } from "vue";
import { generateUUID } from "@/utils";
import { ElMessage, formContextKey, formItemContextKey } from "element-plus";
import { Edit, ZoomIn, Delete, Plus } from "@element-plus/icons-vue";
import type { UploadProps } from "element-plus";

interface ProductUploadImgProps {
  imageUrl: string; // 图片地址 ==> 必传
  drag?: boolean; // 是否支持拖拽上传 ==> 非必传（默认为 true）
  disabled?: boolean; // 是否禁用上传组件 ==> 非必传（默认为 false）
  fileSize?: number; // 图片大小限制 ==> 非必传（默认为 2M，与商品上传保持一致）
  fileType?: string[]; // 图片类型限制 ==> 非必传（默认为常见图片格式）
  height?: string; // 组件高度 ==> 非必传（默认为 150px）
  width?: string; // 组件宽度 ==> 非必传（默认为 150px）
  borderRadius?: string; // 组件边框圆角 ==> 非必传（默认为 8px）
}

// 接受父组件参数
const props = withDefaults(defineProps<ProductUploadImgProps>(), {
  imageUrl: "",
  drag: true,
  disabled: false,
  fileSize: 2,
  fileType: () => ["image/jpeg", "image/png", "image/gif", "image/webp"],
  height: "150px",
  width: "150px",
  borderRadius: "8px"
});

// 生成组件唯一id
const uuid = ref("id-" + generateUUID());

// 查看图片
const imgViewVisible = ref(false);

// 获取 el-form 组件上下文
const formContext = inject(formContextKey, void 0);
// 获取 el-form-item 组件上下文
const formItemContext = inject(formItemContextKey, void 0);

// 判断是否禁用上传和删除
const self_disabled = computed(() => {
  return props.disabled || formContext?.disabled;
});

// 上传URL - 使用与添加商品相同的接口
const uploadUrl = computed(() => {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${baseURL}/admin/upload/image`;
});

// 定义事件
const emit = defineEmits<{
  "update:imageUrl": [value: string];
  "update:image-url": [value: string];
}>();

/**
 * @description 删除图片
 */
const deleteImg = () => {
  emit("update:imageUrl", "");
  emit("update:image-url", "");
};

/**
 * @description 编辑图片
 */
const editImg = () => {
  const dom = document.querySelector(`#${uuid.value} .el-upload__input`);
  dom && dom.dispatchEvent(new MouseEvent("click"));
};

/**
 * @description 文件上传之前判断
 * @param rawFile 选择的文件
 */
const beforeUpload: UploadProps["beforeUpload"] = rawFile => {
  const isImage = rawFile.type.startsWith("image/");
  const isLtSize = rawFile.size / 1024 / 1024 < props.fileSize;
  const isValidType = props.fileType.includes(rawFile.type);

  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isValidType) {
    ElMessage.error(`上传图片格式不正确，支持格式：${props.fileType.join(", ")}`);
    return false;
  }
  if (!isLtSize) {
    ElMessage.error(`图片大小不能超过 ${props.fileSize}MB!`);
    return false;
  }
  return true;
};

/**
 * @description 图片上传成功
 * @param response 服务器响应
 */
const uploadSuccess = (response: any) => {
  // 处理后端返回的数据 - 与添加商品保持一致的数据格式
  if (response && response.success && response.data && response.data.url) {
    emit("update:imageUrl", response.data.url);
    emit("update:image-url", response.data.url);
    ElMessage.success("图片上传成功!");

    // 调用 el-form 内部的校验方法（可自动校验）
    formItemContext?.prop && formContext?.validateField([formItemContext.prop as string]);
  } else {
    ElMessage.error("图片上传失败: " + (response.error || "未知错误"));
  }
};

/**
 * @description 图片上传错误
 */
const uploadError = () => {
  ElMessage.error("图片上传失败，请重新上传!");
};
</script>

<style scoped lang="scss">
.product-upload-box {
  display: inline-block;

  .upload {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background-color: var(--el-fill-color-lighter);
    border: 1px dashed var(--el-border-color-darker);
    border-radius: v-bind(borderRadius);
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }

    :deep(.el-upload) {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      outline: none;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    :deep(.el-upload-dragger) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: v-bind(width);
      height: v-bind(height);
      padding: 0;
      background-color: var(--el-fill-color-lighter);
      border: 1px dashed var(--el-border-color-darker);
      border-radius: v-bind(borderRadius);
      cursor: pointer;
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    .upload-image {
      display: block;
      width: v-bind(width);
      height: v-bind(height);
      object-fit: cover;
      border-radius: v-bind(borderRadius);
    }

    .upload-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: v-bind(width);
      height: v-bind(height);
      color: var(--el-text-color-placeholder);

      .el-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }

      span {
        font-size: 14px;
      }
    }

    .upload-handle {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: var(--el-transition-duration-fast);

      &:hover {
        opacity: 1;
      }

      .handle-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px;
        margin: 0 6px;
        color: aliceblue;
        cursor: pointer;
        transition: var(--el-transition-duration-fast);

        &:hover {
          color: var(--el-color-primary);
        }

        .el-icon {
          margin-bottom: 2px;
          font-size: 16px;
        }

        span {
          font-size: 12px;
        }
      }
    }
  }

  .no-border {
    :deep(.el-upload-dragger) {
      border: none !important;
    }
  }

  .disabled {
    :deep(.el-upload),
    :deep(.el-upload-dragger) {
      cursor: not-allowed !important;
      background: var(--el-disabled-bg-color);
      border: 1px dashed var(--el-border-color-darker) !important;

      &:hover {
        border: 1px dashed var(--el-border-color-darker) !important;
      }
    }
  }

  .el-upload__tip {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-align: center;
  }
}

.is-error {
  .upload {
    :deep(.el-upload),
    :deep(.el-upload-dragger) {
      border: 1px dashed var(--el-color-danger) !important;

      &:hover {
        border-color: var(--el-color-primary) !important;
      }
    }
  }
}
</style>
