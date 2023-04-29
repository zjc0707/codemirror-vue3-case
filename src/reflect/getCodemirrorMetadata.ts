import {ReflectUtil} from './ReflectUtil'
import type {CodemirrorFunctionObj} from '../codemirrorConfig/types'

export function getCodemirrorMetadata(obj: Object) {
    const prototype = Object.getPrototypeOf(obj)
    const functionNames = Object.getOwnPropertyNames(prototype)
        .filter(p => p !== 'constructor' && typeof prototype[p] === 'function')

    const rs: CodemirrorFunctionObj[] = []
    for (const functionName of functionNames) {
        const funcMetadata = ReflectUtil.getMetadata('cm', prototype, functionName)
        if (!funcMetadata) continue

        const label = funcMetadata.label ?? functionName
        const paramMetaData = ReflectUtil.getParamMetaData('cm', prototype, functionName)
        const templateParamStr = paramMetaData
            ?.map((p, index) => `#{${p.label ?? ('arg' + index)}}`).join(',') ?? ''
        rs.push({
            label,
            detail: funcMetadata.detail,
            template: `${label}(${templateParamStr})`,
            func: (...args) => (obj[functionName as never] as (...args: never[]) => unknown)(...args),
            returnType: funcMetadata.type,
            paramTypes: paramMetaData?.map(p => p.type) ?? []
        })
    }

    return rs
}
