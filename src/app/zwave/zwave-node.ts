
import { ComClass } from "./comclass";

class ZWaveNode {
    id: number;
    manufacturer: string;
    manufacturerid: string;
    product: string;
    producttype: string;
    productid: string;
    type: string;
    name: string;
    loc: string;
    classes: ComClass[];
    ready: boolean;

    constructor(id: number) {
        this.id = id;
        this.manufacturer = "";
        this.manufacturerid = "";
        this.product = "";
        this.producttype = "";
        this.productid = "";
        this.type = "";
        this.name = "";
        this.loc = "";
        this.classes = [];
        this.ready = false;
    }

}

export { ZWaveNode };
