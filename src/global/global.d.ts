
declare module "tomato" {
    export type TomatoConfig = {
        tomatoTimeSize: number,
        restTimeSize: number,  //小休息
        bigRestTimeSize: number,//大休息时间
        happenBigSegment: number //间隔时间
    }

    export  interface TimeIntervalObject {
        timeBucket: string;
        timeInterval: number;
        id: number;
        type: boolean;
        count: number;
        endTime: number;
        highlight: boolean;
    }

    export interface Segments {
        segments: TimeIntervalObject[]
    }

    export type TimePickerType = Date | [Date, Date] | [number, number] | [string, string] |[]

    
}


declare global {
    interface Window {
      tomatoNum: number;
    }
  }
declare module "store"