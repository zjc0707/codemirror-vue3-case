import type {CompletionSource} from '@codemirror/autocomplete'
import {autocompletion, snippetCompletion as snip} from '@codemirror/autocomplete'
import type {Diagnostic} from '@codemirror/lint'
import {linter} from '@codemirror/lint'
import {syntaxTree} from '@codemirror/language'
import type {Ref} from 'vue'
import type {CodemirrorFunctionObj} from './types'
import {CODEMIRROR_TYPE} from './types'

type NodeName = 'VariableName'
    | 'ArgList'
    | 'Number'
    | 'String'
    | 'ArithOp'
    | 'AssignStatement'
    | 'ExpressionStatement'
    | 'CallExpression'
    | 'BinaryExpression'

export function getCodemirrorConfig(code: Ref<string>, params: {
    functions: CodemirrorFunctionObj[]
}) {
    const label2Function = new Map<CodemirrorFunctionObj['label'], CodemirrorFunctionObj>()
    for (const p of params.functions) {
        if (label2Function.has(p.label)) {
            console.error('duplicate function which label is ', p.label)
        }
        label2Function.set(p.label, p)
    }

    const myCompletions: CompletionSource = (context) => {
        const word = context.matchBefore(/\w*/)
        if (!word || (word.from === word.to && !context.explicit)) {
            return null
        }
        return {
            from: word.from,
            options: [
                ...params.functions.map(p => snip(p.template, {
                    label: p.label,
                    detail: p.detail,
                    type: 'function'
                }))
            ]
        }
    }

    let expressionType: 'CallExpression' | 'BinaryExpression' | undefined
    let executor: ((...args: unknown[]) => unknown) | undefined
    const lint = linter(view => {
        executor = undefined
        let func: (...args: unknown[]) => unknown = (a: unknown) => a

        type TypeFuncInput = {
            type: CODEMIRROR_TYPE[]
            from: number
            to: number
        }

        type TypeFuncTarget = {
            paramTypes: CODEMIRROR_TYPE[][],
            returnType: CODEMIRROR_TYPE[],
            from: number,
            to: number
        }

        let typeFunc: (...args: unknown[]) => unknown = (...args) => {
            //
            console.log('root', args)
        }

        const rs: Diagnostic[] = []

        const baseTypeFunc = (target: TypeFuncTarget, ...inputs: TypeFuncInput[]) => {
            // console.log(target, inputs)
            const lInput = inputs.length,
                lTarget = target.paramTypes.length
            if (lInput !== lTarget) {
                rs.push({
                    from: target.from,
                    to: target.to,
                    severity: 'error',
                    message: `应有 ${lTarget} 个参数，但获得 ${lInput} 个`
                })
            }

            for (let i = 0, l = Math.min(lInput, lTarget); i < l; i++) {
                const input = inputs[i]
                if (!input) continue
                if (input.type.some(p => !target.paramTypes[i].includes(p))) {
                    rs.push({
                        from: input.from,
                        to: input.to,
                        severity: 'error',
                        message: `类型'${getTypeStr(input.type)}'不能赋值给'${getTypeStr(target.paramTypes[i])}'`
                    })
                }
            }
        }

        syntaxTree(view.state).cursor().iterate(node => {
            // console.log(node.node, node.name, node.from, node.to, code.value.slice(node.from, node.to))
            const nodeName = node.name as NodeName

            const error = (msg: string) => rs.push({
                from: node.from,
                to: node.to,
                severity: 'error',
                message: msg
            })

            switch (nodeName) {
                case 'AssignStatement': {
                    error('不支持赋值表达式')
                    break
                }
                case 'BinaryExpression': {
                    const old = func
                    // @ts-ignore
                    func = (a: unknown, op: (a: unknown, b: unknown) => unknown, b: unknown) => (...inners: unknown[]) => old(op(a, b), ...inners)

                    const oldTypeFunc = typeFunc
                    const from = node.from
                    const to = node.to
                    // @ts-ignore
                    typeFunc = (a: TypeFuncInput, target: TypeFuncTarget, b: TypeFuncInput, ...args: TypeFuncInput[]) => {
                        // console.log('BinaryExpression type func', a, target, b, args)
                        baseTypeFunc(target, a, b, ...args)
                        typeFunc = (...args: unknown[]) => oldTypeFunc({
                            from,
                            to,
                            type: target.returnType
                        }, ...args)
                    }

                    break
                }
                case 'CallExpression': {
                    expressionType = nodeName
                    const old = func
                    // @ts-ignore
                    func = (method: unknown, ...args: unknown[]) => (...inners: unknown[]) => old(method(...args), ...inners)

                    const oldTypeFunc = typeFunc
                    const from = node.from
                    const to = node.to
                    // @ts-ignore
                    typeFunc = (target: TypeFuncTarget, ...args: TypeFuncInput[]) => {
                        console.log('BinaryExpression type func', target, args)
                        baseTypeFunc(target, ...args)
                        typeFunc = (...args: unknown[]) => oldTypeFunc({
                            from,
                            to,
                            type: target.returnType
                        }, ...args)
                    }
                    break
                }
                case 'VariableName': {
                    if (expressionType === 'CallExpression') {
                        expressionType = undefined
                        const name = code.value.slice(node.from, node.to)
                        const funcObj = label2Function.get(name)
                        if (!funcObj) {
                            error('未定义的函数')
                        } else {
                            const old = func
                            func = (...args: unknown[]) => old(funcObj.func, ...args)

                            const oldTypeFunc = typeFunc
                            const target: TypeFuncTarget = {
                                from: node.from,
                                to: node.to,
                                returnType: funcObj.returnType,
                                paramTypes: funcObj.paramTypes
                            }
                            typeFunc = (...args: unknown[]) => oldTypeFunc(target, ...args)
                        }
                    }

                    break
                }
                case 'Number': {
                    const v = Number.parseFloat(code.value.slice(node.from, node.to))
                    if (isNaN(v)) {
                        console.error('非法数字')
                    }
                    const old = func
                    func = (...args: unknown[]) => old(v, ...args)

                    const oldTypeFunc = typeFunc
                    const input: TypeFuncInput = {
                        type: [CODEMIRROR_TYPE.number],
                        from: node.from,
                        to: node.to
                    }
                    typeFunc = (...args: unknown[]) => oldTypeFunc(input, ...args)
                    break
                }
                case 'String': {
                    const old = func
                    func = (...args: unknown[]) => old(code.value.slice(node.from, node.to), ...args)

                    const oldTypeFunc = typeFunc
                    const input: TypeFuncInput = {
                        type: [CODEMIRROR_TYPE.string],
                        from: node.from,
                        to: node.to
                    }
                    typeFunc = (...args: unknown[]) => oldTypeFunc(input, ...args)
                    break
                }
                case 'ArithOp': {
                    const v = code.value.slice(node.from, node.to)
                    const label = (() => {
                        switch (v) {
                            case '+':
                                return 'add'
                            case '-':
                                return 'sub'
                            case '*':
                                return 'multiply'
                            case '/':
                                return 'divide'
                        }
                    })()
                    if (!label) {
                        error(`未定义的运算符: ${v}`)
                        break
                    }
                    const funcObj = label2Function.get(label)
                    if (!funcObj) {
                        error(`未定义的计算方法: "${v}"(${label})`)
                        break
                    }
                    const old = func
                    func = (...args: unknown[]) => old(funcObj.func, ...args)

                    const oldTypeFunc = typeFunc
                    const target: TypeFuncTarget = {
                        from: node.from,
                        to: node.to,
                        returnType: funcObj.returnType,
                        paramTypes: funcObj.paramTypes
                    }
                    typeFunc = (...args: unknown[]) => oldTypeFunc(target, ...args)
                    break
                }
                default:
                    if (nodeName.charCodeAt(1) === 9888) {
                        error('错误的输入')
                    }

                    break
            }
        }, node => {
            const nodeName = node.name as NodeName

            switch (nodeName) {
                case 'CallExpression':
                case 'BinaryExpression': {
                    const old = func
                    // @ts-ignore
                    func = (...args: unknown[]) => old()(...args)

                    try {
                        typeFunc()
                    } catch (e) {
                        console.error(e)
                    }

                    break
                }
            }
        })

        if (rs.length === 0) {
            executor = func
        }
        return rs
    })

    return {
        extensions: [
            autocompletion({
                override: [myCompletions]
            }),
            lint
        ],
        getExecutor: () => executor
    }
}

function getTypeStr(inputs: CODEMIRROR_TYPE[]) {
    return inputs.map(p => CODEMIRROR_TYPE[p]).join('|')
}
