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
  ElSelect,
  ElOption,
  ElMessageBox,
} from "element-plus";
import TmDataToTable from "@/components/TmDataToTable/TmDataToTable.vue";
import TmInfoCollect from "@/components/TmInfoCollect/TmInfoCollect.vue";
import dayjs from "dayjs";
import { ref, watch, onMounted, computed } from "vue";
import configToSegments from "@/utils/configToSegments";
import { initTimeInfo ,formatTimeRange} from "@/utils/tools";
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
  uuid: crypto.randomUUID(),
};

type timeInfoType = typeof baseTomatoConfig.timeInfo;

// 保存生成的时间数据对象
const saveSegments = ref<Array<TimeIntervalObject>>([]);
// 选择的时间数据
const selectedSegments = ref<Array<TimeIntervalObject>>([]);
// 历史记录
const historyTimeInfo = ref<Array<BaseTomatoConfig>>([]);
// 默认指向顶层
let pointerHistory = ref(0);
// 番茄配置访问器,提高可读性,避免a.b.c过长
const tomatoConfigAccessor = {
  get config() {
    return historyTimeInfo.value[pointerHistory.value];
  },
  set config(val) {
    historyTimeInfo.value[pointerHistory.value] = val;
  },
  get timeInfo() {
    return historyTimeInfo.value[pointerHistory.value].timeInfo;
  },
  set timeInfo(val) {
    historyTimeInfo.value[pointerHistory.value].timeInfo = val;
  },
  get mergeInfo() {
    return historyTimeInfo.value[pointerHistory.value].configData.mergeInfo;
  },
  set mergeInfo(val) {
    historyTimeInfo.value[pointerHistory.value].configData.mergeInfo = val;
  },
  get configData() {
    return historyTimeInfo.value[pointerHistory.value].configData;
  },
  set configData(val) {
    historyTimeInfo.value[pointerHistory.value].configData = val;
  },
};

selectInitTime();
// 定义一个枚举类型来表示历史记录指针的操作
enum HistoryPointerAction {
  increase = "increase",
  decrease = "decrease",
  rest = "rest",
  newest = "newest",
  goto = "goto"
}

const updateConfigData = (config: TomatoConfig) => {
  tomatoConfigAccessor.configData = config;

  storeUtils.updateLocalStorageItem(
    HISTORY_TIME_INFO,
    `${pointerHistory.value}.configData`,
    config
  );
};

// 更新用户选择的时间
const updateTimeInfo = (times: timeInfoType) => {
  // 当次选择发生变化
  const isChange = historyTimeInfo.value[pointerHistory.value].timeInfo.every(
    (item, i) => {
      return times[i].toString() !== item.toString();
    }
  );
  // 清楚合并信息
  if (isChange) {
    //时间发生变化，segments需要重新计算
    historyTimeInfo.value[pointerHistory.value].configData.mergeInfo = []; // 清除合并信息
    selectedSegments.value = []; // 清除选中的时间段
  }

  historyTimeInfo.value[pointerHistory.value].timeInfo = times; //将会创建最新记录

  pushHistoryTimeInfo(times); // 将当前时间信息添加到历史记录中
};
// 1.有缓存读取缓存数据，无缓存生成最近两小时时间
function selectInitTime(): void {
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
    //! 这里的逻辑重新改动,不比较天,比较小时
    if (currentTime >= dayjs(topHis.timeInfo[1]).valueOf()) {
      const timeInfo = initTimeInfo();

      pushHistoryTimeInfo(timeInfo); //缓存起来
    } else {
      countHtyPointer(catchHistory.length, HistoryPointerAction.newest);
      computedSegments(tomatoConfigAccessor.config); // 计算时间区间
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
    saveSegments.value = configToSegments(
      configData,
      timeInfo as Tuple2<Date>
    ).map((item, i) => ({ ...item, index: i }));
  }
}

watch(
  [
    () => historyTimeInfo?.value[pointerHistory.value]?.timeInfo,
    () => historyTimeInfo?.value[pointerHistory.value]?.configData,
    () => historyTimeInfo.value[pointerHistory.value],
  ],
  () => {
    // if(newVal.timeInfo.toString() !== oldVal.timeInfo.toString()){
    computedSegments(historyTimeInfo.value[pointerHistory.value]);
  }
);

// 表示当前系统的高亮
onMounted(() => {
  // 监听时间变化
  followTimeChangeDataState();
});

