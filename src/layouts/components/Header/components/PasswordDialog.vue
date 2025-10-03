<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="500px" draggable :close-on-click-modal="false">
    <el-form ref="formRef" :model="passwordForm" :rules="rules" label-width="100px">
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password clearable />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password clearable />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { changePasswordApi } from "@/api/modules/login";

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

// 验证确认密码
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("请再次输入新密码"));
  } else if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

// 表单验证规则
const rules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: "请输入旧密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
});

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true;
};

// 取消
const handleCancel = () => {
  formRef.value?.resetFields();
  dialogVisible.value = false;
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    try {
      loading.value = true;
      await changePasswordApi({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      });

      ElMessage.success("密码修改成功，请重新登录");
      formRef.value?.resetFields();
      dialogVisible.value = false;

      // 延迟1秒后跳转到登录页
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error: any) {
      ElMessage.error(error.message || "密码修改失败");
    } finally {
      loading.value = false;
    }
  });
};

defineExpose({ openDialog });
</script>
