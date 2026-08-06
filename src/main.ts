// ================================
// 应用入口文件
// ================================
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import './style.css'

// 创建 Pinia 状态管理（带离线持久化插件）
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建并挂载 Vue 应用
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
