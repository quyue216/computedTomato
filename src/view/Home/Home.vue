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
import { ref, watch, onMounted, computed, watchEffect } from "vue";
import useTimeToTm from "@/utils/useTimeToTm";
import { initTimeInfo } from "@/utils/tools";
import type { TomatoConfig, TimeIntervalObject } from "tomato";
import { cloneDeep } from "lodash";
import * as storeUtils from "@/utils/storeUtils";
import TmHeader from "@/components/TmHeader/TmHeader.vue";
const HISTORY_TIME_INFO = "HISTORY_TIME_INFO"; //历史记录的key

const baseTomatoConfig: BaseTomatoConfig = {
  configData: {
    tomatoTimeSize: 30,
    restTimeSize: 5,
    bigRestTimeSize: 15,
    happenBigSegment: 3,
    mergeInfo: [],
  },
  timeInfo: initTimeInfo(),
  onlyShowTm: false,
};

type timeInfoType = typeof baseTomatoConfig.timeInfo;

// 设置时间戳
const startUnix = ref(dayjs().valueOf());
// 保存生成的时间数据对象
const saveSegments = ref<Array<TimeIntervalObject>>([]);
// 选择的时间数据
const selectedSegments = ref<Array<TimeIntervalObject>>([]);
// 历史记录
const historyTimeInfo = ref<Array<BaseTomatoConfig>>([]);
// 默认指向顶层
let pointerHistory = ref(0);

selectInitTime();
// 定义一个枚举类型来表示历史记录指针的操作
enum HistoryPointerAction {
  increase = "increase",
  decrease = "decrease",
  rest = "rest",
  newest = "newest",
}

const updateConfigData = (config: TomatoConfig) => {
  historyTimeInfo.value[pointerHistory.value].configData = config;

  storeUtils.updateLocalStorageItem(HISTORY_TIME_INFO, `${pointerHistory.value}.configData`, config);
};

// 更新用户选择的时间
const updateTimeInfo = (times: timeInfoType) => {
  // 当次选择发生变化
  const isChange = historyTimeInfo.value[pointerHistory.value].timeInfo.every((item, i) => {
    return times[i].toString() !== item.toString();
  });
  // 清楚合并信息
  if (isChange) {
    //时间发生变化，segments需要重新计算
    historyTimeInfo.value[pointerHistory.value].configData.mergeInfo = []; // 清除合并信息
    selectedSegments.value = []; // 清除选中的时间段
  }

  historyTimeInfo.value[pointerHistory.value].timeInfo = times; //将会创建最新记录
  // 重新计算时间区间
  // computedSegments(historyTimeInfo.value[pointerHistory.value]);

  pushHistoryTimeInfo(times); // 将当前时间信息添加到历史记录中
};
// 1.有缓存读取缓存数据，无缓存生成最近两小时时间
function selectInitTime(): void {
  console.log("初始执行----2");
  // 没有缓存自动生成时间区间
  if (!storeUtils.getLocalStorage(HISTORY_TIME_INFO)) {
    const timeInfo = initTimeInfo();

    pushHistoryTimeInfo(timeInfo);
  } else {
    let catchHistory = storeUtils.getLocalStorage(
      HISTORY_TIME_INFO
    ) as Array<BaseTomatoConfig>;

    const topHis = catchHistory[catchHistory.length - 1];

    historyTimeInfo.value = catchHistory;

    const currentTime = dayjs().valueOf();
    // 当前时间大于缓存的截止时间。那么使用默认时间
    if (currentTime >= dayjs(topHis.timeInfo[1]).valueOf()) {
      const timeInfo = initTimeInfo();

      pushHistoryTimeInfo(timeInfo); //缓存起来
    } else {
      countHtyPointer(catchHistory.length, HistoryPointerAction.newest);
    }
  }
}

// 计算时间区间
function computedSegments(config: BaseTomatoConfig): void {
  const { configData, timeInfo } = config;
  // 如果配置数据不合法，直接返回
  
  const configDataCheckSuccess = Object.values(configData).every(
    (item) => item !== undefined
  );

  if (configDataCheckSuccess && timeInfo.length) {
    saveSegments.value = useTimeToTm(configData, timeInfo as Tuple2<Date>).map(
      (item, i) => ({ ...item, index: i })
    );
  }
}

watch([()=>historyTimeInfo.value[pointerHistory.value].timeInfo,()=>historyTimeInfo.value[pointerHistory.value].configData],()=>{
  // if(newVal.timeInfo.toString() !== oldVal.timeInfo.toString()){
    computedSegments(historyTimeInfo.value[pointerHistory.value]);
  // }
})

