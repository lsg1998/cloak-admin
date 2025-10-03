<template>
  <div class="home">
    <!-- 订单统计区域 -->
    <OrderStatistics />
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
</style>
