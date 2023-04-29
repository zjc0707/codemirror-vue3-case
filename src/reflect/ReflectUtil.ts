import type {ReflectMethodTypeMap, ReflectParamTypeMap} from './type'
import 'reflect-metadata'

export class ReflectUtil {
    static paramDefineMetadata<K extends keyof ReflectParamTypeMap>(key: K, value: ReflectParamTypeMap[K]): ParameterDecorator {
        return (target, propertyKey, parameterIndex) => {
            if (propertyKey === undefined) {
                console.error('propertyKey is undefined')
                return
            }

            const v = this.getParamMetaData(key, target, propertyKey)
            if (v) {
                v[parameterIndex] = value
            } else {
                const arr = []
                arr[parameterIndex] = value
                Reflect.defineMetadata('param:' + key.toString(), arr, target, propertyKey)
            }
        }
    }

    static methodDefineMetadata<K extends keyof ReflectMethodTypeMap>(key: K, value: ReflectMethodTypeMap[K]): MethodDecorator {
        return (target, propertyKey) => {
            Reflect.defineMetadata(key, value, target, propertyKey)
        }
    }

    static getMetadata<K extends keyof ReflectMethodTypeMap>(metadataKey: K, target: Object, propertyKey: string): ReflectMethodTypeMap[K] | undefined
    static getMetadata(metadataKey: string, target: Object, propertyKey?: string) {
        if (propertyKey) {
            return Reflect.getMetadata(metadataKey, target, propertyKey)
        } else {
            return Reflect.getMetadata(metadataKey, target)
        }
    }

    static getParamMetaData<K extends keyof ReflectParamTypeMap>(metadataKey: K, target: Object, propertyKey: string | symbol): ReflectParamTypeMap[K][] | undefined {
        return Reflect.getMetadata('param:' + metadataKey.toString(), target, propertyKey)
    }

    static hasMetadata(metadataKey: keyof ReflectMethodTypeMap, target: Object, propertyKey: string): boolean
    static hasMetadata(metadataKey: string, target: Object, propertyKey?: string): boolean {
        if (propertyKey) {
            return Reflect.hasMetadata(metadataKey, target, propertyKey)
        } else {
            return Reflect.hasMetadata(metadataKey, target)
        }
    }
}
