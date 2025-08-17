<script setup lang="ts">
import Home from "@/view/Home/Home.vue";
import { ref } from "vue";

// -----------移动端环境判定----------------
function isMobile() { 
  return ('ontouchstart' in document.documentElement); 
}

const isMobileEnv = ref(isMobile());

</script>

<template>
  <div id="app-container" :class="{'mobile': isMobileEnv}">
    <Home></Home>
  </div>
</template>

<style lang="less" scoped>
#app-container {
  width: 100vw;
  height: 100vh;
}
.mobile {
 transform: rotate(90deg);
 width: 100vh !important;
}
</style>
