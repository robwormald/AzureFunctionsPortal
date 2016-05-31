import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Rx';

let cachedData: {[key: string]: {date?: Date, observable: Observable<any>, data?: any}} = {};

export function Cache(propertyKey?: string) {
    return (target: Object, functionName: string, descriptor: TypedPropertyDescriptor<any>) => {
        let originalMethod = descriptor.value;
        descriptor.value = function(...args: any[]) {

            let key = getCacheKey(functionName, propertyKey, args);
            let cache = cachedData[key];
            if (cache && cache.data) {
                return Observable.of(cache.data);
            } else if (cache && cache.observable){
                return cache.observable;
            } else {
                cache = {
                    observable: originalMethod.apply(this, args)
                    .map(r => {
                        delete cache.observable;
                        cache.data = r;
                        return cache.data;
                    }).share()
                };
                cachedData[key] = cache;
                return cache.observable;
            }
        };
        return descriptor;
    };
}

export function ClearCache(functionName: string, propertyKey?: string) {
    return (target: Object, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => {
        let originalMethod = descriptor.value;
        descriptor.value = function(...args: any[]) {
            if (functionName === 'clearAllCachedData') {
                cachedData = {};
            } else {
                let key = getCacheKey(functionName, propertyKey, args);
                delete cachedData[key];
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}

function getCacheKey(functionName: string, propertyName: string, args: any[]): string {
    let key: string = `${functionName}+`;
    if (propertyName && args && args.length > 0 && args[0][propertyName]) {
        key += args[0][propertyName];
    } else if (args && args.length > 0 && typeof args[0] === 'string') {
        key += args[0];
    } else if (args && args.length > 1) {
        key += JSON.stringify(args);
    }
    return key;
}