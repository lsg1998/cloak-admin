<template>
  <el-dialog v-model="visible" title="选择导出字段" width="600px" :close-on-click-modal="false" @close="handleClose">
    <div class="export-dialog">
      <div class="dialog-content">
        <div class="field-selection">
          <div class="selection-header">
            <div class="header-left">
              <span class="title">选择要导出的字段</span>
              <span class="subtitle">已选择 {{ selectedFields.length }} 个字段</span>
            </div>
            <div class="header-right">
              <el-button size="small" @click="selectAll">全选</el-button>
              <el-button size="small" @click="selectNone">全不选</el-button>
              <el-button size="small" @click="selectDefault">默认</el-button>
            </div>
          </div>

          <div class="field-list">
            <el-checkbox-group v-model="selectedFields" class="field-checkboxes">
              <div class="field-group" v-for="group in fieldGroups" :key="group.title">
                <div class="group-title">{{ group.title }}</div>
                <div class="group-fields">
                  <el-checkbox
                    v-for="field in group.fields"
                    :key="field.key"
                    :value="field.key"
                    :label="field.label"
                    class="field-checkbox"
                  />
                </div>
              </div>
            </el-checkbox-group>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="selectedFields.length === 0"> 确认导出 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

// 定义字段类型
interface ExportField {
  key: string;
  label: string;
  group: string;
}

// 定义字段组类型
interface FieldGroup {
  title: string;
  fields: ExportField[];
}

// Props
interface Props {
  modelValue: boolean;
  availableFields: ExportField[];
}

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", fields: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  availableFields: () => []
});

const emit = defineEmits<Emits>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const selectedFields = ref<string[]>([]);

// 字段分组
const fieldGroups = computed<FieldGroup[]>(() => {
  const groups: { [key: string]: ExportField[] } = {};

  props.availableFields.forEach(field => {
    if (!groups[field.group]) {
      groups[field.group] = [];
    }
    groups[field.group].push(field);
  });

  return Object.entries(groups).map(([title, fields]) => ({
    title,
    fields
  }));
});

// 默认选中的字段（当前表格显示的字段）
const defaultFields = [
  "customer_name",
  "phone",
  "province",
  "city",
  "district",
  "address",
  "postal_code",
  "total_amount",
  "currency",
  "payment_method",
  "status",
  "created_at"
];

// 监听对话框显示状态
watch(visible, newVal => {
  if (newVal) {
    // 对话框打开时，默认选择当前表格显示的字段
    selectedFields.value = defaultFields.filter(field => props.availableFields.some(af => af.key === field));
  }
});

// 方法
const selectAll = () => {
  selectedFields.value = props.availableFields.map(field => field.key);
};

const selectNone = () => {
  selectedFields.value = [];
};

const selectDefault = () => {
  selectedFields.value = defaultFields.filter(field => props.availableFields.some(af => af.key === field));
};

const handleClose = () => {
  visible.value = false;
};

const handleConfirm = () => {
  if (selectedFields.value.length === 0) {
    return;
  }

  emit("confirm", selectedFields.value);
  visible.value = false;
};
</script>

<style scoped lang="scss">
.export-dialog {
  .dialog-content {
    .field-selection {
      .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #ebeef5;

        .header-left {
          .title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            display: block;
            margin-bottom: 5px;
          }

          .subtitle {
            font-size: 14px;
            color: #909399;
          }
        }

        .header-right {
          .el-button {
            margin-left: 8px;
          }
        }
      }

      .field-list {
        max-height: 400px;
        overflow-y: auto;

        .field-checkboxes {
          .field-group {
            margin-bottom: 20px;

            .group-title {
              font-size: 14px;
              font-weight: 600;
              color: #606266;
              margin-bottom: 10px;
              padding-left: 8px;
              border-left: 3px solid #409eff;
            }

            .group-fields {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 8px;

              .field-checkbox {
                margin: 0;

                :deep(.el-checkbox__label) {
                  font-size: 13px;
                  color: #606266;
                }
              }
            }
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