const saveNewSegments = computed(() => {
  if (tomatoConfigAccessor.mergeInfo?.length && saveSegments.value.length) {
    const copySelectSegments = saveSegments.value.slice(
      ...tomatoConfigAccessor.mergeInfo
    );

    return setMergeInfo(copySelectSegments, [...saveSegments.value]);
  }

  return saveSegments.value;
});
// 监听时间变化
function followTimeChangeDataState() {
  setInterval(() => {
    // 当没有选择时间段的时候，高亮计算才开启
    if (selectedSegments.value.length) return;

    const timeStamp = dayjs().valueOf(); //时间戳

    saveSegments.value.forEach((item, index) => {
      if (item.id < timeStamp && item.endTime > timeStamp) {
        if (index > 0) {
          //关闭掉上次的高亮，切换之后关闭掉上次的，只要大于0说明是又前面切换过来
          saveSegments.value[index - 1].highlight = false;
        }
        item.highlight = true;
      }
    });
  }, 3000);
}

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
  const firstSegment = sortedSegments.shift()!;
  const lastSegment = sortedSegments.pop()!;

  const mergeInfo = tomatoConfigAccessor.mergeInfo ?? [];

  let newMergeInfo: Partial<towNumTuple> = [];

  if (mergeInfo.length === 0) {
    // lastSegment.index +1 方便后面slice
    newMergeInfo = [firstSegment.index, lastSegment.index + 1];
  } else {
    newMergeInfo = [firstSegment.index, mergeInfo[1]];
  }

  tomatoConfigAccessor.mergeInfo = newMergeInfo as [number, number];

  storeUtils.updateLocalStorageItem(
    HISTORY_TIME_INFO,
    `${pointerHistory.value}.configData.mergeInfo`,
    newMergeInfo
  );
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
  tomatoConfigAccessor.mergeInfo = [];

  storeUtils.updateLocalStorageItem(
    HISTORY_TIME_INFO,
    `${pointerHistory.value}.configData.mergeInfo`,
    []
  );

  ElMessage.success("取消合并成功");
};

//----------历史记录---------
function pushHistoryTimeInfo(times: [Date, Date]): void {
  // 读取本地缓存
  const bufferHis =
    (storeUtils.getLocalStorage(
      HISTORY_TIME_INFO
    ) as Array<BaseTomatoConfig>) ?? [];

  //判断是否存在
  const isExist = bufferHis.some(({ timeInfo, uuid }) => {
    return (
      (dayjs(times[0]).valueOf() === dayjs(timeInfo[0]).valueOf() &&
        dayjs(times[1]).valueOf() === dayjs(timeInfo[1]).valueOf()) ||
      baseTomatoConfig.uuid === uuid
    );
  });

  if (isExist) return; // 如果已经存在，则不添加

  let tempObj = cloneDeep(baseTomatoConfig);

  tempObj.timeInfo = times;
  tempObj.uuid = crypto.randomUUID(); //添加唯一id

  if (!bufferHis.length) {
    historyTimeInfo.value = [tempObj]; //无缓存,在这完成初始化
    computedSegments(tempObj); //计算时间片段不依赖指针
    storeUtils.setLocalStorage(HISTORY_TIME_INFO, [tempObj]);
  } else {
    // curHis才是原始的历史记录
    const newHis = storeUtils.updateLocalStorageItem(
      HISTORY_TIME_INFO,
      historyTimeInfo.value.length.toString(),
      tempObj
    );

    historyTimeInfo.value = newHis as Array<BaseTomatoConfig>;
  }
  countHtyPointer(historyTimeInfo.value.length, HistoryPointerAction.newest);
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

//HACK  代码需要重构 hisLen冗余
function countHtyPointer(hisLen: number, type: HistoryPointerAction,val?:number): void {
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
  }else if(type === HistoryPointerAction.goto){
    pointerHistory.value = val!;
  }
}
//切换历史记录禁用
const isSwitchHistoryDisabledLeft = computed(() => {
  return pointerHistory.value === 0;
});

//右侧切换禁用
const isSwitchHistoryDisabledRight = computed(() => {
  return pointerHistory.value === historyTimeInfo.value.length - 1;
});

const disabledSwitchHistory = computed(() => {
  return historyTimeInfo.value.length <= 1;
});
//---------------常用工作时间----------------

// 工作时间
const DAILY_WORK_TIME = "dailyWorkTime";

const dailyWorkTime = ref<Array<BaseTomatoConfig & {remark?:string}>>([]);


const dailyWorkRecords = computed(() => {
  return dailyWorkTime.value.map((item) => ({
    ...item,
    label: item.timeInfo.map((item) => dayjs(item).format("HH:mm")).join(" - "),
  }));
});

