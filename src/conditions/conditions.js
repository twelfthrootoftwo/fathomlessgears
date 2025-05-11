//import {AttributeElement} from "../actors/items-manager.js";
import {ITEM_TYPES} from "../constants.js";

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
		img: "systems/fathomlessgears/assets/icons/Ballast.png",
		statuses: []
	},
	{
		id: CONDITIONS.blind,
		name: "CONDITIONS.blind",
		img: "systems/fathomlessgears/assets/icons/Blind.png",
		statuses: ["blind"]
	},
	{
		id: CONDITIONS.burdened,
		name: "CONDITIONS.burdened",
		img: "systems/fathomlessgears/assets/icons/Burdened.png",
		statuses: ["burdened"]
	},
	{
		id: CONDITIONS.concealed,
		name: "CONDITIONS.concealed",
		img: "systems/fathomlessgears/assets/icons/Concealed.png",
		statuses: ["concealed"]
	},
	{
		id: CONDITIONS.dazed,
		name: "CONDITIONS.dazed",
		img: "systems/fathomlessgears/assets/icons/Dazed.png",
		statuses: ["dazed"]
	},
	{
		id: CONDITIONS.doomed,
		name: "CONDITIONS.doomed",
		img: "systems/fathomlessgears/assets/icons/Doomed.png",
		statuses: ["doomed"]
	},
	{
		id: CONDITIONS.drained,
		name: "CONDITIONS.drained",
		img: "systems/fathomlessgears/assets/icons/Drained.png",
		statuses: ["drained"]
	},
	{
		id: CONDITIONS.evasive,
		name: "CONDITIONS.evasive",
		img: "systems/fathomlessgears/assets/icons/Evasive.png",
		statuses: ["evasive"]
	},
	{
		id: CONDITIONS.fatigued,
		name: "CONDITIONS.fatigued",
		img: "systems/fathomlessgears/assets/icons/Fatigued.png",
		statuses: ["fatigued"]
	},
	{
		id: CONDITIONS.focused,
		name: "CONDITIONS.focused",
		img: "systems/fathomlessgears/assets/icons/Focused.png",
		statuses: ["focused"]
	},
	{
		id: CONDITIONS.hover,
		name: "CONDITIONS.hover",
		img: "systems/fathomlessgears/assets/icons/Hover.png",
		statuses: ["hover"]
	},
	{
		id: CONDITIONS.ironclad,
		name: "CONDITIONS.ironclad",
		img: "systems/fathomlessgears/assets/icons/Ironclad.png",
		statuses: ["ironclad"]
	},
	{
		id: CONDITIONS.jammed,
		name: "CONDITIONS.jammed",
		img: "systems/fathomlessgears/assets/icons/Jammed.png",
		statuses: ["jammed"]
	},
	{
		id: CONDITIONS.quickened,
		name: "CONDITIONS.quickened",
		img: "systems/fathomlessgears/assets/icons/Quickened.png",
		statuses: ["quickened"]
	},
	{
		id: CONDITIONS.restrained,
		name: "CONDITIONS.restrained",
		img: "systems/fathomlessgears/assets/icons/Restrained.png",
		statuses: ["restrained"]
	},
	{
		id: CONDITIONS.slowed,
		name: "CONDITIONS.slowed",
		img: "systems/fathomlessgears/assets/icons/Snared.png",
		statuses: ["slowed"]
	},
	{
		id: CONDITIONS.stalwart,
		name: "CONDITIONS.stalwart",
		img: "systems/fathomlessgears/assets/icons/Stalwart.png",
		statuses: ["stalwart"]
	},
	{
		id: CONDITIONS.tranq,
		name: "CONDITIONS.tranq",
		img: "systems/fathomlessgears/assets/icons/Tranq.png",
		statuses: ["tranq"]
	},
	{
		id: CONDITIONS.wired,
		name: "CONDITIONS.wired",
		img: "systems/fathomlessgears/assets/icons/Wired.png",
		statuses: ["wired"]
	},
	{
		id: "hook1",
		name: "CONDITIONS.hook1",
		img: "systems/fathomlessgears/assets/icons/Blue Hook.png",
		statuses: ["hook1"]
	},
	{
		id: "hook2",
		name: "CONDITIONS.hook2",
		img: "systems/fathomlessgears/assets/icons/Green Hook.png",
		statuses: ["hook2"]
	},
	{
		id: "hook3",
		name: "CONDITIONS.hook3",
		img: "systems/fathomlessgears/assets/icons/Orange Hook.png",
		statuses: ["hook3"]
	},
	{
		id: "hook4",
		name: "CONDITIONS.hook4",
		img: "systems/fathomlessgears/assets/icons/Pink Hook.png",
		statuses: ["hook4"]
	},
	{
		id: "hook5",
		name: "CONDITIONS.hook5",
		img: "systems/fathomlessgears/assets/icons/Purple Hook.png",
		statuses: ["hook5"]
	},
	{
		id: "hook6",
		name: "CONDITIONS.hook6",
		img: "systems/fathomlessgears/assets/icons/Red Hook.png",
		statuses: ["hook6"]
	},
	{
		id: "hook7",
		name: "CONDITIONS.hook7",
		img: "systems/fathomlessgears/assets/icons/Yellow Hook.png",
		statuses: ["hook7"]
	},
	{
		id: "catchcounter",
		name: "CONDITIONS.catchcounter",
		img: "systems/fathomlessgears/assets/icons/Hooked.png",
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
	activeEffect.setCounterValue(value || 1);
	activeEffect.setCounterVisibility();
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
