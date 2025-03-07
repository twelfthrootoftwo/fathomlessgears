//import {AttributeElement} from "../actors/items-manager.js";
import {ITEM_TYPES} from "../constants.js";
import {ActiveEffectCounter} from "../../../../modules/statuscounter/module/api.js";

export const CONDITIONS = {
	blind: "blind",
	burdened: "burdened",
	catchcounter: "catchcounter",
	concealed: "concealed",
	dazed: "dazed",
	doomed: "doomed",
	drained: "drained",
	evasive: "evasive",
	fatigued: "fatigued",
	focused: "focused",
	hover: "hover",
	ironclad: "ironclad",
	jammed: "jammed",
	quickened: "quickened",
	restrained: "restrained",
	slowed: "slowed",
	stalwart: "stalwart",
	tranq: "tranq",
	wired: "wired"
};

export const conditions = [
	{
		id: "ballast",
		name: "CONDITIONS.ballast",
		icon: "systems/fathomlessgears/assets/icons/Ballast.png",
		statuses: []
	},
	{
		id: CONDITIONS.blind,
		name: "CONDITIONS.blind",
		icon: "systems/fathomlessgears/assets/icons/Blind.png",
		statuses: ["blind"]
	},
	{
		id: CONDITIONS.burdened,
		name: "CONDITIONS.burdened",
		icon: "systems/fathomlessgears/assets/icons/Burdened.png",
		statuses: ["burdened"]
	},
	{
		id: CONDITIONS.concealed,
		name: "CONDITIONS.concealed",
		icon: "systems/fathomlessgears/assets/icons/Concealed.png",
		statuses: ["concealed"]
	},
	{
		id: CONDITIONS.dazed,
		name: "CONDITIONS.dazed",
		icon: "systems/fathomlessgears/assets/icons/Dazed.png",
		statuses: ["dazed"]
	},
	{
		id: CONDITIONS.doomed,
		name: "CONDITIONS.doomed",
		icon: "systems/fathomlessgears/assets/icons/Doomed.png",
		statuses: ["doomed"]
	},
	{
		id: CONDITIONS.drained,
		name: "CONDITIONS.drained",
		icon: "systems/fathomlessgears/assets/icons/Drained.png",
		statuses: ["drained"]
	},
	{
		id: CONDITIONS.evasive,
		name: "CONDITIONS.evasive",
		icon: "systems/fathomlessgears/assets/icons/Evasive.png",
		statuses: ["evasive"]
	},
	{
		id: CONDITIONS.fatigued,
		name: "CONDITIONS.fatigued",
		icon: "systems/fathomlessgears/assets/icons/Fatigued.png",
		statuses: ["fatigued"]
	},
	{
		id: CONDITIONS.focused,
		name: "CONDITIONS.focused",
		icon: "systems/fathomlessgears/assets/icons/Focused.png",
		statuses: ["focused"]
	},
	{
		id: CONDITIONS.hover,
		name: "CONDITIONS.hover",
		icon: "systems/fathomlessgears/assets/icons/Hover.png",
		statuses: ["hover"]
	},
	{
		id: CONDITIONS.ironclad,
		name: "CONDITIONS.ironclad",
		icon: "systems/fathomlessgears/assets/icons/Ironclad.png",
		statuses: ["ironclad"]
	},
	{
		id: CONDITIONS.jammed,
		name: "CONDITIONS.jammed",
		icon: "systems/fathomlessgears/assets/icons/Jammed.png",
		statuses: ["jammed"]
	},
	{
		id: CONDITIONS.quickened,
		name: "CONDITIONS.quickened",
		icon: "systems/fathomlessgears/assets/icons/Quickened.png",
		statuses: ["quickened"]
	},
	{
		id: CONDITIONS.restrained,
		name: "CONDITIONS.restrained",
		icon: "systems/fathomlessgears/assets/icons/Restrained.png",
		statuses: ["restrained"]
	},
	{
		id: CONDITIONS.slowed,
		name: "CONDITIONS.slowed",
		icon: "systems/fathomlessgears/assets/icons/Snared.png",
		statuses: ["slowed"]
	},
	{
		id: CONDITIONS.stalwart,
		name: "CONDITIONS.stalwart",
		icon: "systems/fathomlessgears/assets/icons/Stalwart.png",
		statuses: ["stalwart"]
	},
	{
		id: CONDITIONS.tranq,
		name: "CONDITIONS.tranq",
		icon: "systems/fathomlessgears/assets/icons/Tranq.png",
		statuses: ["tranq"]
	},
	{
		id: CONDITIONS.wired,
		name: "CONDITIONS.wired",
		icon: "systems/fathomlessgears/assets/icons/Wired.png",
		statuses: ["wired"]
	},
	{
		id: "hook1",
		name: "CONDITIONS.hook1",
		icon: "systems/fathomlessgears/assets/icons/Blue Hook.png",
		statuses: ["hook1"]
	},
	{
		id: "hook2",
		name: "CONDITIONS.hook2",
		icon: "systems/fathomlessgears/assets/icons/Green Hook.png",
		statuses: ["hook2"]
	},
	{
		id: "hook3",
		name: "CONDITIONS.hook3",
		icon: "systems/fathomlessgears/assets/icons/Orange Hook.png",
		statuses: ["hook3"]
	},
	{
		id: "hook4",
		name: "CONDITIONS.hook4",
		icon: "systems/fathomlessgears/assets/icons/Pink Hook.png",
		statuses: ["hook4"]
	},
	{
		id: "hook5",
		name: "CONDITIONS.hook5",
		icon: "systems/fathomlessgears/assets/icons/Purple Hook.png",
		statuses: ["hook5"]
	},
	{
		id: "hook6",
		name: "CONDITIONS.hook6",
		icon: "systems/fathomlessgears/assets/icons/Red Hook.png",
		statuses: ["hook6"]
	},
	{
		id: "hook7",
		name: "CONDITIONS.hook7",
		icon: "systems/fathomlessgears/assets/icons/Yellow Hook.png",
		statuses: ["hook7"]
	},
	{
		id: "catchcounter",
		name: "CONDITIONS.catchcounter",
		icon: "systems/fathomlessgears/assets/icons/Hooked.png",
		statuses: []
	}
];

