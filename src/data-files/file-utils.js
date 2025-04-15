import {ITEM_TYPES} from "../constants.js";
import {Utils} from "../utilities/utils.js";

export class FileRecord {
	filename;
	version;

	constructor(filename, version) {
		this.filename = filename;
		this.version = version;
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
	return fileName.replace(`.${getExtension(fileName)}`, "");
}

/**
 * Find the Compendium associated with a specific item type
 * @param {CONTENT_TYPES} dataType Type of compendium to get
 * @returns a Compendium
 */
export function getTargetCompendiumForImport(dataType) {
	switch (dataType) {
		case ITEM_TYPES.tag:
			return retrieveOrCreateCompendium("tag");
		case ITEM_TYPES.internal_pc:
			return retrieveOrCreateCompendium("internal_pc_imported");
		case ITEM_TYPES.internal_npc:
			return retrieveOrCreateCompendium("internal_npc_imported");
		case ITEM_TYPES.frame_pc:
			return retrieveOrCreateCompendium("frame_pc_imported");
		case ITEM_TYPES.size:
			return retrieveOrCreateCompendium("size_imported");
		case ITEM_TYPES.grid:
			return retrieveOrCreateCompendium("grid_type_imported");
		case ITEM_TYPES.development:
			return retrieveOrCreateCompendium("development_imported");
		case ITEM_TYPES.maneuver:
			return retrieveOrCreateCompendium("maneuver_imported");
		case ITEM_TYPES.deep_word:
			return retrieveOrCreateCompendium("deep_word_imported");
		case ITEM_TYPES.background:
			return retrieveOrCreateCompendium("background_imported");
	}
	return null;
}

async function retrieveOrCreateCompendium(compendiumName) {
	let targetCompendium = game.packs.find(
		(p) => p.metadata.name === compendiumName
	);
	if (!targetCompendium) {
		targetCompendium = await CompendiumCollection.createCompendium({
			name: compendiumName,
			label: Utils.getLocalisedItemType(compendiumName),
			system: "fathomlessgears",
			path: ["packs/", compendiumName].join(),
			type: "Item"
		});
	}
	return targetCompendium;
}

const fileNameMapping = {
	frame_data: [ITEM_TYPES.frame_pc],
	item_data: [ITEM_TYPES.internal_pc],
	grids: [ITEM_TYPES.grid],
	npc_item_data: [ITEM_TYPES.internal_npc],
	fish_size_data: [ITEM_TYPES.size],
	fisher_developments: [ITEM_TYPES.development],
	fisher_maneuvers: [ITEM_TYPES.maneuver],
	deep_words: [ITEM_TYPES.deep_word],
	fisher_backgrounds: [ITEM_TYPES.background]
};

/**
 * Looks at a file name to determine what type of info it contains
 * @param {Object} fileData : Parsed .json file
 * @param {str} fileName : Name of file to identify
 */
export function identifyDataTypes(_fileData, fileName) {
	if (fileNameMapping[removeExtension(fileName)]) {
		return fileNameMapping[removeExtension(fileName)];
	}

	let result = null;
	//TODO some default behaviour for unrecognised file names
	return result;
}

/**
 * Checks whether an item comes from a source file
 * @param {Item} item The item to check
 * @param {FileRecord} fileId The source file
 * @returns True if the item is from the source file, False otherwise
 */
export function isItemFromFileSource(item, fileId) {
	return (
		item.system?.source?.filename === fileId.filename &&
		item.system?.source?.version === fileId.version
	);
}
