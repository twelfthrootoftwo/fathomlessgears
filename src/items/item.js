import {ITEM_TYPES, ATTRIBUTES, ATTRIBUTE_KEY_MAP} from "../constants.js";
import {Utils} from "../utilities/utils.js";
import {testFieldsExist} from "./import-validator.js";

/**
 * Records data for a tag on a specific internal (including value if it has one)
 */
class InternalTag {
	name;
	value;

	constructor(name, value) {
		this.name = name;
		this.value = value;
	}
}

/**
 * Records data for an attack (type, damage, range)
 */
class Attack {
	type;
	attribute;
	damage;
	marbles;
	range;

	constructor(type, attribute, damage, marbles, range) {
		this.type = Utils.capitaliseFirstLetter(type);
		this.attribute = attribute;
		this.damage = damage;
		this.marbles = marbles;
		this.range = range;
	}

	convertAttributeToDescriptor(type) {
		switch (type) {
			case "close":
				return "Melee";
			case "far":
				return "Ranged";
			default:
				return Utils.capitaliseFirstLetter(type);
		}
	}
}

class GridPoint {
	x;
	y;

	constructor(coordString) {
		coordString = coordString.replace("[", "");
		coordString = coordString.replace("]", "");
		coordString = coordString.replace(" ", "");
		const coordArray = coordString.split(",");
		this.x = parseInt(coordArray[0]);
		this.y = parseInt(coordArray[1]);
	}
}

/**
 * Extend the base Item to support custom behaviour.
 * @extends {Item}
 */
export class HLMItem extends Item {
	async toggleBroken() {
		if (!this.isInternal()) {
			return null;
		}
		const flag = !(await this.getFlag("fathomlessgears", "broken"));
		await this.setFlag("fathomlessgears", "broken", flag);
		Hooks.callAll("internalToggleBroken", this, flag);
		return flag;
	}

	async isBroken() {
		if (!this.isInternal()) {
			return null;
		}
		const result = await this.getFlag("fathomlessgears", "broken");
		return result;
	}

	isInternal() {
		return [ITEM_TYPES.internal_npc, ITEM_TYPES.internal_pc].includes(
			this.type
		);
	}

	isManeuver() {
		return this.type == ITEM_TYPES.maneuver;
	}

	isEncore() {
		return this.name == "Encore";
	}

	isOptics() {
		let result = false;
		if (this.isInternal()) {
			this.system.tags.forEach((tag) => {
				if (tag.name.toLowerCase() == "optics") {
					result = true;
				}
			});
		}

		return result;
	}

	isSturdy() {
		let result = false;
		if (this.isInternal()) {
			this.system.tags.forEach((tag) => {
				if (tag.name.toLowerCase() == "sturdy") {
					result = true;
				}
			});
		}

		return result;
	}

	postToChat(actor) {
		switch (this.type) {
			case ITEM_TYPES.frame_pc:
				this.postFrameMessage(actor);
				break;
			case ITEM_TYPES.internal_npc:
			case ITEM_TYPES.internal_pc:
				if (this.system.attack) {
					this.internalAttack(actor);
				} else {
					this.postFlatItem(actor);
				}
				break;
			case ITEM_TYPES.development:
			case ITEM_TYPES.maneuver:
			case ITEM_TYPES.deep_word:
				if (this.system.attack) {
					this.internalAttack(actor);
				} else {
					this.postFlatItem(actor);
				}
				break;
			default:
				console.log("No item message for type " + this.type);
		}
	}

	async postFrameMessage(actor) {
		const displayMessage = await renderTemplate(
			"systems/fathomlessgears/templates/messages/frame-ability.html",
			{
				frame_ability_name: this.system.gear_ability_name,
				frame_ability_text: this.system.gear_ability
			}
		);
		game.tagHandler.createChatMessage(displayMessage, actor);
	}

	async internalAttack(actor) {
		let attackKey = "";
		if (this.system.attack?.attribute)
			attackKey = this.system.attack?.attribute;
		else attackKey = Utils.identifyAttackKey(this.system.type);
		game.rollHandler.startRollDialog(actor, attackKey, this._id);
	}

