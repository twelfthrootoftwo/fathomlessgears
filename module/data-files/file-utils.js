import { FILE_CONTENTS, CONTENT_TYPES } from "../constants.js";
import { Utils } from "../utilities/utils.js";


export class FileRecord {
	filename
	version

	constructor(filename, version) {
		this.filename=filename;
		this.version=version;
	}
}

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
            return retrieveOrCreateCompendium("tag");
        case CONTENT_TYPES.internal_pc:
            return retrieveOrCreateCompendium("internal_pc");
        case CONTENT_TYPES.internal_npc:
            return retrieveOrCreateCompendium("internal_npc");
        case CONTENT_TYPES.frame_pc:
            return retrieveOrCreateCompendium("frame_pc");
        case CONTENT_TYPES.size:
            return retrieveOrCreateCompendium("size");
    };
    return null;
}

async function retrieveOrCreateCompendium(compendiumName) {
    let targetCompendium=game.packs.find(p => p.metadata.name === compendiumName);
    if(!targetCompendium) {
        targetCompendium=await CompendiumCollection.createCompendium({
			"name": compendiumName,
			"label": Utils.getLocalisedItemType(compendiumName),
			"system": "hooklineandmecha",
			"path": ["packs/",compendiumName].join(),
			"type": "Item"
		})
    }
    return targetCompendium;
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

/**
 * Checks whether an item comes from a source file
 * @param {Item} item The item to check
 * @param {FileRecord} fileId The source file
 * @returns True if the item is from the source file, False otherwise
 */
export function isItemFromFileSource(item,fileId) {
	return item.system.source.filename === fileId.filename && item.system.source.version === fileId.version;
}