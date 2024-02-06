import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE} from "./constants.js";

export class Utils {
	static getLocalisedAttributeLabel(attrKey) {
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
		if (recognisedAttributes.includes(attrKey)) {
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
}
