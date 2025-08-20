// declare module "tomato" {
   
     type TomatoConfig = {
        tomatoTimeSize: number,
        restTimeSize: number,  //小休息
        bigRestTimeSize: number,//大休息时间
        happenBigSegment: number //间隔时间
        mergeInfo: number[]
    }

     interface TimeIntervalObject {
        timeBucket: string;
        timeInterval: number; //番茄大小 30
        id: number; //开始时间
        type: boolean;
        count: number;
        endTime: number;
        highlight: boolean;
        index: number;
        // merged?: [number,number];
    }

     interface Segments {
        segments: TimeIntervalObject[]
    }

     type TimePickerType = Date | [Date, Date] | [number, number] | [string, string] | []


// }


declare module "store"{
    // export getItem: (key: string) => any;
    export interface Store {
        get<T = any>(key: string): T | undefined;
        set<T = any>(key: string, value: T): void;
        remove(key: string): void;
        clearAll(): void;
        each(callback: (value: any, key: string) => void): void;
    }
    
    const store: Store;
    export default store;
}
// 唯一id类型
type  cryptoUUID = ReturnType<typeof crypto.randomUUID>

// 基础的番茄配置
type BaseTomatoConfig = {
    configData: TomatoConfig;
    timeInfo:Tuple2<Date>;
    onlyShowTm: boolean;
    uuid:cryptoUUID;
    work?:boolean; //标识为工作时间
}

