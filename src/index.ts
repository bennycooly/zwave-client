
import { ZWaveClient } from "./app/zwave/zwave";
import { ZWaveNode } from "./app/zwave/zwave-node";

let client = new ZWaveClient();

// Get the node list (ul element)
let elNodeList = document.getElementById("nodes");

/**
 * Updates the node's value in the node list.
 */
function updateNodes(node: ZWaveNode): void {

}

client.on("node added", (node: ZWaveNode) => {
    let elNode = document.createElement("li");
    elNode.setAttribute("id", `node${node.id}`);
    elNode.className = "mdc-list-item";

    let elNodeInfo = document.createElement("p");
    elNode.id = `node${node.id} info`;

    let textNodeInfo = document.createTextNode(JSON.stringify(node));
    elNodeInfo.appendChild(textNodeInfo);
    elNode.appendChild(elNodeInfo);
    if (elNodeList) {
        elNodeList.appendChild(elNode);
        console.log("appended node: " + elNode.innerHTML);
    }
});

client.on("node updated", (node: ZWaveNode) => {
    console.log("updating node");
    let elNodeInfo = document.getElementById(`node${node.id} info`);
    if (elNodeInfo) {
        elNodeInfo.textContent = JSON.stringify(node);
        console.log("updated node " + node.id);
    }
    
});
