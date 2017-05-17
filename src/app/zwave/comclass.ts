
import { ValueClass } from "./valueclass";

class ComClass {
    values: ValueClass[];
    identifier: string;
    id: number;

    constructor(id: number) {
        this.id = id;
        this.values = [];
    }
}



export { ComClass };
