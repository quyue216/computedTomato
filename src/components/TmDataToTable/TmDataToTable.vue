<template>
    <div>
      <el-table
        class="el-table--big-font"
        border
        :data="segments"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column
          prop="timeBucket"
          label="时间段"
          align="center"
          width="180"
        >
        </el-table-column>
  
        <el-table-column
          prop="timeInterval"
          label="时间划分"
          align="center"
          width="120"
        >
        </el-table-column>
  
        <el-table-column
          :formatter="numToStr"
          prop="type"
          label="类型"
          align="center"
           :filter-method="filterTag"
          :filters="[
          { text: 'tomato', value: 'true' },
          { text: 'rest', value: 'false' },
          ]"
        >
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup lang="ts">
  import type {TimeIntervalObject } from "tomato";

  import { ElTable, ElTableColumn} from "element-plus";
  
  import { defineProps } from "vue";
  
  const props = defineProps<{
    segments:Array<TimeIntervalObject>
  }>();
  
  const tableRowClassName = function ({ row, rowIndex }:{row:TimeIntervalObject,rowIndex:number}) {
    // highLight
    let classStr = "";
    
    if(row.highlight){ //高亮当前表格
    classStr += "highLight"
    }
    
    if (rowIndex % 2 === 0) {
      classStr += " warning-row";
    }
  
    return classStr;
  };
  
  // 格式化
  const numToStr = (rowData:TimeIntervalObject) => {
    return rowData.type ? `第${rowData.count}个番茄` : `第${rowData.count}个休息`;
  };
  
  const filterTag = (value:string, row:TimeIntervalObject) => {
    
     return String(row.type) === value;
  };
  </script>
  
  <style lang="less" scoped>
  .el-table--big-font {
    font-size: 18px;
  }
  .el-table /deep/ .warning-row{
    background: oldlace;
  }
  
  .el-table /deep/ .highLight{
    color: red;
  }
  </style>
  
  