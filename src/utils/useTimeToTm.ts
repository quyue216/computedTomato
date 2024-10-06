import dayjs from "dayjs";
import type { TomatoConfig, TimeIntervalObject } from "@/global/global";

export default function useTimeTm(configData: TomatoConfig,
  timesInfo: [Date, Date]) {

  const {
    tomatoTimeSize,
    restTimeSize,  //小休息
    bigRestTimeSize,//大休息时间
    happenBigSegment //间隔时间
  } = configData;

  const FORMAT_RULE: "HH:mm" = "HH:mm";

  const TOMATO_MIN_TIME = 10;

  const segments: Array<TimeIntervalObject> = [] //存储返回后的数据

  const startTimestamp = dayjs(timesInfo[0]).valueOf();

  const endTimestamp = dayjs(timesInfo[1]).valueOf();

  let runtimeVars = {
    isWork: true,
    tmCount: 0,
    restCount: 0
  };

  // 模块化划分得好处
  const getTimeSize = ({
    isWork,
    tmCount,
  }: Omit<typeof runtimeVars, "restCount">) => {
    if (isWork) {
      return tomatoTimeSize
    } else {
      return tmCount % happenBigSegment === 0 ? bigRestTimeSize : restTimeSize;
    }
  }

  // 生成时间段信息
  for (let timestamp = startTimestamp; timestamp < endTimestamp;) { //这里条件不等于

    let {
      isWork,
      tmCount,
      restCount
    } = runtimeVars;


    let timeInterval = getTimeSize(runtimeVars);

    // 计算时间段
    let startTimeObj = dayjs(timestamp); //开始时间对象

    let startMinute = startTimeObj.minute();

    let endTimeObj = startTimeObj.minute(startMinute + timeInterval); //截止时间对象

    // 获取格式化信息
    let formatStr = startTimeObj.format(FORMAT_RULE) + ' - ' + endTimeObj.format(FORMAT_RULE);

    // 当前初始时间加上时间段大于截止时间就发生跨界了
    // interval加上大于截止时间，也就是说剩余时间不满足一个番茄!
    // 加上
    if (endTimeObj.valueOf() > endTimestamp) {

      const lastTomObj = segments[segments.length - 1];

      const minute = dayjs(endTimestamp).diff(startTimeObj, 'minute');

      if (minute > TOMATO_MIN_TIME) {
        if (isWork) {
          timeInterval = minute
          // 1. 是番茄，时间大于10分钟   则划分成一个番茄
          // 2. 是休息，时间大于10分钟， 不处理直接划分即可
          const endTime = startTimeObj.add(timeInterval, "minute").valueOf();

          formatStr = startTimeObj.format(FORMAT_RULE) + ' - ' +
            dayjs(endTime).format(FORMAT_RULE);
        }
      } else {
        //  如果是番茄，时间又小于10分钟，
        if (!lastTomObj.type) { //false表示休息，
          // 假设上一个是番茄时间，我将剩余时间和休息时间划分为一个整体
          lastTomObj.endTime = dayjs(lastTomObj.endTime).add(minute, "minute").valueOf();

          lastTomObj.timeBucket =
            dayjs(lastTomObj.id).format(FORMAT_RULE) +
            ' - ' + dayjs(lastTomObj.endTime).format(FORMAT_RULE);

          lastTomObj.timeInterval += minute;

          return segments;
        }
        //! 上一个番茄是休息时间，又小于10则允许跨界
        //! 我不用添加任何代码，初始时间加上时间段得到结束时间，正常算即可 
      }

    }

    if (isWork) {
      tmCount++;
    } else {
      restCount++;
    }
    // 保存数据
    segments.push({
      timeBucket: formatStr, //时间段
      timeInterval, //番茄大小
      id: timestamp, //id  开始时间
      type: isWork, //标识是番茄还是休息
      count: isWork ? tmCount : restCount,
      endTime: endTimeObj.valueOf(), //结束时间
      highlight: false
    });

    isWork = !isWork;
    // 更新状态信息
    runtimeVars = {
      tmCount,
      restCount,
      isWork
    }
    // 更新循环条件
    timestamp = endTimeObj.valueOf();
  }
  return segments;
}