export const COMPATIBLE_GEARWRIGHT_MIN = [2, 0, 0];
export const COMPATIBLE_GEARWRIGHT_MAX = [10, 10, 10];

export const ACTOR_TYPES = {
	fisher: "fisher",
	fish: "fish"
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
	ballast: "ballast"
};

export const RESOURCES = {
	repair: "repair",
	marbles: "marbles",
	core: "core",
	backlash: "backlash"
};

export const FISH_TYPE = {
	aquatic: "aquatic",
	amphibian: "amphibian",
	abyssal: "abyssal",
	pirate: "pirate",
	forgotten: "forgotten"
};

export const GRID_TYPE = {
	fisher: "fisher",
	small: "small",
	medium: "medium",
	large: "large",
	massive: "massive",
	leviathan: "leviathan",
	serpent: "serpent",
	siltstalker: "siltstalker"
};

export const HIT_TYPE = {
	miss: "miss",
	hit: "hit",
	crit: "crit"
};

export const FILE_CONTENTS = {
	tags_and_conds: "tags_and_conds",
	fish: "fish",
	item_data: "item_data",
	frame_data: "frame_data"
};

export const ITEM_TYPES = {
	tag: "tag",
	condition: "condition",
	internal_pc: "internal_pc",
	internal_npc: "internal_npc",
	frame_pc: "frame_pc",
	size: "size",
	grid: "grid",
	development: "development",
	maneuver: "maneuver",
	deep_word: "deep_word",
	background: "background",
	fish_template: "fish_template",
	history_event: "history_event"
};

export const COVER_STATES = {
	none: "none",
	soft: "soft",
	hard: "hard"
};

export const ROLL_MODIFIER_TYPE = {
	flat: "flat",
	die: "die",
	modifier: "modifier",
	bonus: "bonus",
	condition: "condition",
	optics: "optics"
};

export const GRID_SPACE_STATE = {
	locked: "locked",
	intact: "intact",
	broken: "broken"
};

export const CUSTOM_BACKGROUND_PART = {
	unlocks: "unlocks",
	weight_cap: "weight_cap",
	willpower: "willpower",
	marbles: "marbles",
	mental: "mental"
};

export const ATTRIBUTE_MIN = 0;
export const ATTRIBUTE_MAX_ROLLED = 9;
export const ATTRIBUTE_MAX_FLAT = 16;

export const BALLAST_MIN = 1;
export const BALLAST_MAX = 10;

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
	[ATTRIBUTES.ballast]: "ballast"
};

export const SECTION_NUMBERING_MAP = {
	fisher: [72, 36, 0, 54, 81],
	small: [0],
	medium: [0],
	large: [0],
	massive: [0],
	leviathan: [0, 36, 18],
	serpent_leviathan: [0, 18, 36, 54, 9],
	siltstalker: [0, 24, 12, 48, 60]
};

export const SECTION_REGION_INDICES = {
	fisher: {
		head: 1,
		left_arm: 3,
		torso: 4,
		right_arm: 5,
		legs: 7
	},
	siltstalker: {
		body: 1,
		left_arm: 3,
		left_legs: 0,
		right_arm: 4,
		right_legs: 2
	},
	serpent: {
		body: 4,
		head: 0,
		neck: 1,
		tail: 7,
		tip: 8
	},
	leviathan: {
		body: 1,
		head: 0,
		tail: 2
	}
};

export const GRID_HUD_LOCATION = {
	bottomLeft: "bottom-left",
	bottomRight: "bottom-right",
	topLeft: "top-left",
	topRight: "top-right"
};

export const DEEPWORD_NAME_MAP = {
	word_one: "Ocean's Calm",
	word_two: "Shore's Resilience",
	word_three: "Current's Pull",
	word_four: "Wave's Flow",
	word_five: "Depth's Iron Grasp",
	word_six: "Tidal Surge",
	word_seven: "Storm's Wrath",
	word_eight: "Abyssal Torpor",
	word_final: "Serenity, A Promise Kept"
};

export const TEMPLATE = {
	common: "Common",
	abberant: "Abberant",
	deepspawn: "Deepspawn",
	elder: "Elder Deepspawn"
};

export const TEMPLATE_WEIGHT = {
	[TEMPLATE.common]: 0,
	[TEMPLATE.abberant]: 5,
	[TEMPLATE.deepspawn]: 10,
	[TEMPLATE.elder]: 20
};

export const COMPENDIUMS = {
	core_macros: "fathomlessgears.core_macros",
	grid_type: "fathomlessgears.grid_type",
	conditions_base: "fathomlessgears.conditions_base",
	touch_of_the_deep: "fathomless-foundry-sensitive.touch_of_the_deep",
	injuries: "fathomless-foundry-sensitive.injuries",
	fg_roll_tables: "fathomless-foundry-sensitive.fg_roll_tables",
	conditions: "fathomless-foundry-sensitive.conditions",
	internal_pc: "world.internal_pc",
	internal_npc: "world.internal_npc",
	frame_pc: "world.frame_pc",
	size: "world.size",
	development: "world.development",
	maneuver: "world.maneuver",
	deep_word: "world.deep_word",
	background: "world.background"
};
