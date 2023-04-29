import {CODEMIRROR_TYPE} from "../codemirrorConfig/types.ts";

export type ReflectMethodTypeMap = {
    cm: {
        type: CODEMIRROR_TYPE[]
        label?: string
        detail?: string
    }
}

export type ReflectParamTypeMap = {
    cm: {
        label?: string
        type: CODEMIRROR_TYPE[]
    }
}
