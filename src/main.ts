import { createApp } from "vue";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// import './styles/dark-mode.css'

import App from "./App.vue";

// 确保在浏览器环境中不执行Tauri相关代码
if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    // Tauri环境下的初始化
    console.log('Running in Tauri environment');
} else {
    console.log('Running in browser environment');
}

const app = createApp(App)
app.use(ElementPlus)
app.mount("#app");
