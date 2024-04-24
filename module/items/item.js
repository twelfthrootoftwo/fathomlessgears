import { ITEM_TYPES } from "../constants.js";
import { Utils } from "../utilities/utils.js";

/**
 * Extend the base Item to support custom behaviour.
 * @extends {Item}
 */
export class HLMItem extends Item {

}

/**
	 * Construct item data for the various item types
	 * @param {Object} record The base item record (name, type)
	 * @param {Object} data The JSON item data
	 * @param {FileRecord} source The file source of this item
	 */
export function createHLMItemData(record, data, source) {
	let system={};
	switch(record.type) {
		case ITEM_TYPES.tag:
			console.log("Tags not implemented yet");
			break;
		case ITEM_TYPES.size:
			console.log("Constructing size...");
			system=constructSizeData(data);
			break;
		case ITEM_TYPES.frame_pc:
			console.log("Constructing PC frame...");
			//system=constructFrameData(data);
			break;
		case ITEM_TYPES.internal_pc:
			console.log("Constructing PC internal...");
			//system=constructInternalPCData(data);
			break;
		case ITEM_TYPES.internal_npc:
			console.log("NPC internals not implemented yet");
			break;
	}
	system.source=source
	const itemData={
		"name": record.name,
		"type": record.type,
		"system": system
	};
	return itemData;
}

/**
 * Builds the system object for a size item
 * @param {Object} data The original json read
 * @returns the formatted system object
 */
function constructSizeData(data) {
	const system={
		attributes: {}
	};
	Object.keys(data).forEach((key) => {
		if (Utils.isAttribute(key)){
			system.attributes[key]=data[key];
		} else {
			system[key]=data[key]
		}
	});
	return system
}