const selectedDailyWorkTime = ref<cryptoUUID | "">("");

// 增加时间段
const  workTimeManager = {
  async addWorkTime() {
    // 判断当前时间是否存在于常用工作时间中
    const isExist = dailyWorkTime.value.find(
      (item) => item.uuid === tomatoConfigAccessor.config.uuid
    );
  
    if (isExist) return ElMessage.warning("常用时间段已存在");
    
    try {
      const res = await ElMessageBox.prompt("请输入时间段名称", "提示", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputValue: formatTimeRange(tomatoConfigAccessor.config.timeInfo),
        inputValidator: (val: string) => {
          if (!val) {
            return "请输入时间段名称";
          }
          return true;
        },
      })
      
      const { value } = res;
      
      if (value) {
        const tempObj = cloneDeep(tomatoConfigAccessor.config) as BaseTomatoConfig & {remark?:string};
        tempObj.remark = value; //备注添加
        dailyWorkTime.value.push(tempObj);
      }
      
    } catch (error) {
      console.log(error);
    }
  },
  _syncDWtToHistory(item:BaseTomatoConfig & {remark?:string}):void { //同步到历史记录中
    /* 
    1. 多选框数据来源于缓存或者历史记录
    */
   const index =  historyTimeInfo.value.findIndex((item) => item.uuid === item.uuid);
    
   if(index !== -1){ // 存在无需做任何处理
    
    countHtyPointer(historyTimeInfo.value.length,HistoryPointerAction.goto,index);
    return;
   }
   
    //不存在 数据来源于缓存
    pushHistoryTimeInfo(item.timeInfo);
  },
  init() {
    // 初始化常用工作时间
    dailyWorkTime.value = this.localStorageDailyWorkTime;
    // 监听常用工作时间变化
    watch(
      () => dailyWorkTime.value.length,
      () => {
        storeUtils.setLocalStorage(DAILY_WORK_TIME, dailyWorkTime.value);
      }
    );
  },
  selectDailyWorkTime:(val:cryptoUUID | "")=> {
    
    if(val){
      const item = dailyWorkTime.value.find((item) => item.uuid === val);
      
      item&&workTimeManager._syncDWtToHistory(item);
    }
  },
  get localStorageDailyWorkTime() {
    return (dailyWorkTime.value =
      (storeUtils.getLocalStorage(
        DAILY_WORK_TIME
      ) as Array<BaseTomatoConfig>) ?? []);
  },
};
workTimeManager.init(); //初始化
/* 
常用的工作时间已经在history中,
1. 调整pointerHistory的指针
2. 未在history中,添加到history中
*/
</script>
<template>
  <div class="common-layout">
    <el-container>
      <el-header
        height="50px"
        style="
          display: flex;
          justify-content: center;
          align-items: center;
          column-gap: 20px;
        "
      >
        <p>
          历史记录共<span class="highlight-value">{{
            historyTimeInfo.length
          }}</span
          >条，历史记录指针<span class="highlight-value">{{
            pointerHistory + 1
          }}</span>
        </p>
        <el-select
          v-model="selectedDailyWorkTime"
          placeholder="选择常用时间段"
          style="width: 200px"
          @change="workTimeManager.selectDailyWorkTime"
        >
          <el-option
            v-for="item in dailyWorkRecords"
            :key="item.uuid"
            :label="item.remark ?? item.label"
            :value="item.uuid"
          />
        </el-select>
      </el-header>
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
              :is-switch-history-disabled-left="isSwitchHistoryDisabledLeft"
              :is-switch-history-disabled-right="isSwitchHistoryDisabledRight"
              :disabled-switch-history="disabledSwitchHistory"
              @addWorkTime="workTimeManager.addWorkTime"
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
      span:first-child {
        margin-right: 10px;
      }
    }
  }

  .tm-main {
    height: 100% - 50px;

    .tm-header-bg {
      width: 65%;
      margin: 0 auto;
    }

    .tm-main-head-bg {
      width: 65%;
      margin: 0 auto;
    }
  }
}

/* ... 现有样式 ... */
.highlight-value {
  background-color: #fff3cd; /* 浅黄色背景 */
  color: #856404; /* 深黄色文字 */
  padding: 0 4px; /* 左右内边距 */
  border-radius: 3px; /* 圆角边框 */
  font-weight: bold; /* 加粗文字 */
  border: 1px solid #ffeeba; /* 边框颜色 */
}
p {
  // margin: 1em 0;
  font-size: 24px;
}
</style>