	async postFlatItem(actor) {
		let displayString = await renderTemplate(
			"systems/fathomlessgears/templates/messages/internal.html",
			{
				internal: this,
				major_text: this.getItemDescriptionText(),
				minor_text: false
			}
		);
		let tags = this.getRollableTags();
		if (tags) {
			let tagsCopy = [];
			if (tags.length > 0) {
				tags.forEach((tag) => {
					let newTag = tag.toObject();
					if (tag.system.roll.success === null) {
						const matchingTag = this.system.tags.find(
							(internalTag) =>
								Utils.toLowerHyphen(internalTag.name) ==
								Utils.toLowerHyphen(tag.name)
						);
						newTag.system.roll.success = matchingTag.value;
					}
					newTag.system.roll.name = newTag.name;
					newTag.rollspecs = JSON.stringify(newTag.system.roll);
					tagsCopy.push(newTag);
				});
				let tagButtonHtml = await renderTemplate(
					"systems/fathomlessgears/templates/partials/tag-buttons.html",
					{
						tags: tagsCopy
					}
				);
				displayString = displayString.concat(tagButtonHtml);
			}
		}

		game.tagHandler.createChatMessage(displayString, actor);
	}

	getItemDescriptionText() {
		if (this.isInternal()) {
			return this.getInternalDescriptionText();
		}
		if (this.system.action_text) return this.system.action_text;
		if (this.system.description_text) return this.system.description_text;
	}

	/**
	 * Prepares an informative display string for an internal
	 * @returns a formatted string showing the internal's relevant information
	 */
	getInternalDescriptionText() {
		if (!this.isInternal()) {
			return false;
		}
		let description_text = "";
		Object.keys(this.system.attributes).forEach((key) => {
			if (this.system.attributes[key] != 0 && key != ATTRIBUTES.weight) {
				description_text = description_text.concat(
					this.system.attributes[key].toString(),
					" ",
					Utils.getLocalisedAttributeLabel(key),
					"<br>"
				);
			}
		});
		description_text = description_text.concat(this.system.action_text);
		return description_text;
	}

	getDamageDescription(actor) {
		if (!this.system.attack) {
			return false;
		}
		if (isNaN(this.system.attack.damage)) {
			if (this.system.attack.damage.includes("_BACKLASH_VALUE_")) {
				return this.system.attack.damage.replace(
					"_BACKLASH_VALUE_",
					actor.system.resources.backlash.value.toString()
				);
			}
		}
		return this.system.attack.damage;
	}

	getDamageNumber(actor) {
		if (!this.system.attack) {
			return false;
		}
		if (isNaN(this.system.attack.damage)) {
			if (this.system.attack.damage.includes("_BACKLASH_VALUE_")) {
				return actor.system.resources.backlash.value.toString();
			}
		}
		return this.system.attack.damage;
	}

	getTags() {
		if (!this.system.tags) return false;
		const tags = game.tagHandler.getTags().filter((tag) => {
			this.system.tags.includes((itemTag) => {
				return Utils.toLowerHyphen(itemTag.name) === tag.name;
			});
		});
		return tags;
	}

	getRollableTags() {
		if (!this.system.tags) return false;
		const tags = game.tagHandler.getTags().filter((tag) => {
			return this.system.tags.some((itemTag) => {
				return (
					Utils.toLowerHyphen(itemTag.name) ===
						Utils.toLowerHyphen(tag.name) &&
					Boolean(tag.system.roll)
				);
			});
		});
		return tags;
	}
}

/**
 * Construct item data for the various item types
 * @param {Object} record The base item record (name, type)
 * @param {Object} data The JSON item data
 * @param {FileRecord} source The file source of this item
 */
export function createHLMItemData(record, data, source) {
	const itemData = {
		name: record.name,
		type: record.type,
		system: createHLMItemSystem(record.type, data, source)
	};
	return itemData;
}

