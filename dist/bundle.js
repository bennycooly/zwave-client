/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = __webpack_require__(0);
const OpenZWave = __webpack_require__(6);
const zwave_node_1 = __webpack_require__(2);
const config = __webpack_require__(8);
class ZWaveClient extends EventEmitter {
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
    get nodes() {
        return this._nodes;
    }
    registerEvents(zwave) {
        zwave.on("driver ready", (homeid) => {
            console.log("scanning homeid=0x%s...", homeid.toString(16));
        });
        zwave.on("driver failed", () => {
            console.log("failed to start driver");
            zwave.disconnect();
            process.exit();
        });
        zwave.on("node added", (nodeid) => {
            let newNode = new zwave_node_1.ZWaveNode(nodeid);
            this._nodes.push(newNode);
            this.emit("node added", newNode);
        });
        zwave.on("value added", (nodeid, comclass, value) => {
            let node = this._nodes[nodeid];
            let classes = node.classes;
            if (!classes[comclass])
                classes[comclass] = {};
            classes[comclass][value.index] = value;
        });
        zwave.on("value changed", (nodeid, comclass, value) => {
            if (this._nodes[nodeid]["ready"]) {
                console.log("node%d: changed: %d:%s:%s->%s", nodeid, comclass, value["label"], this._nodes[nodeid]["classes"][comclass][value.index]["value"], value["value"]);
            }
            this._nodes[nodeid]["classes"][comclass][value.index] = value;
            if (nodeid === 2 && value.genre === "config") {
                // set timeout to 10 secs
                let config = {};
                config.index = 3;
                config.value = 10;
                config.width = 2;
                if (value.value != config.value) {
                    zwave.setConfigParam(nodeid, config.index, config.value, config.width);
                }
                // console.log(`PIR time: ${zwave.requestConfigParam(nodeid, 3)}`);
            }
        });
        zwave.on("value removed", (nodeid, comclass, index) => {
            if (this._nodes[nodeid]["classes"][comclass] &&
                this._nodes[nodeid]["classes"][comclass][index])
                delete this._nodes[nodeid]["classes"][comclass][index];
        });
        zwave.on("node ready", (nodeid, nodeinfo) => {
            this._nodes[nodeid]["manufacturer"] = nodeinfo.manufacturer;
            this._nodes[nodeid]["manufacturerid"] = nodeinfo.manufacturerid;
            this._nodes[nodeid]["product"] = nodeinfo.product;
            this._nodes[nodeid]["producttype"] = nodeinfo.producttype;
            this._nodes[nodeid]["productid"] = nodeinfo.productid;
            this._nodes[nodeid]["type"] = nodeinfo.type;
            this._nodes[nodeid]["name"] = nodeinfo.name;
            this._nodes[nodeid]["loc"] = nodeinfo.loc;
            this._nodes[nodeid]["ready"] = true;
            console.log("node%d: %s, %s", nodeid, nodeinfo.manufacturer ? nodeinfo.manufacturer
                : "id=" + nodeinfo.manufacturerid, nodeinfo.product ? nodeinfo.product
                : "product=" + nodeinfo.productid +
                    ", type=" + nodeinfo.producttype);
            console.log("node%d: name='%s', type='%s', location='%s'", nodeid, nodeinfo.name, nodeinfo.type, nodeinfo.loc);
            for (let comclass of this._nodes[nodeid].classes) {
                switch (comclass) {
                    case 0x25: // COMMAND_CLASS_SWITCH_BINARY
                    case 0x26:
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
        zwave.on("notification", (nodeid, notif) => {
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
        zwave.on("controller command", function (r, s) {
            console.log("controller commmand feedback: r=%d, s=%d", r, s);
        });
        process.on("SIGINT", function () {
            console.log("disconnecting...");
            zwave.disconnect(ZWaveClient.port);
            process.exit();
        });
    }
}
exports.ZWaveClient = ZWaveClient;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class ZWaveNode {
    constructor(id) {
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
exports.ZWaveNode = ZWaveNode;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const zwave_1 = __webpack_require__(1);
let client = new zwave_1.ZWaveClient();
let domNodeList = document.getElementById("nodes");
client.on("node added", (node) => {
    console.log("added node!");
    let domNode = document.createElement("li");
    domNode.className = "mdc-list-item";
    let domNodeInfo = document.createElement("p");
    let domNodeInfoText = document.createTextNode(JSON.stringify(node));
    domNodeInfo.appendChild(domNodeInfoText);
    domNode.appendChild(domNodeInfo);
    if (domNodeList) {
        domNodeList.appendChild(domNode);
        domNode.setAttribute("id", `node${node.id}`);
        console.log("appended node: " + domNode.innerHTML);
    }
});


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {try {global.process.dlopen(module, "D:\\Ben\\Projects\\College\\2017_Spring\\EE_360\\zwave-client\\node_modules\\openzwave-shared\\build\\Release\\openzwave_shared.node"); } catch(e) {throw new Error('Cannot open ' + "D:\\Ben\\Projects\\College\\2017_Spring\\EE_360\\zwave-client\\node_modules\\openzwave-shared\\build\\Release\\openzwave_shared.node" + ': ' + e);}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)(module)))

/***/ }),
/* 5 */
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	throw new Error("Cannot find module '" + req + "'.");
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 5;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname) {/*
 * Copyright (c) 2013 Jonathan Perkin <jonathan@perkin.org.uk>
 * Copyright (c) 2015-2017 Elias Karakoulakis <elias.karakoulakis@gmail.com>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var fs = __webpack_require__(9);
var EventEmitter = __webpack_require__(0).EventEmitter;

var debugAddon     = __dirname + '/../build/Debug/openzwave_shared.node';
var releaseAddon   = __dirname + '/../build/Release/openzwave_shared.node';
var addonFileName  = ((fs.existsSync(debugAddon)) ? debugAddon : releaseAddon);

 console.log("initialising OpenZWave addon ("+addonFileName+")");
// var addonModule = require(addonFileName);

var addonModule;

if (fs.existsSync(debugAddon)) {
	addonModule = !(function webpackMissingModule() { var e = new Error("Cannot find module \".\""); e.code = 'MODULE_NOT_FOUND'; throw e; }());
}
else {
	addonModule = __webpack_require__(4);
}

/*
 * we need a proxy EventEmitter instance because apparently there's
 * no (easy?) way to inherit an EventEmitter (JS code) from C++
 **/
var ee = new EventEmitter();

addonModule.Emitter.prototype.addListener = function(evt, callback) {
	ee.addListener(evt, callback);
}
addonModule.Emitter.prototype.on = addonModule.Emitter.prototype.addListener;
addonModule.Emitter.prototype.emit = function(evt, arg1, arg2, arg3, arg4) {
	ee.emit(evt, arg1, arg2, arg3, arg4);
}
addonModule.Emitter.prototype.removeListener = function(evt, callback) {
	ee.removeListener(evt, callback);
}
addonModule.Emitter.prototype.removeAllListeners = function(evt) {
	ee.removeAllListeners(evt);
}

module.exports = addonModule.Emitter;

/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = {
	"port": "\\\\.\\COM3"
};

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ })
/******/ ]);