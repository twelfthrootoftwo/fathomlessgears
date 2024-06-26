export const ACTOR_TYPES = {
	fisher: "fisher",
	fish: "fish",
};

export const ATTRIBUTES = {
	close: "close",
	far: "far",
	mental: "mental",
	power: "power",
	evasion: "evasion",
	willpower: "willpower",
	speed: "speed",
	sensors: "sensors",
	weight: "weight",
	baseAP: "baseAP",
	ballast: "ballast",
};

export const RESOURCES = {
	repair: "repair",
	marbles: "marbles",
	core: "core",
	backlash: "backlash",
};

export const FISH_TYPE = {
	aquatic: "aquatic",
	amphibian: "amphibian",
	abyssal: "abyssal",
	pirate: "pirate",
	forgotten: "forgotten",
};

export const GRID_TYPE = {
	fisher: "fisher",
	small: "small",
	medium: "medium",
	large: "large",
	massive: "massive",
	leviathan: "leviathan",
	serpent: "serpent",
};

export const HIT_TYPE = {
	miss: "miss",
	hit: "hit",
	crit: "crit",
};

export const FILE_CONTENTS = {
	tags_and_conds: "tags_and_conds",
	fish: "fish",
	item_data: "item_data",
	frame_data: "frame_data",
};

export const ITEM_TYPES = {
	tag: "tag",
	internal_pc: "internal_pc",
	internal_npc: "internal_npc",
	frame_pc: "frame_pc",
	size: "size",
	grid: "grid",
}

export const COVER_STATES = {
	none: "none",
	soft: "soft",
	hard: "hard",
}

export const ROLL_MODIFIER_TYPE = {
	flat: "flat",
	die: "die",
	modifier: "modifier",
	bonus: "bonus"
}

export const ATTRIBUTE_MIN=0;
export const ATTRIBUTE_MAX_ROLLED=9;
export const ATTRIBUTE_MAX_FLAT=16;

export const ATTRIBUTE_KEY_MAP = {
	[ATTRIBUTES.close]: "close",
	[ATTRIBUTES.far]: "far",
	[ATTRIBUTES.mental]: "mental",
	[ATTRIBUTES.power]: "power",
	[ATTRIBUTES.evasion]: "evasion",
	[ATTRIBUTES.willpower]: "willpower",
	[ATTRIBUTES.speed]: "speed",
	[ATTRIBUTES.sensors]: "sensors",
	[ATTRIBUTES.weight]: "weight",
	[ATTRIBUTES.baseAP]: "ap",
	[ATTRIBUTES.ballast]: "ballast",
}