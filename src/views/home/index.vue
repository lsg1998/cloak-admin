<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card class="welcome-card" shadow="never">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1>欢迎使用订单管理系统</h1>
            <p>实时监控订单数据，高效管理业务流程</p>
          </div>
          <div class="welcome-image">
            <img src="@/assets/images/welcome.png" alt="welcome" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 订单统计区域 -->
    <div class="statistics-section">
      <OrderStatistics />
    </div>
  </div>
</template>

<script setup lang="ts" name="home">
import OrderStatistics from "@/components/OrderStatistics/index.vue";
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.welcome-text {
  flex: 1;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #606266;
    margin: 0;
  }
}

.welcome-image {
  flex-shrink: 0;
  margin-left: 40px;

  img {
    width: 200px;
    height: auto;
  }
}

.statistics-section {
  width: 100%;
}

/* 响应式设计 */
@media (width <= 768px) {
  .home {
    padding: 10px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .welcome-text {
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
    }
  }

  .welcome-image {
    margin-left: 0;

    img {
      width: 150px;
    }
  }
}
</style>
