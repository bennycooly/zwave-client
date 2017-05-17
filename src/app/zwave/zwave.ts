
import * as EventEmitter from "events";
const OpenZWave = require("openzwave-shared");


import { ZWaveNode, ComClass } from "./zwave-node";
const config = require("../config/zwave.json");


/**
 * ZWave Client.
 * Manages the OpenZWave Client status and list of nodes connected.
 */
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
            this._nodes[nodeid] = newNode;
            this.emit("node added", newNode);
        });

        zwave.on("value added", (nodeid: number, comClassId: number, value: any) => {
            let node = this._nodes[nodeid];
            // First check if the ComClass exists.
            if (!node.classes[comClassId] === undefined) {
                // Create the ComClass here.
                node.classes[comClassId] = new ComClass(comClassId);
            }
            let nodeComClass = node.classes[comClassId];
            nodeComClass.values[value.index] = value;
            this.emit("node updated", node);
        });

        zwave.on("value changed", (nodeid: number, comClassId: number, value: any) => {
            let node = this._nodes[nodeid];
            if (node.ready) {
                console.log(
                    `node${nodeid}: changed:${comClassId}:${value.label}:${node.classes[comClassId].values[value.index]}:${value.value}`
                    );
            }

            node.classes[comClassId].values[value.index].set(value);

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

            this.emit("node updated", node);
        });

        zwave.on("value removed", (nodeid: number, comClassId: number, index: any) => {
            if (this._nodes[nodeid]["classes"][comClassId] &&
                this._nodes[nodeid]["classes"][comClassId][index])
                delete this._nodes[nodeid]["classes"][comClassId][index];
        });

        zwave.on("node ready", (nodeid: number, nodeinfo: any) => {
            let node = this._nodes[nodeid];
            node["manufacturer"] = nodeinfo.manufacturer;
            node["manufacturerid"] = nodeinfo.manufacturerid;
            node["product"] = nodeinfo.product;
            node["producttype"] = nodeinfo.producttype;
            node["productid"] = nodeinfo.productid;
            node["type"] = nodeinfo.type;
            node["name"] = nodeinfo.name;
            node["loc"] = nodeinfo.loc;
            node["ready"] = true;
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

            for (let comClass of node.classes) {
                switch (comClass.value) {
                    case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                    case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                        zwave.enablePoll(nodeid, comClass);
                        break;
                }
                let values = this._nodes[nodeid]["classes"][comClass];
                console.log("node%d: class %d", nodeid, comClass);
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
