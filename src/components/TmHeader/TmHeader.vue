<script setup lang="ts">
/* 
默认时间 :   
手动选择时间 :
*/
import {
  ElRow,
  ElCol,
  ElButton,
  ElButtonGroup,
  ElTimePicker,
  ElDivider,
  ElMessage,
  ElIcon,
} from "element-plus";
import TmHandleConfig from "../TmHandleConfig/TmHandleConfig.vue";
import { ref ,watch} from "vue";
// import * as storeUtils from '@/utils/storeUtils'
import dayjs from "dayjs";
import type { TimeIntervalObject, TomatoConfig } from "tomato";

const dialogVisible = ref(false);

const MIN_MINUTE = 30;

const props = defineProps<{
  // timeInfo: [Date, Date];
  updateTimeInfo: (times: [Date, Date]) => void;
  segments: TimeIntervalObject[];
  configData: TomatoConfig;
  updateConfigData: (data: TomatoConfig) => void;
  isSwitchHistoryDisabledLeft: boolean;
  isSwitchHistoryDisabledRight: boolean;
}>();

defineEmits(["merge-tomato", "cancel-merge-tomato", "clear-history-time-info","switch-history"]);

//! 这块代码居然是动态的初始化,并没有把值传递过去，当时初始化时值为undefined。后续居然能够显示最新的Props
const timeInterVal = defineModel<[Date, Date]>();

let oldTimeInterVal = timeInterVal.value;
// 关闭配置对话框
watch(timeInterVal, (newVal,oldVal)=>{
  
  if(oldTimeInterVal){
    oldTimeInterVal = newVal;
  }else{
    oldTimeInterVal = oldVal;
  }
  
})
// 关闭对话框,
const isClose = (state: TimeIntervalObject) => {
  if (state) return;

  if (!timeInterVal.value?.every((item) => item)) return;

  let startTime = dayjs(timeInterVal.value[0]);

  let endTime = dayjs(timeInterVal.value[1]);

  let minuteDiff = endTime.diff(startTime, "minute");

  // let { timeInfo } = storeUtils.getLocalStorage("CONFIG_OBJECT_CACHE");

  if (minuteDiff <= MIN_MINUTE) {
    //不合法,不去设置
    ElMessage({
      message: "划分时间段过于简单,请重新设置", //让其设置为无效
      type: "warning",
      duration: 3000,
    });

    timeInterVal.value = oldTimeInterVal;
  } else {
    props.updateTimeInfo(timeInterVal.value);
  }
};

// 复制函数
const copyTime = async () => {
  let text = timeInterVal.value!.reduce((pre: string[], item: Date) => {
    pre.push(dayjs(item).format("MM-DD HH:mm"));
    return pre;
  }, []);

  const tmSegmentToStr: (data: Array<TimeIntervalObject>) => string = (
    tmData
  ) => {
    const tempObj: {
      [property: string]: number;
    } = {}; //暂存时间信息

    let tempArr: Array<{
      timeStr: string;
      tomatoCount: string;
    }> = []; //暂存

    const workTm = tmData.filter((item) => item.type);

    workTm.forEach((item) => {
      const curCount = tempObj[item.timeInterval] || 0;
      tempObj[item.timeInterval] = curCount + 1;
    });

    Object.entries(tempObj).forEach((item) => {
      const [key, value] = item; //key 时间间隔 value 次数

      return tempArr.push({
        timeStr: `${value}tm * ${key}m`,
        tomatoCount: value + "",
      });
    });

    return tempArr
      .sort((a, b) => {
        return Number(b.tomatoCount) - Number(a.tomatoCount);
      })
      .map((item) => item.timeStr)
      .join(" + ");
  };

  await navigator.clipboard.writeText(
    `(${text.join(" - ")}) ${tmSegmentToStr(props.segments)}`
  );

  ElMessage({
    message: "复制成功", //让其设置为无效
    type: "success",
    duration: 3000,
  });
};
</script>
<template>
  <el-row justify="center" style="row-gap: 10px;" align="middle">
    <el-col :span="9" :lg="9" :md="24" :sm="24"  :xs="24" class="col-center">
      <el-time-picker
        is-range
        range-separator="To"
        start-placeholder="Start time"
        end-placeholder="End time"
        v-model="timeInterVal"
        @visible-change="isClose"
      />
    </el-col>

    <el-col :span="9" :lg="9" :md="24" :sm="24"   :xs="24" class="col-center">
      <el-button-group>
        <el-button type="warning" @click="$emit('merge-tomato')"
          >merge</el-button
        >
        <el-button  type="warning" @click="$emit('cancel-merge-tomato')"
          >cancel Merge</el-button
        >
        <el-button type="primary" @click="copyTime">copy</el-button>
        <el-button @click="dialogVisible = true" type="info">setting</el-button>
        <el-button type="danger" @click="$emit('clear-history-time-info')">clear</el-button>
      </el-button-group>
    </el-col>

    <el-col :span="6" :lg="6" :md="24" :sm="24"  :xs="24" class="col-center">
      <el-button-group>
        <el-button :disabled="isSwitchHistoryDisabledLeft" type="primary" @click="$emit('switch-history','decrease')"
          >
          <el-icon ><ArrowLeft /></el-icon>
        </el-button>
        <el-button :disabled="isSwitchHistoryDisabledRight" type="primary"  @click="$emit('switch-history','increase')">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </el-button-group>
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
    :config-data="configData"
    :update-config-data="updateConfigData"
  />
</template>

<style scoped>
.col-center {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100%; /* 确保垂直居中生效 */
}
</style>