export const ATTRIBUTE_ONLY_CONDITIONS = [
	CONDITIONS.burdened,
	CONDITIONS.dazed,
	CONDITIONS.drained,
	CONDITIONS.evasive,
	CONDITIONS.fatigued,
	CONDITIONS.quickened,
	CONDITIONS.restrained,
	CONDITIONS.slowed,
	CONDITIONS.wired
];

export const NUMBERED_CONDITIONS = [
	CONDITIONS.burdened,
	CONDITIONS.dazed,
	CONDITIONS.drained,
	CONDITIONS.evasive,
	CONDITIONS.fatigued,
	CONDITIONS.quickened,
	CONDITIONS.restrained,
	CONDITIONS.slowed,
	CONDITIONS.wired,
	CONDITIONS.catchcounter,
	CONDITIONS.doomed,
	CONDITIONS.ironclad,
	CONDITIONS.tranq,
	"hook1",
	"hook2",
	"hook3",
	"hook4",
	"hook5",
	"hook6",
	"hook7",
	"ballast"
];

export const BALLAST_TOKEN_CONDITIONS = [
	"ballast",
	CONDITIONS.burdened,
	CONDITIONS.quickened
];

export async function quickCreateCounter(activeEffect, value) {
	let effectCounter = foundry.utils.getProperty(
		activeEffect,
		"flags.statuscounter.counter"
	);
	if (!effectCounter) {
		effectCounter = new ActiveEffectCounter(
			value || 1,
			activeEffect.icon,
			activeEffect
		);
	} else if (value) {
		effectCounter.value = value;
	}
	effectCounter.visible = NUMBERED_CONDITIONS.includes(
		activeEffect.statuses.values().next().value
	);
	await activeEffect.setFlag("statuscounter", "counter", effectCounter);
	return effectCounter;
}

/**
 * Searches through all COmpendia attached to this world for all condition items
 * @returns a Set of Condition items
 */
export function discoverConditions() {
	const foundConditions = new Map();
	const itemPacks = game.packs.filter((p) => p.metadata.type === "Item");

	itemPacks.forEach((pack) => {
		pack.getDocuments().then((allItems) => {
			allItems
				.filter((item) => item.type == ITEM_TYPES.condition)
				.forEach((condition) => {
					if (condition.system.effectName)
						foundConditions.set(
							condition.system.effectName,
							condition
						);
				});
		});
	});

	return foundConditions;
}

/**
 * Searches the list of token condition effects for a match to a given condition name
 * @param {string} effectName The name to search for (usually from the condition item's statuses)
 * @returns the effect associated with the condition
 */
export function findConditionEffect(effectName) {
	let targetEffect = null;
	conditions.forEach((effect) => {
		if (effect.id == effectName) {
			targetEffect = effect;
		}
	});
	return targetEffect;
}

export async function findConditionFromStatus(status) {
	return game.availableConditionItems.get(status);
}

export function findEffectByImage(actor, imageString, index = 0) {
	let targetEffect = null;
	for (const effect of actor.appliedEffects) {
		if (effect.img != imageString) continue;
		if (index <= 0) {
			targetEffect = effect;
			break;
		}
		index--;
	}
	return targetEffect;
}
