<template>
  <el-card class="europe-time-card" shadow="hover">
    <div class="time-content">
      <div class="time-icon">
        <el-icon :size="32" color="#409EFF">
          <Clock />
        </el-icon>
      </div>
      <div class="time-info">
        <div class="time-row">
          <div class="time-section">
            <div class="time-label">东欧时间 (EET)</div>
            <div class="time-value">{{ eetTime }}</div>
            <div class="time-date">{{ eetDate }}</div>
          </div>
          <div class="time-divider"></div>
          <div class="time-section">
            <div class="time-label">北京时间</div>
            <div class="time-value">{{ beijingTime }}</div>
            <div class="time-date">{{ beijingDate }}</div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Clock } from "@element-plus/icons-vue";

const eetTime = ref("");
const eetDate = ref("");
const beijingTime = ref("");
const beijingDate = ref("");
let timer: number | null = null;

// 格式化时间和日期
const formatTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
};

// 更新时间
const updateTime = () => {
  const now = new Date();

  // 东欧时间 (EET) UTC+2
  const eetDateTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Athens" }));
  eetTime.value = formatTime(eetDateTime);
  eetDate.value = formatDate(eetDateTime);

  // 北京时间 (CST) UTC+8
  const beijingDateTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  beijingTime.value = formatTime(beijingDateTime);
  beijingDate.value = formatDate(beijingDateTime);
};

onMounted(() => {
  updateTime();
  // 每秒更新一次时间
  timer = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped lang="scss">
.europe-time-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  transition: all 0.3s;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px 0 rgb(0 0 0 / 15%);
  }
}

.time-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px;
}

.time-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.time-info {
  flex: 1;
}

.time-row {
  display: flex;
  gap: 30px;
  align-items: center;
}

.time-section {
  flex: 1;
}

.time-divider {
  width: 2px;
  height: 80px;
  background: linear-gradient(180deg, transparent, #e4e7ed, transparent);
}

.time-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.time-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  font-family: "Arial", sans-serif;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.time-date {
  font-size: 13px;
  color: #606266;
}
</style>
