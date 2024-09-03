<script setup lang="ts">
/* 
默认时间 :   
手动选择时间 :
*/
import {
  ElRow,
  ElCol,
  ElButton,
  ElTimePicker,
  ElDivider,
  ElMessage,
} from "element-plus";
import TmHandleConfig from "../TmHandleConfig/TmHandleConfig.vue";
import {
  ref,
  defineExpose,
  defineEmits,
  defineProps,
 
} from "vue";
import store from "store";
import dayjs from "dayjs";
import type { TimeIntervalObject } from "@/global/global";

const dialogVisible = ref(false);

const MIN_MINUTE = 30;

const props = defineProps<{
  timeInfo:[Date,Date],
  updateTimeInfo:(times:[Date,Date])=> void 
}>();


//! 这块代码居然是动态的初始化,并没有把值传递过去，当时初始化时值为undefined。后续居然能够显示最新的Props
const timeInterVal = ref<[Date,Date]>(props.timeInfo);

// 关闭配置对话框
//! watch始终无法执行，不清楚原因暂时
/* watch(timeInterVal, ()=>{
  console.log("值显示了哈哈哈");
}) */
// 关闭对话框,
const isClose = (state:TimeIntervalObject) => {
  if (state) return;
 
  if(!timeInterVal.value?.every((item)=>item)) return 

  let startTime = dayjs(timeInterVal.value[0]);

  let endTime = dayjs(timeInterVal.value[1]);

  let minuteDiff = endTime.diff(startTime, "minute");

  let { timeInfo } = store.get("CONFIG_OBJECT_CACHE");

  console.log(minuteDiff , MIN_MINUTE);
  

  if (minuteDiff <= MIN_MINUTE) {
    //不合法,不去设置
    ElMessage({
      message: "划分时间段过于简单,请重新设置", //让其设置为无效
      type: "warning",
      duration: 3000,
    });
    
    timeInterVal.value = timeInfo
  }else{
    props.updateTimeInfo(timeInterVal.value)
  }
};

// 复制函数
 const copyTime = async ()=>{

  let text = props.timeInfo.reduce((pre:string[],item:Date)=>{
    pre.push( dayjs(item).format("MM-DD HH:mm"))
    return  pre
  },[])

  await navigator.clipboard.writeText(`(${text.join(" - ")}) ${window.tomatoNum}tm`);
 }
</script>
<template>
  <el-row justify="space-between">

    <el-col :span="11" :xs="24">
      <el-time-picker
        is-range
        range-separator="To"
        start-placeholder="Start time"
        end-placeholder="End time"
        v-model="timeInterVal"
        @visible-change="isClose"
      />
      
    </el-col>
    <el-col :span="3" :offset="3" :xs="6">
      <el-button @click="dialogVisible = true" type="info"
        >设置</el-button
      >
    </el-col>
    <el-col :span="3"  :offset="1" :xs="6">
      <el-button type="primary" @click="copyTime" >复制</el-button>
    </el-col>
  </el-row>
  <!-- 分隔线组件 -->
  <el-divider />
  
  <!-- 弹窗组件反正默认不显示为什么要放到Home中，他放在哪都没问题
       放在tmHeader中更利用交互
   -->
  <tm-handle-config
    v-model="dialogVisible"
    ref="dialogIns"
    v-bind="$attrs"
  ></tm-handle-config>
</template>



<style scoped>
</style>

