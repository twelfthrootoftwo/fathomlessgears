import { FILE_CONTENTS, CONTENT_TYPES } from "../constants.js";

/**
 * Get the extension of a file
 * @param {str} fileName Filename to extract extension of
 */
export function getExtension(fileName) {
    return fileName.split(".").at(-1);
}

/**
 * Get the filename minus the extension
 * @param {str} fileName Filename to remove extension from
 */
export function removeExtension(fileName) {
    return fileName.replace(`.${getExtension(fileName)}`,"")
}

/**
 * Find the Compendium associated with a specific item type
 * @param {CONTENT_TYPES} dataType Type of compendium to get
 * @returns a Compendium
 */
export function getTargetCompendium(dataType) {
    switch(dataType) {
        case CONTENT_TYPES.tag:
            return game.packs.find(p => p.metadata.name === "tags");
        case CONTENT_TYPES.internal_pc:
            return game.packs.find(p => p.metadata.name === "internal_pc");
        case CONTENT_TYPES.internal_npc:
            return game.packs.find(p => p.metadata.name === "internal_npc");
        case CONTENT_TYPES.frame_pc:
            return game.packs.find(p => p.metadata.name === "frames");
        case CONTENT_TYPES.size:
            return game.packs.find(p => p.metadata.name === "sizes");
    };
    return null;
}

const fileNameMapping = {
	"frame_data": [CONTENT_TYPES.frame_pc],
	"item_data": [CONTENT_TYPES.internal_pc],
    "sizes":[CONTENT_TYPES.size]
}

/**
 * Looks at a file name to determine what type of info it contains
 * @param {Object} fileData : Parsed .json file
 * @param {str} fileName : Name of file to identify
 */
export function identifyDataTypes(fileData,fileName) {
	if(fileNameMapping[removeExtension(fileName)]){
		return fileNameMapping[removeExtension(fileName)];
	}
	
	let result=null
    //TODO some default behaviour for unrecognised file names
    return result;
}