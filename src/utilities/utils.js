import {ATTRIBUTES, RESOURCES, ITEM_TYPES, COMPENDIUMS} from "../constants.js";

export class Utils {
	static getLocalisedAttributeLabel(attrKey) {
		if (this.isAttribute(attrKey)) {
			return game.i18n.localize("ATTRIBUTES." + attrKey);
		} else {
			console.log("Attribute key not recognised: " + attrKey);
		}
	}

	static getLocalisedResourceLabel(resourceKey) {
		const recognisedResources = ["repair", "marbles", "core", "backlash"];
		if (recognisedResources.includes(resourceKey)) {
			return game.i18n.localize("RESOURCES." + resourceKey);
		} else {
			console.log("Resource key not recognised: " + resourceKey);
		}
	}

	static getLocalisedBallastLabel(ballastKey) {
		const recognisedBallast = ["base", "weight", "modifiers", "total"];
		if (recognisedBallast.includes(ballastKey)) {
			return game.i18n.localize("BALLAST." + ballastKey);
		} else {
			console.log("Ballast key not recognised: " + ballastKey);
		}
	}

	static getLocalisedHitType(hitTypeKey) {
		const recognisedHits = ["crit", "hit", "miss"];
		if (recognisedHits.includes(hitTypeKey)) {
			return game.i18n.localize("HIT." + hitTypeKey);
		} else {
			console.log("Hit type not recognised: " + hitTypeKey);
		}
	}

	static getLocalisedHitZone(hitZoneKey) {
		const recognisedZones = [
			"head",
			"leftArm",
			"rightArm",
			"torso",
			"legs",
			"section1",
			"section2",
			"section3",
			"section4",
			"section5"
		];
		if (recognisedZones.includes(hitZoneKey)) {
			return game.i18n.localize("HITZONE." + hitZoneKey);
		} else {
			console.log("Hit zone not recognised: " + hitZoneKey);
		}
	}

	static getLocalisedItemType(itemType) {
		if (this.isItem(itemType)) {
			return game.i18n.localize("ITEMTYPE." + itemType);
		} else {
			console.log("Item type not recognised: " + itemType);
		}
	}

	static isAttribute(attributeKey) {
		let returnVal = false;
		Object.values(ATTRIBUTES).forEach((attribute) => {
			if (attribute == attributeKey) returnVal = true;
		});
		return returnVal;
	}

	static isRollableAttribute(attributeKey) {
		const rollable = [
			ATTRIBUTES.close,
			ATTRIBUTES.far,
			ATTRIBUTES.mental,
			ATTRIBUTES.power
		];
		return rollable.includes(attributeKey);
	}

	static isDefenceAttribute(attributeKey) {
		const def = [ATTRIBUTES.evasion, ATTRIBUTES.willpower];
		return def.includes(attributeKey);
	}

	static isFlatAttribute(attributeKey) {
		const flat = [
			ATTRIBUTES.evasion,
			ATTRIBUTES.willpower,
			ATTRIBUTES.speed,
			ATTRIBUTES.sensors,
			ATTRIBUTES.weight,
			ATTRIBUTES.baseAP
		];
		return flat.includes(attributeKey);
	}

	static isResource(attributeKey) {
		let returnVal = false;
		Object.values(RESOURCES).forEach((attribute) => {
			if (attribute == attributeKey) returnVal = true;
		});
		return returnVal;
	}

	static isAttributeComponent(key) {
		const recognisedComponents = ["base", "internals", "modifier"];
		return recognisedComponents.includes(key);
	}

	static isItem(itemType) {
		return (
			Object.keys(ITEM_TYPES).includes(itemType) ||
			Object.keys(ITEM_TYPES).includes(itemType.replace("_imported", ""))
		);
	}

	static identifyAttackKey(internalType) {
		switch (internalType) {
			case "close":
				return ATTRIBUTES.close;
			case "far":
				return ATTRIBUTES.far;
			case "mental":
				return ATTRIBUTES.mental;
			default:
				console.log("Attack type not recognised: " + internalType);
				return false;
		}
	}

