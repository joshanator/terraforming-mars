declare module '*.vue' {
  import {DefineComponent} from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@vue-flow/core/dist/style.css';
declare module '@vue-flow/core/dist/theme-default.css';
declare module '@vue-flow/controls/dist/style.css';
