import dayjs from "dayjs";

export const initTimeInfo = () => {
    // dayjs()
    const now = dayjs(); // 获取当前时间
  
    const startTime = now.add(10, "minute").startOf("minute").second(0).toDate(); // 获取当前时间十分钟后的Date对象
  
    let endTime = dayjs(startTime)
      .add(120, "minute")
      .startOf("minute")
      .second(0)
      .toDate();

    const todayEndTime = dayjs(`${ now.format("YYYY-MM-DD")} 23:59:59`);

    // 处理结尾边界
      if(!dayjs(endTime).isBefore(todayEndTime)){

        endTime = todayEndTime.toDate()
       
      }
    
     return [startTime,endTime] as [Date,Date];
};

