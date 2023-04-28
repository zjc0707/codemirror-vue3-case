<script setup lang="ts">
import {ref, shallowRef} from "vue";
import type {EditorView} from '@codemirror/view'
import type {Extension} from '@codemirror/state'
import {python} from '@codemirror/lang-python'
import {Codemirror} from "vue-codemirror";
import {getCodemirrorConfig} from "./codemirrorConfig/getCodemirrorConfig.ts";
import {CODEMIRROR_TYPE} from "./codemirrorConfig/types.ts";

const code = ref('')
const result = ref('请点击执行按钮')
const view = shallowRef<EditorView>(null!)
const codeConfig = getCodemirrorConfig(code, {
    functions: [
        {
            label: 'add',
            template: 'add(${arg0}, ${arg1})',
            func: (a: number, b: number) => a + b,
            returnType: [CODEMIRROR_TYPE.number],
            paramTypes: [[CODEMIRROR_TYPE.number], [CODEMIRROR_TYPE.number]]
        }
    ]
})

const extensions: Extension[] = [
    python(),
    ...codeConfig.extensions
]

function onReady(payload: { view: EditorView }) {
    console.log('payload', payload)
    view.value = payload.view
}

function onChange(code: string) {
    console.log('change', code)
    result.value = '请点击执行按钮'
}

function execute() {
    const func = codeConfig.getExecutor()
    if (!func) {
        result.value = '错误的表达式'
        return
    }
    result.value = func() as string
}
</script>

<template>
    <div style="width: 12rem">
        <button @click="execute">exec</button>
        <Codemirror
                v-model="code"
                placeholder="no data"
                :autofocus="true"
                :indent-with-tab="true"
                :tab-size="2"
                :extensions="extensions"
                @ready="onReady"
                @change="onChange"
                style="height: 12rem; border: lightgray 1px solid"
        />
        <div style="border: lightgray 1px solid">
            {{ result }}
        </div>
    </div>
</template>

<style scoped>
</style>
