import { createApp } from 'vue'
import App from './App.vue'
import './assets/base.less'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app');

let arr = ['1','2','3']

type T1 = typeof arr[number]

type MyReadonly<T> = {
 readonly [P in keyof T]: T[P];
};

type T2 = keyof typeof arr

