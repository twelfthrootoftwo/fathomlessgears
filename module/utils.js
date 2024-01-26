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
		const recognisedAttributes = ["repair", "marbles", "core", "backlash"];
		if (recognisedAttributes.includes(resourceKey)) {
			return game.i18n.localize("RESOURCES." + resourceKey);
		} else {
			console.log("Resource key not recognised: " + resourceKey);
		}
	}
}
