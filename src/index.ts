
import { ZWaveClient } from "./app/zwave/zwave";
import { ZWaveNode } from "./app/zwave/zwave-node";

let client = new ZWaveClient();

let domNodeList = document.getElementById("nodes");

client.on("node added", (node: ZWaveNode) => {
    console.log("added node!");
    let domNode = document.createElement("li");
    domNode.className = "mdc-list-item";
    let domNodeInfo = document.createElement("p");
    let domNodeInfoText = document.createTextNode(JSON.stringify(node));
    domNodeInfo.appendChild(domNodeInfoText);
    domNode.appendChild(domNodeInfo);
    if (domNodeList) {
        domNodeList.appendChild(domNode);
        domNode.setAttribute("id", `node${node.id}`)
        console.log("appended node: " + domNode.innerHTML);
    }
});
