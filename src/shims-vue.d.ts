// ================================
// Vue SFC 类型声明（TypeScript 能识别 .vue 文件）
// ================================
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