	/**
	 * Capitalise the first letter in the first word
	 * @param {str} str
	 * @returns
	 */
	static capitaliseFirstLetter(str) {
		return str[0].toUpperCase() + str.substring(1);
	}

	/**
	 * Capitalise the first letter in all words
	 * @param {string} str
	 */
	static capitaliseWords(str) {
		const words = str.split(" ");
		for (let i = 0; i < words.length; i++) {
			words[i] = words[i][0].toUpperCase() + words[i].substring(1);
		}
		return words.join(" ");
	}

	static toLowerHyphen(str) {
		return str.replaceAll(" ", "-").replaceAll("_", "-").toLowerCase();
	}

	static fromLowerHyphen(str) {
		return str.replaceAll("_", " ");
	}

	static isNumeric(str) {
		return /^\d+$/.test(str);
	}

	static isNumericChar(c) {
		return /^\d$/.test(c);
	}

	static extractIntFromString(string) {
		const digitRegex = new RegExp("\\d+"); //matches consecutive digits
		const valueString = string.match(digitRegex)[0];
		return parseInt(valueString);
	}

	static insertIntoString(startString, insertString, index) {
		return (
			startString.slice(0, index) +
			insertString +
			startString.slice(index)
		);
	}

	static getRoller(dieCount, flatModifier) {
		const formula = dieCount + "d6" + "+" + flatModifier;
		return new Roll(formula);
	}

	static async getGridFromSize(sizeName) {
		const gridCollection = await game.packs.get(
			"fathomlessgears.grid_type"
		);
		if (!gridCollection.indexed) {
			await gridCollection.getIndex();
		}
		const record = gridCollection.index.filter((p) => p.name == sizeName);
		const grid = await gridCollection.getDocument(record[0]._id);
		return grid;
	}

	static getTokenSizeFromSize(sizeName) {
		switch (sizeName) {
			case "Small":
				return 1;
			case "Medium":
			case "Large":
				return 2;
			case "Massive":
				return 3;
			default:
				return 4;
		}
	}

	static activateButtons(html) {
		html.find(".btn").each(function () {
			this.classList.add("btn-active");
		});
	}

	static isJsonString(str) {
		try {
			JSON.parse(str);
		} catch (_error) {
			return false;
		}
		if (str) return true;
		return false;
	}

	/**
	 * Gets an item from a compendium by name
	 * @param {str} compendiumName The compendium to search
	 * @param {str} itemName The item to retrieve
	 * @returns the HLMItem from the compendium (null if not found)
	 */
	static async findCompendiumItemFromName(compendiumName, itemName) {
		const compendiumAddress = COMPENDIUMS[compendiumName];
		if (!compendiumAddress) {
			console.error(`Invalid compendium request: ${compendiumName}`);
			return;
		}
		const collection = await game.packs.get(compendiumAddress);
		if (!collection) {
			ui.notifications.error(
				`Could not find compendium ${compendiumName} (have you uploaded your .fsh?)`
			);
			return;
		}
		if (!collection.indexed) {
			await collection.getIndex();
		}
		const record = collection.index.filter(
			(p) =>
				Utils.fromLowerHyphen(p.name.toLowerCase()) ==
				Utils.fromLowerHyphen(itemName.toLowerCase())
		);
		if (record.length < 1) {
			let alternateCompendium = await game.packs.get(
				COMPENDIUMS[`${compendiumName}_imported`]
			);
			if (alternateCompendium) {
				return await this.findCompendiumItemFromName(
					`${compendiumName}_imported`,
					itemName
				);
			} else {
				ui.notifications.warn(
					`Could not identify item ${itemName} in collection ${compendiumName}`
				);
				return false;
			}
		}
		const item = await collection.getDocument(record[0]._id);
		return item;
	}

	/**
	 * Test the expected fields exist on an object
	 * @param {Object} data Object to test
	 * @param {Array(str)} fields List of expected fields
	 */
	// static testFieldsExist(data, fields) {
	// 	let valid=true;
	// 	fields.forEach((field) => {
	// 		const record=data[field];
	// 		if(record==undefined) valid=false;
	// 	})
	// 	return valid;
	// }
}