export function createHLMItemSystem(itemType, data, source) {
	let system = {};
	switch (itemType) {
		case ITEM_TYPES.size:
			console.log("Constructing size...");
			if (!testFieldsExist(data, "size"))
				throw new Error("Invalid item data");
			system = constructSizeData(data);
			break;
		case ITEM_TYPES.frame_pc:
			console.log("Constructing PC frame...");
			if (!testFieldsExist(data, "frame"))
				throw new Error("Invalid item data");
			system = constructFrameData(data);
			break;
		case ITEM_TYPES.internal_pc:
			console.log("Constructing PC internal...");
			if (!testFieldsExist(data, "internal"))
				throw new Error("Invalid item data");
			system = constructInternalPCData(data);
			break;
		case ITEM_TYPES.internal_npc:
			console.log("Constructing NPC internal...");
			if (!testFieldsExist(data, "internal"))
				throw new Error("Invalid item data");
			system = constructInternalNPCData(data);
			break;
		case ITEM_TYPES.grid:
			console.log("Constructing grid...");
			system = constructGridData(data);
			break;
		case ITEM_TYPES.development:
			console.log("Constructing development...");
			system = constructDevelopmentData(data);
			break;
		case ITEM_TYPES.maneuver:
			console.log("Constructing maneuver...");
			system = constructManeuverData(data);
			break;
		case ITEM_TYPES.deep_word:
			console.log("Constructing deep word...");
			system = constructDeepWordData(data);
			break;
		case ITEM_TYPES.background:
			console.log("Constructing background...");
			system = constructBackgroundData(data);
			break;
	}
	system.source = source;
	return system;
}

/**
 * Builds the system object for a size item
 * @param {Object} data The original json read
 * @returns the system object for creating the new Item
 */
function constructSizeData(data) {
	const system = {
		attributes: {}
	};

	Object.values(ATTRIBUTES).forEach((key) => {
		if (Utils.isAttribute(key) && key != ATTRIBUTES.ballast) {
			system.attributes[key] = data[ATTRIBUTE_KEY_MAP[key]];
		}
	});
	return system;
}

function constructGridData(data) {
	const system = {};
	system.hitLocationRoll = data.hitLocationRoll;
	system.hitRegions = data.hitRegions;
	system.type = data.key;
	return system;
}

/**
 * Build system data for a Frame item from JSON data
 * @param {Object} data The JSON data object
 * @returns the system object for creating the new Item
 */
function constructFrameData(data) {
	const system = {
		attributes: {}
	};
	Object.values(ATTRIBUTES).forEach((key) => {
		if (Utils.isAttribute(key)) {
			system.attributes[key] = data[ATTRIBUTE_KEY_MAP[key]];
		}
	});
	system.core_integrity = data.core_integrity;
	system.repair_kits = data.repair_kits;
	system.weight_cap = data.weight_cap;
	system.gear_ability = data.gear_ability;
	system.gear_ability_name = data.gear_ability_name;
	system.default_unlocks = data.default_unlocks;
	return system;
}

/**
 * Build system data for a Internal (PC) item from JSON data
 * PC internals are identical to NPC internals, just with a few extra fields
 * @param {Object} data The JSON data object
 * @returns the system object for creating the new Item
 */
function constructInternalPCData(data) {
	const system = constructInternalNPCData(data);

	system.repair_kits = data.repair_kits;
	system.section = data.section;

	return system;
}

/**
 * Build system data for a Internal (NPC) item from JSON data
 * @param {Object} data The JSON data object
 * @returns the system object for creating the new Item
 */
function constructInternalNPCData(data) {
	const system = {
		attributes: {},
		action_text: ""
	};
	Object.values(ATTRIBUTES).forEach((key) => {
		if (Utils.isAttribute(key)) {
			system.attributes[key] = data[ATTRIBUTE_KEY_MAP[key]];
		}
	});
	if (data.action_data.action_text)
		system.action_text = system.action_text.concat(
			data.action_data.action_text
		);
	if (data.extra_rules) {
		if (system.action_text.length > 0)
			system.action_text = system.action_text.concat(" ");
		system.action_text = system.action_text.concat(data.extra_rules);
	}

	system.ap_cost = getAPCost(data);
	system.attack = constructAttack(data);
	system.ballast = data.ballast;
	system.tags = separateTags(data.tags);
	system.type = data.type;
	system.grid_coords = unpackGridCoords(data.grid);

	return system;
}

