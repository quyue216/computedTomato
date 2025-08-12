type Merge<T, S> = {
  [P in keyof T as P extends keyof S ? never : P]: T[P];
} & S;

type Tuple2<T> = [T, T]