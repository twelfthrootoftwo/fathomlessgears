import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE} from "../constants.js";

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
		const recognisedAttributes = [
			"close",
			"far",
			"mental",
			"power",
			"evade",
			"willpower",
			"speed",
			"sensors",
			"weight",
			"baseAP",
		];
		return recognisedAttributes.includes(attributeKey);
	}

	static isRollableAttribute(attributeKey) {
		const rollable = [
			ATTRIBUTES.close,
			ATTRIBUTES.far,
			ATTRIBUTES.mental,
			ATTRIBUTES.power,
		];
		return rollable.includes(attributeKey);
	}

	static isFlatAttribute(attributeKey) {
		const flat = [
			ATTRIBUTES.evade,
			ATTRIBUTES.willpower,
			ATTRIBUTES.speed,
			ATTRIBUTES.sensors,
			ATTRIBUTES.weight,
			ATTRIBUTES.baseAP,
		];
		return flat.includes(attributeKey);
	}

	static isItem(itemType) {
		const recognisedItems = [
			"tag",
			"size",
			"frame_pc",
			"internal_pc",
			"internal_npc",
		];
		return recognisedItems.includes(itemType);
	}

	/**
	 * Capitalise the first letter in the first word
	 * @param {str} str 
	 * @returns 
	 */
	static capitaliseFirstLetter(str) {
		return str[0].toSupperCase+str.substring(1);
	}

	/**
	 * Capitalise the first letter in all words
	 * @param {string} str 
	 */
	static capitaliseWords(str) {
		const words=str.split(" ")
		for (let i = 0; i < words.length; i++) {
			words[i] = words[i][0].toUpperCase() + words[i].substring(1);
		}
		return words.join(" ");
	}

	static toLowerHyphen(str) {
		return str.replaceAll(" ","-").replaceAll("_","-").toLowerCase();
	}

	static fromLowerHyphen(str) {
		return str.replaceAll("_"," ");
	}

	static isNumeric(str){
		return /^\d+$/.test(str);
	}

	static isNumericChar(c) {
		return /^\d$/.test(c);
	}

	static extractIntFromString(string) {
		const digitRegex=new RegExp("\\d+");//matches consecutive digits
		const valueString=string.match(digitRegex)[0];
		return parseInt(valueString);
	}
}
