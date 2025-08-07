<template>
    <div class="tm-collect-bg" v-if="segments.length">
      <div class="tm-total-info">
        <!-- 总的番茄统计 -->
        <h1>当前时间段番茄信息统计</h1>
  
        <div class="tm-all-count">
          一共有<span class="tm-text-highlight">{{ tomato[0] }}</span
          >番茄, 一共<span class="tm-text-highlight">{{ totalInfo[0] }}</span
          >分钟
        </div>
  
        <div class="tm-all-rest">
          一共休息<span class="tm-text-highlight">{{ tomato[1] }}</span
          >次, 一共<span class="tm-text-highlight">{{ totalInfo[1] }}</span
          >分钟
        </div>
      </div>
  
      <!-- 当前正在进行第几个番茄，第几个信息 -->
      <div class="tm-happen-info">
        <template v-if="curTomNum">
          <div v-if="curTomNum?.type">
            当前正在进行<span class="tm-text-highlight"
              >第{{ curTomNum?.count }}个番茄</span
            >...
          </div>
          <div v-else>
            当前正在进行<span class="tm-text-highlight"
              >第{{ curTomNum?.count }}个休息</span
            >...
          </div>
        </template>
        <template v-else>
          <div>当前还未开始工作,休息会吧</div>
        </template>
      </div>
  
      <!-- 当前时间段剩余番茄信息统计 -->
      <div class="tm-remain-total-info" v-if="curTomNum">
        <h1>当前时间段剩余番茄信息统计</h1>
        <div class="tm-all-count">
          一共有<span class="tm-text-highlight">{{ remainTimeRestNum[0] }}</span
          >番茄, 一共<span class="tm-text-highlight">{{
            remainingTimeInfo[0]
          }}</span
          >分钟
        </div>
        <div class="tm-all-rest">
          一共休息<span class="tm-text-highlight">{{ remainTimeRestNum[1] }}</span
          >次, 一共<span class="tm-text-highlight">{{
            remainingTimeInfo[1]
          }}</span
          >分钟
        </div>
      </div>
    </div>
    <el-empty v-else description="请输入配置数据" />
  </template>
  
  <script setup lang="ts">
  /* 
  修复两个bug,未工作番茄时间段显示工作
  过滤时间，总休息时间为0的问题
  */
  import { computed, defineProps } from "vue";
  import { ElEmpty } from "element-plus";
  import type {TimeIntervalObject} from "tomato"
//  基于运行时推断
    const props = withDefaults(defineProps<{
        segments:TimeIntervalObject[]
    }>(), {
    segments: () => []
    })

    /* 
    编写一个函数，可以求出数组的累加和？
    */
    const getTotalMIn = (arr:TimeIntervalObject[]) => {
      let data = [0, 0]; //第一个番茄，第二个休息
      arr.forEach((item) => {
        if (item.type) {
          data[0] += item.timeInterval;
        } else {
          data[1] += item.timeInterval;
        }
      });
      return data;
    };
  // 获取总番茄数量，和总休息
    const tomato = computed(() => {
      let result = []; //0 番茄，1 休息
      let arr = props.segments.slice(-2);
      if (arr[0].type > arr[1].type) {
        result.push(arr[0].count);
        result.push(arr[1].count);
      } else {
        result.push(arr[1].count);
        result.push(arr[0].count);
      }
      // 方便复制保存番茄信息
      // window.tomatoNum = result[0];
      console.log("arr",arr);
      // window.timeInterval = result[0].timeInterval
      return result;
    });
  
  // 获取信息分钟，番茄分钟统计
    const totalInfo = computed(() => {
      return getTotalMIn(props.segments);
    });
  
  /* 
  时间
  存在高亮效果
  */
    const curTomNum = computed(() => {
    
      const result = props.segments.find((item) => item.highlight);  
      return result;
    });
    
    // 剩余番茄分支统计信息
    const remainingTimeInfo = computed(() => {

      let index = props.segments.indexOf(curTomNum.value);

      
      const timeInfo = props.segments.slice(index + 1);
    
      return getTotalMIn(timeInfo);
    });
    
    const remainTimeRestNum = computed(() => {
      let index = props.segments.indexOf(curTomNum.value);
    
      let data = props.segments.slice(index + 1);
    
      let result = [0, 0]; //0 番茄, 1休息
    
      data.forEach((item) => {
        if (item.type) {
          result[0]++;
        } else {
          result[1]++;
        }
      });
      return result;
    });
  </script>
  
  <style lang="less" scoped>
  .tm-collect-bg {
    font-size: 25px;
    margin: 0px auto;
    line-height: 35px;
    & > div {
      margin-bottom: 20px;
    }
    .tm-text-highlight {
      color: red;
    }
  }
  </style>
  
  