// 表示当前系统的高亮
onMounted(() => {
  // 初始化时从缓存中读取历史记录
  historyTimeInfo.value = storeUtils.getLocalStorage(HISTORY_TIME_INFO) || [];

  computedSegments(historyTimeInfo.value[pointerHistory.value]);

  setInterval(() => {
    // 当没有选择时间段的时候，高亮计算才开启
    if (!selectedSegments.value.length) {
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

  if (historyTimeInfo.value[pointerHistory.value].configData?.mergeInfo?.length&&saveSegments.value.length) {
    const copySelectSegments = saveSegments.value.slice(
      ...historyTimeInfo.value[pointerHistory.value].configData?.mergeInfo
    );
    
    return setMergeInfo(copySelectSegments, [...saveSegments.value]);
  }

  return saveSegments.value;
});

/*
 ---------合并番茄----------
1. merges的长度必须未偶数
2. 合并的索引必须是连续的
*/
type towNumTuple = [number, number];

const mergeTomato = () => {
  if (selectedSegments.value.length < 2) {
    // 至少需要两个时间段才能合并
    ElMessage.warning("请选择要合并的番茄时间段");
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

  const mergeInfo = historyTimeInfo.value[pointerHistory.value].configData.mergeInfo ?? [];

  let newMergeInfo:Partial<towNumTuple> = [];

  if (mergeInfo.length === 0) {
    newMergeInfo = [
      firstSegment.index,
      lastSegment.index + 1,
    ];    
  } else {
    newMergeInfo [firstSegment.index, mergeInfo[1]] ;
  }
  historyTimeInfo.value[pointerHistory.value].configData.mergeInfo = newMergeInfo;
  storeUtils.updateLocalStorageItem(HISTORY_TIME_INFO, `${pointerHistory.value}.configData.mergeInfo`, newMergeInfo);
  // 清空选择
  selectedSegments.value = [];
  ElMessage.success("合并成功");
};
// 设置合并信息的函数
const setMergeInfo = (
  selectedSegments: TimeIntervalObject[],
  segments: TimeIntervalObject[]
) => {
  // 时间片段进行排序
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
  // 替换原始数组中的元素
  segments.splice(firstSegment.index, sortedSegments.length, mergedSegment);
  // 更新索引
  segments = segments.map((item, i) => ({
    ...item,
    index: i,
  }));

  return segments;
};

// 取消合并番茄
const cancelMergeTomato = () => {
  historyTimeInfo.value[pointerHistory.value].configData.mergeInfo = [];
  
  storeUtils.updateLocalStorageItem(HISTORY_TIME_INFO, `${pointerHistory.value}.configData.mergeInfo`, []);
  
  ElMessage.success("取消合并成功");
};

//----------历史记录---------
function pushHistoryTimeInfo(times: [Date, Date]) {
  
  // 读取本地缓存
  const bufferHis =
    (storeUtils.getLocalStorage(
      HISTORY_TIME_INFO
    ) as Array<BaseTomatoConfig>) ?? [];
    
 
  //判断是否存在
  const isExist = bufferHis.some(({ timeInfo }) => {
    return (
      dayjs(times[0]).valueOf() === dayjs(timeInfo[0]).valueOf() &&
      dayjs(times[1]).valueOf() === dayjs(timeInfo[1]).valueOf()
    );
  });

  if (isExist) return; // 如果已经存在，则不添加

  let tempObj = cloneDeep(baseTomatoConfig);

  tempObj.timeInfo = times;

  countHtyPointer(historyTimeInfo.value.length, HistoryPointerAction.newest);
  // 限制历史记录的长度为10条
  // curHis才是原始的历史记录
  const newHis = storeUtils.updateLocalStorageItem(HISTORY_TIME_INFO, historyTimeInfo.value.length.toString(), tempObj);

  historyTimeInfo.value = newHis as Array<BaseTomatoConfig>;
}

// 清空历史记录
const clearHistoryTimeInfo = () => {
  const lastHisItem = historyTimeInfo.value.pop();
  //保留最新一条记录
  historyTimeInfo.value = lastHisItem ? [lastHisItem] : []; // 清空历史记录

  storeUtils.setLocalStorage(HISTORY_TIME_INFO, historyTimeInfo.value);

  // 重置指针
  countHtyPointer(historyTimeInfo.value.length, HistoryPointerAction.rest);

  ElMessage.success("清空历史记录成功");
};

// 切换历史记录
const switchHistory = (type: HistoryPointerAction) => {
  let oldIndex = pointerHistory.value; // 记录上一次的索引

  countHtyPointer(historyTimeInfo.value.length, type);

  if (oldIndex === pointerHistory.value) {
    return ElMessage.warning("没有更多的历史记录了");
  }

  ElMessage.success("切换历史记录成功");
};

// 重新计算历史记录
function countHtyPointer(hisLen: number, type: HistoryPointerAction): void {
  if (type === "increase") {
    pointerHistory.value++;
    if (hisLen <= pointerHistory.value) {
      pointerHistory.value = hisLen - 1;
    }
  } else if (type === "decrease") {
    pointerHistory.value--;
    if (pointerHistory.value < 0) {
      pointerHistory.value = 0;
    }
  } else if (type === "rest") {
    pointerHistory.value = 0;
  } else if (type === "newest") {
    pointerHistory.value = hisLen - 1;
  }
}
</script>
<template>
  <div class="common-layout">
    <el-container>
      <el-header height="50px"> have fun </el-header>
      <el-main class="tm-main">
        <!-- 这里感觉冗余了 -->
        <el-row class="tm-header-bg">
          <el-col>
            <!-- 头部组件 v-model不太希望影响到原始的历史记录-->
            <tm-header
              v-model="historyTimeInfo[pointerHistory].timeInfo"
              :segments="saveNewSegments"
              :update-time-info="updateTimeInfo"
              :config-data="historyTimeInfo[pointerHistory].configData"
              :update-config-data="updateConfigData"
              @merge-tomato="mergeTomato"
              @cancel-merge-tomato="cancelMergeTomato"
              @clear-history-time-info="clearHistoryTimeInfo"
              @switch-history="switchHistory"
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
