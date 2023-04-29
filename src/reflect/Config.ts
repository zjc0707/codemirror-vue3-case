import {cmFunction, cmParam} from "./decorate.ts";

export class Config {
    @cmFunction('number')
    add(@cmParam('number') a: number, @cmParam('number') b: number) {
        return a + b
    }
}
