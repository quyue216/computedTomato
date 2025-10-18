<script setup lang="ts">
import Home from "@/view/Home/Home.vue";
import Study from "@/view/Home/study.vue";
// import  from "@/utils/request/index";
import request from "@/utils/reqUpgrade/index";
import { ref } from "vue";

// -----------移动端环境判定----------------
function isMobile() {
  return "ontouchstart" in document.documentElement;
}

const isMobileEnv = ref(false);

const test = () => {
  request({
    url: "/api/v1/user/login/pwd",
    data: {
      email: "10676114@qq.com",
      password: "current520",
    },
    method: "post",
  }).then((res) => {
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
