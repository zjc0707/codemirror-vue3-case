/// <reference types="vite/client" />

declare module '*.vue' {
    import type {DefineComponent} from 'vue'
    // eslint-disable-next-line
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '*.svg' {
    const src: string
    export default src
}
declare module '*.png' {
    const src: string
    export default src
}
