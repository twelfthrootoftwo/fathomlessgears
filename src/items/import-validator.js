import {
	ATTRIBUTES,
	ATTRIBUTE_KEY_MAP,
	COMPATIBLE_GEARWRIGHT_MAX,
	COMPATIBLE_GEARWRIGHT_MIN
} from "../constants.js";

const expectedFields = {
	frame: [
		"core_integrity",
		"gear_ability",
		"gear_ability_name",
		"repair_kits",
		"default_unlocks"
	],
	internal: ["action_data", "grid", "name", "tags", "type", "extra_rules"],
	size: ["size"],
	fisher: [
		"callsign",
		"frame",
		"internals",
		"background",
		"custom_background",
		"unlocks",
		"level"
	],
	fish: ["size", "internals", "template", "mutations"],
	development: ["name", "description"],
	maneuver: ["name", "ap_cost", "action_text"],
	deep_word: ["short_name", "fathomless", "ap_cost"],
	background: ["marbles"],
	fish_template: []
};

const expectedAttributes = {
	frame: [],
	internal: [],
	size: [],
	fisher: [],
	fish: [],
	development: [],
	maneuver: [],
	deep_word: [],
	background: [],
	fish_template: []
};
Object.values(ATTRIBUTES).forEach((attribute) => {
	if (![ATTRIBUTES.mental, ATTRIBUTES.willpower].includes(attribute)) {
		expectedFields.frame.push(ATTRIBUTE_KEY_MAP[attribute]);
	} else {
		expectedFields.background.push(ATTRIBUTE_KEY_MAP[attribute]);
	}
	expectedFields.internal.push(ATTRIBUTE_KEY_MAP[attribute]);
	if (attribute != ATTRIBUTES.ballast) {
		expectedFields.size.push(ATTRIBUTE_KEY_MAP[attribute]);
	}
});

export function testFieldsExist(data, validationType) {
	let valid = true;
	expectedFields[validationType].forEach((field) => {
		const record = data[field];
		if (record == undefined) valid = false;
	});
	expectedAttributes[validationType].forEach((field) => {
		const record = data[field];
		if (record == undefined) valid = false;
	});
	return valid;
}

export function compatibleGearwrightVersion(data) {
	if (data.gearwright_version) {
		if (isCompatibleVersion(data.gearwright_version)) {
			return true;
		}
	}
	ui.notifications.error("Incompatible Gearwright version");
	return false;
}

function isCompatibleVersion(versionString) {
	versionString.split(".").forEach((string, index) => {
		let val = parseInt(string);
		if (
			val < COMPATIBLE_GEARWRIGHT_MIN[index] ||
			val > COMPATIBLE_GEARWRIGHT_MAX[index]
		) {
			return false;
		}
	});
	return true;
}
