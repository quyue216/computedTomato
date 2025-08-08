<script setup lang="ts">
import {
  ElContainer,
  ElHeader,
  ElMain,
  ElCol,
  ElRow,
  ElTabs,
  ElTabPane,
  ElMessage,
} from "element-plus";
import TmDataToTable from "@/components/TmDataToTable/TmDataToTable.vue";
import TmInfoCollect from "@/components/TmInfoCollect/TmInfoCollect.vue";
import dayjs from "dayjs";
import { reactive, ref, watch, onMounted, computed } from "vue";
import useTimeToTm from "@/utils/useTimeToTm";
import { initTimeInfo } from "@/utils/tools";
import type { TomatoConfig, TimeIntervalObject } from "tomato";
import store from "store";
import TmHeader from "@/components/TmHeader/TmHeader.vue";
const CONFIG_OBJECT_CACHE = "CONFIG_OBJECT_CACHE"; //缓存数据的key

const info = reactive<{
  configData: Merge<TomatoConfig, { mergeInfo?: [number, number] | [] }>;
  timeInfo: [Date, Date];
  onlyShowTm: boolean;
}>({
  configData: {
    tomatoTimeSize: 30,
    restTimeSize: 5,
    bigRestTimeSize: 15,
    happenBigSegment: 3,
    mergeInfo: [],
  },
  timeInfo: initTimeInfo() as [Date, Date],
  onlyShowTm: false,
});
// 设置时间戳
const startUnix = ref(dayjs().valueOf());
// 保存生成的时间数据对象
const saveSegments = ref<Array<TimeIntervalObject>>([]);
// 选择的时间数据
const selectedSegments = ref<Array<TimeIntervalObject>>([]);

selectInitTime();

// 更新配置对象
const updateConfigData = (config: TomatoConfig) => {
  info.configData = config;
};

// 更新用户选择的时间
const updateTimeInfo = (times: [Date, Date]) => {
  info.timeInfo = times;
};
// 1.有缓存读取缓存数据，无缓存生成最近两小时时间
function selectInitTime() {
  // 没有缓存自动生成时间区间
  if (!store.get(CONFIG_OBJECT_CACHE)) {
    info.timeInfo = initTimeInfo() as [Date, Date];
  } else {
    let { configData, timeInfo } = store.get(CONFIG_OBJECT_CACHE);

    const currentTime = dayjs().valueOf();
    // 当前时间大于缓存的截止时间。那么使用默认时间
    if (currentTime >= dayjs(timeInfo[1]).valueOf()) {
      store.remove(CONFIG_OBJECT_CACHE); //时间过期清除,获取初始化时间

      info.timeInfo = initTimeInfo() as [Date, Date];
    } else {
      info.timeInfo = timeInfo;

      info.configData = configData;
    }
  }
}

watch(
  info,
  (info) => {
    const { configData, timeInfo } = info;

    if (Object.entries(configData).length && timeInfo.length) {
      saveSegments.value = useTimeToTm(
        configData,
        timeInfo as [Date, Date]
      ).map((item, i) => ({ ...item, index: i }));

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
    if(!selectedSegments.value.length){
      startUnix.value = dayjs().valueOf();
    }
  }, 3000);
});

const saveNewSegments = computed(() => {
  // if (selectedSegments.value.length === 0) {
    saveSegments.value.forEach((item, index) => {
      if (item.id < startUnix.value && item.endTime > startUnix.value) {
        if (index > 0) {
          //关闭掉上次的高亮，切换之后关闭掉上次的，只要大于0说明是又前面切换过来
          saveSegments.value[index - 1].highlight = false;
        }
        item.highlight = true;
      }
    });
  // }

  if (info.configData?.mergeInfo?.length) {
    const copySelectSegments = saveSegments.value.slice(
      ...info.configData?.mergeInfo
    );

    return setMergeInfo(copySelectSegments, [...saveSegments.value]);
  }

  return saveSegments.value;
});

/*
 合并番茄
1. merges的长度必须未偶数
2. 合并的索引必须是连续的
*/
const mergeTomato = () => {
  if (selectedSegments.value.length === 0) {
    ElMessage.warning("请选择要合并的番茄时间段");
    return;
  }

  // 检查是否为偶数
  if (selectedSegments.value.length % 2 !== 0) {
    ElMessage.error("合并的番茄数量必须为偶数");
    return;
  }
  // 获取排序后的索引
  const sortedSegments = [...selectedSegments.value].sort(
    (a, b) => a.index - b.index
  );
  const indices = sortedSegments.map((s) => s.index);

  // 检查索引是否连续
  const isContinuous = indices.every(
    (val, i, arr) => i === 0 || val === arr[i - 1] + 1
  );
  if (!isContinuous) {
    ElMessage.error("选择的番茄必须是连续的");
    return;
  }

  // 执行合并逻辑
  const firstSegment = sortedSegments[0];
  const lastSegment = sortedSegments[sortedSegments.length - 1];

  const mergeInfo = info.configData.mergeInfo ?? [];

  if (mergeInfo.length === 0) {
    info.configData.mergeInfo = [firstSegment.index, lastSegment.index + 1] as [
      number,
      number
    ];
  } else {
    const tempMergeInfo = [firstSegment.index, mergeInfo[1]] as [
      number,
      number
    ];
    info.configData.mergeInfo = tempMergeInfo;
  }
  // 清空选择
  selectedSegments.value = [];
  ElMessage.success("合并成功");
};
// 设置合并信息的函数
const setMergeInfo = (
  selectedSegments: TimeIntervalObject[],
  segments: TimeIntervalObject[]
) => {
  const sortedSegments = [...selectedSegments].sort(
    (a, b) => a.index - b.index
  );

  // 执行合并逻辑
  const firstSegment = sortedSegments[0];
  const lastSegment = sortedSegments[sortedSegments.length - 1];
  // 创建合并后的番茄段
  const mergedSegment: TimeIntervalObject = {
    ...firstSegment,
    endTime: lastSegment.endTime,
  };

  // 重新计算时间段
  mergedSegment.timeBucket =
    firstSegment.timeBucket.split(" - ")[0] +
    " - " +
    lastSegment.timeBucket.split(" - ")[1];
  // 重新计算时间
  mergedSegment.timeInterval = sortedSegments.reduce(
    (pre, cur) => pre + cur.timeInterval,
    0
  );

  segments.splice(firstSegment.index, sortedSegments.length, mergedSegment);

  segments = segments.map((item, i) => ({
    ...item,
    index: i,
  }));

  return segments;
};
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
              :time-info="info.timeInfo"
              :segments="saveNewSegments"
              :update-time-info="updateTimeInfo"
              :config-data="info.configData"
              :update-config-data="updateConfigData"
              @merge-tomato="mergeTomato"
              @cancel-merge-tomato="info.configData.mergeInfo = []"
            ></tm-header>
          </el-col>
        </el-row>
        <el-tabs class="tm-main-head-bg">
          <el-tab-pane>
            <!-- 自定义导航 -->
            <template #label> 时间段划分 </template>
            <TmDataToTable
              v-model="selectedSegments"
              :segments="saveNewSegments"
            />
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