function constructDevelopmentData(data) {
	const system = {
		attributes: {},
		description_text: ""
	};
	Object.values(ATTRIBUTES).forEach((key) => {
		if (Utils.isAttribute(key)) {
			system.attributes[key] = data[ATTRIBUTE_KEY_MAP[key]];
		}
	});
	if (data.lightweight_modifier) {
		system.attributes.weight = -data.lightweight_modifier;
	}
	if (data.repair_kits) {
		system.repair_kits = data.repair_kits;
	}
	system.description_text = data.description;

	return system;
}

function constructManeuverData(data) {
	const system = {
		action_text: data.action_text,
		ap_cost: data.ap_cost
	};
	if (data.range) {
		system.attack = new Attack(
			"mental",
			ATTRIBUTES.mental,
			0,
			0,
			data.range
		);
	}

	return system;
}

function constructDeepWordData(data) {
	const system = {
		ap_cost: data.ap_cost,
		action_text: data.action_text || data.extra_rules
	};
	if (data.range) {
		system.attack = new Attack(
			"mental",
			ATTRIBUTES.mental,
			0,
			0,
			data.range
		);
	}
	if (data.damage) {
		if (data.damage == "Your Current Backlash") {
			system.attack.damage = "Your current backlash (_BACKLASH_VALUE_)";
		}
	}
	system.tags = [new InternalTag("fathomless", data.fathomless)];

	return system;
}

function constructBackgroundData(data) {
	const system = {
		attributes: {},
		marbles: 0
	};
	Object.values(ATTRIBUTES).forEach((key) => {
		if (Utils.isAttribute(key)) {
			system.attributes[key] = data[ATTRIBUTE_KEY_MAP[key]];
		}
	});
	system.marbles = data.marbles;

	return system;
}

/**
 * Extract the AP cost of an internal from its action text
 * @param {Object} data The JSON data read in
 * @returns the integer AP cost of activating the internal (null if there is no cost)
 */
function getAPCost(data) {
	if (data.type === "passive" || Object.keys(data.action_data).length == 0)
		return null;
	if (data.action_data.ap_cost || data.action_data.ap_cost === 0)
		return data.action_data.ap_cost;
	return null;
}

/**
 * Constructs an Attack object for an attacking internal
 * @param {Object} data  The JSON data read in
 * @returns an Attack object with the relevant data (null if it isn't an attacking internal)
 */
function constructAttack(data) {
	const attackTypes = ["close", "far", "mental"];
	if (!attackTypes.includes(data.type)) return null;

	return new Attack(
		data.type,
		data.action_data.attribute,
		data.action_data.damage,
		data.action_data.marble_damage,
		data.action_data.range
	);
}

/**
 * Extracts a single string of tag data into multiple Tag objects
 * @param {Array[string]} tagList The string of tags, separated by comma-spaces ", "
 * @returns an Array of InternalTag objects
 */
function separateTags(tagList) {
	const tags = [];
	tagList.forEach((tagText) => {
		const tagWords = tagText.split(" ");
		let name = "";
		let value = null;
		if (Utils.isNumeric(tagWords[tagWords.length - 1])) {
			name = Utils.capitaliseWords(tagWords.slice(0, -1).join(" "));
			value = parseInt(tagWords[tagWords.length - 1]);
		} else if (Utils.isNumeric(tagWords[tagWords.length - 1][0])) {
			name = Utils.capitaliseWords(tagWords.slice(0, -1).join(" "));
			value = parseInt(tagWords[tagWords.length - 1][0]);
		} else {
			name = Utils.capitaliseWords(tagText);
		}
		tags.push(new InternalTag(name, value));
	});
	return tags;
}

function unpackGridCoords(gridList) {
	const coords = [];
	gridList.forEach((gridString) => {
		const coord = new GridPoint(gridString);
		coords.push(coord);
	});
	return coords;
}
