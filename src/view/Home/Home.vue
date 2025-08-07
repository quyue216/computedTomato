<script setup lang="ts">
  import {
    ElContainer,
    ElHeader,
    ElMain,
    ElButton,
    ElCol,
    ElRow,
    ElTabs,
    ElTabPane,
  } from "element-plus";
  import TmDataToTable from "@/components/TmDataToTable/TmDataToTable.vue";
  import TmInfoCollect from "@/components/TmInfoCollect/TmInfoCollect.vue";
  import dayjs from "dayjs";
  import { reactive, ref, watch, onMounted ,computed} from "vue";
  import useTimeToTm from "@/utils/useTimeToTm";
  import { initTimeInfo } from "@/utils/tools";
  import type { TomatoConfig, TimeIntervalObject } from "tomato";
  import store from "store";
  import TmHeader from "@/components/TmHeader/TmHeader.vue"
  const CONFIG_OBJECT_CACHE = "CONFIG_OBJECT_CACHE"; //缓存数据的key

const info = reactive<{
  configData: TomatoConfig;
  timeInfo: [Date,Date] | [];
  onlyShowTm: boolean;
}>({
  configData: {
    tomatoTimeSize: 30,
    restTimeSize: 5,
    bigRestTimeSize: 15,
    happenBigSegment: 3,
  },
  timeInfo: [],
  onlyShowTm: false,
});
// 设置时间戳
const startUnix = ref(dayjs().valueOf());
// 保存生成的时间数据对象
const saveSegments = ref<Array<TimeIntervalObject>>([]);

selectInitTime();

// 更新配置对象
const updateConfigData = (config:TomatoConfig)=>{
  info.configData = config;
}

// 更新用户选择的时间
const updateTimeInfo = (times:[Date,Date])=>{
  info.timeInfo = times 
}
// 1.有缓存读取缓存数据，无缓存生成最近两小时时间
function selectInitTime() {
  // 没有缓存自动生成时间区间 
  if (!store.get(CONFIG_OBJECT_CACHE)) {
    info.timeInfo = initTimeInfo() as [Date,Date]
  } else {
    let { configData, timeInfo } = store.get(CONFIG_OBJECT_CACHE);

    const currentTime = dayjs().valueOf();
    // 当前时间大于缓存的截止时间。那么使用默认时间
    if (currentTime >= dayjs(timeInfo[1]).valueOf()) {
      store.remove(CONFIG_OBJECT_CACHE); //时间过期清除,获取初始化时间

      info.timeInfo = initTimeInfo() as [Date,Date]
      
    } else {
      info.timeInfo = timeInfo;

      info.configData = configData   
    }
  }
}

watch(
  info,
  (info) => {
    const { configData, timeInfo } = info;

    if (Object.entries(configData).length && timeInfo.length) {

      saveSegments.value = useTimeToTm(configData, timeInfo as [Date, Date]);

      //  注意这里代码导致递归调用了,导致重复更新
      store.set(CONFIG_OBJECT_CACHE, { configData, timeInfo }); //数据发生变化缓存数据
    }
  },
  {
    immediate: true,
  }
);
// 表示当前系统的高亮
onMounted(() => {
  setInterval(() => {
    startUnix.value = dayjs().valueOf();
  }, 3000);
});

const saveNewSegments = computed(() => {
  saveSegments.value.forEach((item:TomatoConfig,index:number) => {
    if (item.id < startUnix.value && item.endTime > startUnix.value) {
      if(index>0){ //关闭掉上次的高亮，切换之后关闭掉上次的，只要大于0说明是又前面切换过来
      saveSegments.value[index-1].highlight = false;
      }
      item.highlight = true;
    }
  });
  return saveSegments.value;
});
</script>
<template>
  <div class="common-layout">
    <el-container>
      <el-header height="50px"> have fun </el-header>
      <el-main class="tm-main">
        <!-- 这里感觉冗余了 -->
        <el-row class="tm-header-bg">
          <el-col>
            <!-- 头部组件 -->
           <tm-header 
             :time-info="info.timeInfo as [Date, Date]"
             :segments="saveNewSegments"
             :update-time-info="updateTimeInfo"
             :config-data="info.configData"
             :update-config-data="updateConfigData"
           ></tm-header>
          </el-col>
        </el-row>
        <el-tabs class="tm-main-head-bg">
          <el-tab-pane>
            <!-- 自定义导航 -->
            <template #label> 时间段划分 </template>
            <TmDataToTable :segments="saveNewSegments" />
          </el-tab-pane>
          <el-tab-pane label="番茄统计信息">
            <TmInfoCollect :segments="saveNewSegments" />
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>
<style lang="less" scoped>
.common-layout {
  height: 100%;

  .el-container {
    height: 100%;

    .el-header {
      text-align: center;
      line-height: 60px;
      font-size: 25px;
    }
  }

  .tm-main {
    height: 100% - 50px;

    .tm-header-bg {
      width: 60%;
      margin: 0 auto;
    }

    .tm-main-head-bg {
      width: 60%;
      margin: 0 auto;
    }
  }
}
</style>