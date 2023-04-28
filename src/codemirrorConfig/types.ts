export enum CODEMIRROR_TYPE {
    void,
    number,
    string,
}

export type CodemirrorFunctionObj = {
    label: string
    detail?: string
    template: string
    func: (...args: never[]) => unknown
    returnType: CODEMIRROR_TYPE[]
    paramTypes: CODEMIRROR_TYPE[][]
}
