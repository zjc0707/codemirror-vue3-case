import {CODEMIRROR_TYPE} from "../codemirrorConfig/types.ts";
import {ReflectUtil} from "./ReflectUtil.ts";

type OrArray<T> = T | T[]

export const cmParam = (type: OrArray<keyof typeof CODEMIRROR_TYPE>, label?: string) => ReflectUtil.paramDefineMetadata('cm', {
    label,
    type: type instanceof Array ? type.map(p => CODEMIRROR_TYPE[p]) : [CODEMIRROR_TYPE[type]]
})

export const cmFunction = (type: OrArray<keyof typeof CODEMIRROR_TYPE> = 'void', label?: string, detail?: string) =>
    ReflectUtil.methodDefineMetadata('cm', {
        type: type instanceof Array ? type.map(p => CODEMIRROR_TYPE[p]) : [CODEMIRROR_TYPE[type]],
        label,
        detail
    })
