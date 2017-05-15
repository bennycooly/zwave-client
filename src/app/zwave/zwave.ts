
import * as EventEmitter from "events";
const OpenZWave = require("openzwave-shared");


import { ZWaveNode } from "./zwave-node";
const config = require("../config/zwave.json");



class ZWaveClient extends EventEmitter {
    private static port: string;

    private _zwave: any;
    private _nodes: ZWaveNode[];

    constructor() {
        super();

        // Read configuration params first.
        ZWaveClient.port = config.port;

        this._zwave = new OpenZWave({
            ConsoleOutput: false
        });

        this._nodes = [];

        this.registerEvents(this._zwave);

        this._zwave.connect(ZWaveClient.port);
    }

    public get nodes(): ZWaveNode[] {
        return this._nodes;
    }

    registerEvents(zwave: any) {

        zwave.on("driver ready", (homeid: number) => {
            console.log("scanning homeid=0x%s...", homeid.toString(16));
        });

        zwave.on("driver failed", () => {
            console.log("failed to start driver");
            zwave.disconnect();
            process.exit();
        });

        zwave.on("node added", (nodeid: number) => {
            let newNode = new ZWaveNode(nodeid);
            this._nodes.push(newNode);
            this.emit("node added", newNode);
        });

        zwave.on("value added", (nodeid: number, comclass: number, value: any) => {
            let node = this._nodes[nodeid];
            let classes = node.classes;
            if (!classes[comclass])
                classes[comclass] = {};
            classes[comclass][value.index] = value;
        });

        zwave.on("value changed", (nodeid: number, comclass: number, value: any) => {
            if (this._nodes[nodeid]["ready"]) {
                console.log("node%d: changed: %d:%s:%s->%s", nodeid, comclass,
                    value["label"],
                    this._nodes[nodeid]["classes"][comclass][value.index]["value"],
                    value["value"]);
            }
            this._nodes[nodeid]["classes"][comclass][value.index] = value;

            if (nodeid === 2 && value.genre === "config") {
                // set timeout to 10 secs
                let config: any = {};
                config.index = 3;
                config.value = 10;
                config.width = 2;
                if (value.value != config.value) {
                    zwave.setConfigParam(nodeid, config.index, config.value, config.width);
                }
                // console.log(`PIR time: ${zwave.requestConfigParam(nodeid, 3)}`);
            }
        });

        zwave.on("value removed", (nodeid: number, comclass: number, index: any) => {
            if (this._nodes[nodeid]["classes"][comclass] &&
                this._nodes[nodeid]["classes"][comclass][index])
                delete this._nodes[nodeid]["classes"][comclass][index];
        });

        zwave.on("node ready", (nodeid: number, nodeinfo: any) => {
            this._nodes[nodeid]["manufacturer"] = nodeinfo.manufacturer;
            this._nodes[nodeid]["manufacturerid"] = nodeinfo.manufacturerid;
            this._nodes[nodeid]["product"] = nodeinfo.product;
            this._nodes[nodeid]["producttype"] = nodeinfo.producttype;
            this._nodes[nodeid]["productid"] = nodeinfo.productid;
            this._nodes[nodeid]["type"] = nodeinfo.type;
            this._nodes[nodeid]["name"] = nodeinfo.name;
            this._nodes[nodeid]["loc"] = nodeinfo.loc;
            this._nodes[nodeid]["ready"] = true;
            console.log("node%d: %s, %s", nodeid,
                nodeinfo.manufacturer ? nodeinfo.manufacturer
                    : "id=" + nodeinfo.manufacturerid,
                nodeinfo.product ? nodeinfo.product
                    : "product=" + nodeinfo.productid +
                    ", type=" + nodeinfo.producttype);
            console.log("node%d: name='%s', type='%s', location='%s'", nodeid,
                nodeinfo.name,
                nodeinfo.type,
                nodeinfo.loc);

            for (let comclass of this._nodes[nodeid].classes) {
                switch (comclass) {
                    case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                    case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                        zwave.enablePoll(nodeid, comclass);
                        break;
                }
                let values = this._nodes[nodeid]["classes"][comclass];
                console.log("node%d: class %d", nodeid, comclass);
                for (let idx in values)
                    console.log("node%d:   %s=%s", nodeid, values[idx]["label"], values[idx]["value"]);
            }

            // if multisensor, then we set params here
            console.log(nodeinfo.product);
            if (nodeinfo.product == "ZW100 MultiSensor 6") {
                // set timeout to 10 secs
                zwave.setConfigParam(nodeid, 3, 10, 2);
                console.log(`PIR time: ${zwave.requestConfigParam(nodeid, 3)}`);
            }
        });

        zwave.on("notification", (nodeid: number, notif: number) => {
            switch (notif) {
                case 0:
                    console.log("node%d: message complete", nodeid);
                    break;
                case 1:
                    console.log("node%d: timeout", nodeid);
                    break;
                case 2:
                    console.log("node%d: nop", nodeid);
                    break;
                case 3:
                    console.log("node%d: node awake", nodeid);
                    break;
                case 4:
                    console.log("node%d: node sleep", nodeid);
                    break;
                case 5:
                    console.log("node%d: node dead", nodeid);
                    break;
                case 6:
                    console.log("node%d: node alive", nodeid);
                    break;
            }

        });

        zwave.on("scan complete", function () {
            console.log("====> scan complete, hit ^C to finish.");
            // set dimmer node 5 to 50%
            //zwave.setValue(5,38,1,0,50);
            // zwave.setValue( {node_id:5, class_id: 38, instance:1, index:0}, 50);
            // // Add a new device to the ZWave controller
            // if (zwave.hasOwnProperty("beginControllerCommand")) {
            //   // using legacy mode (OpenZWave version < 1.3) - no security
            //   zwave.beginControllerCommand("AddDevice", true);
            // } else {
            //   // using new security API
            //   // set this to "true" for secure devices eg. door locks
            //   zwave.addNode(false);
            // }
        });

        zwave.on("controller command", function (r: number, s: number) {
            console.log("controller commmand feedback: r=%d, s=%d", r, s);
        });

        process.on("SIGINT", function () {
            console.log("disconnecting...");
            zwave.disconnect(ZWaveClient.port);
            process.exit();
        });

    }
}

export { ZWaveClient };
