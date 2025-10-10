<script setup lang="ts">
import Home from "@/view/Home/Home.vue";
import Study from "@/view/Home/study.vue";
import api from "@/utils/request/index";
import { ref } from "vue";

// -----------移动端环境判定----------------
function isMobile() {
  return "ontouchstart" in document.documentElement;
}

const isMobileEnv = ref(false);

const test = () => {
  api(
    "POST",
    "/login",
    {},
    { email: "10676114@qq.com", password: "123456" }
  ).then((res) => {
    console.log(res.data);
  });

  api("GET", "/user").then((res) => {
    console.log(res);
  });
};
</script>

<template>
  <div id="app-container" :class="{ mobile: isMobileEnv }">
    <Study @click="test"></Study>
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
