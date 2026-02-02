<template>
  <div class="home">
    <!-- 东欧时间卡片 -->
    <EuropeTimeCard />

    <!-- 订单统计区域 -->
    <OrderStatistics />
  </div>
</template>

<script setup lang="ts" name="home">
import OrderStatistics from "@/components/OrderStatistics/index.vue";
import EuropeTimeCard from "@/components/EuropeTimeCard/index.vue";
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
</style>
