import {testFieldsExist} from "../items/import-validator.js";
import {Utils} from "../utilities/utils.js";
import {constructGrid} from "../grid/grid-base.js";
import {
	ACTOR_TYPES,
	ATTRIBUTES,
	CUSTOM_BACKGROUND_PART,
	DEEPWORD_NAME_MAP,
	GRID_SPACE_STATE
} from "../constants.js";

/**
 * Build an actor based on a Gearwright save (including interactive grid)
 * @param {HLMActor} actor The actor to populate
 * @param {Object} data JSON import of Gearwright save
 */
export async function populateActorFromGearwright(actor, data) {
	if (!testFieldsExist(data, actor.type)) {
		ui.notifications.error("Invalid Gearwright save data");
		return false;
	}
	console.log("Importing actor from gearwright");
	document
		.querySelector(`#HLMActorSheet-Actor-${actor._id}`)
		?.classList.add("waiting");
	await actor.itemsManager.removeItems();
	switch (actor.type) {
		case ACTOR_TYPES.fisher:
			await buildFisher(actor, data);
			break;
		case ACTOR_TYPES.fish:
			await buildFish(actor, data);
			break;
	}
	await actor.setFlag("fathomlessgears", "initialised", true);
	document
		.querySelector(`#HLMActorSheet-Actor-${actor._id}`)
		?.classList.remove("waiting");
}

async function buildFisher(actor, data) {
	const gridObject = await constructGrid(actor);
	await constructFisherData(data, actor);
	await applyFrame(data, actor, gridObject);
	await applyBackground(data, actor);
	await applyAdditionalFisher(data, actor);
	await applyInternals(data, actor, gridObject);
	if (actor.getFlag("fathomlessgears", "interactiveGrid")) {
		mapGridState(actor.grid, gridObject);
	}
	await actor.assignInteractiveGrid(gridObject);
}

async function buildFish(actor, data) {
	if (data.name) {
		actor.update({name: data.name, "prototypeToken.name": data.name});
	}
	if (data.template)
		actor.update({
			"system.template": Utils.capitaliseWords(
				Utils.fromLowerHyphen(data.template)
			)
		});
	await applySize(data, actor);
	await applyTemplate(data, actor);
	const gridObject = await constructGrid(actor);
	await applyInternals(data, actor, gridObject);
	gridObject.setAllToIntact();
	await actor.assignInteractiveGrid(gridObject);
}

/**
 * Applies base system data to actor (callsign, el, background)
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 */
async function constructFisherData(importData, actor) {
	const actorData = foundry.utils.deepClone(actor.system);
	actorData.fisher_history.callsign = importData.callsign;
	actorData.fisher_history.el = parseInt(importData.level);
	actorData.fisher_history.background = Utils.capitaliseWords(
		importData.background
	);
	await actor.update({system: actorData});
}

/**
 * Applies frame to actor
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 * @param {Grid} gridObject The new grid which will be assigned to the actor later
 */
async function applyFrame(importData, actor, gridObject) {
	const frame = await Utils.findCompendiumItemFromName(
		"frame_pc",
		importData.frame
	);
	if (frame) {
		await actor.itemsManager.applyFrame(frame);
		const unlocks = [];
		unlocks.push(...importData.unlocks);
		unlocks.push(...frame.system.default_unlocks);
		gridObject.applyUnlocks(unlocks);
	}
}

async function applySize(importData, actor) {
	const size = await Utils.findCompendiumItemFromName(
		"size",
		importData.size
	);
	if (size) {
		await actor.itemsManager.applySize(size);
	}
}

/**
 * Applies internals data to actor, including the actor's interactive grid
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 * @param {Grid} gridObject The new grid which will be assigned to the actor later
 */
async function applyInternals(importData, actor, gridObject) {
	const internalsList = importData.internals;
	const targetCompendium =
		actor.type == ACTOR_TYPES.fisher ? "internal_pc" : "internal_npc";
	for (const [gridSpace, internalName] of Object.entries(internalsList)) {
		const internal = await Utils.findCompendiumItemFromName(
			targetCompendium,
			Utils.capitaliseWords(Utils.fromLowerHyphen(internalName))
		);
		if (internal) {
			const internalId = await actor.itemsManager.applyInternal(internal);
			const spaces = identifyInternalSpaces(
				internal,
				gridObject,
				gridSpace
			);
			spaces.forEach((id) => {
				const space = gridObject.findGridSpace(id);
				space.setInternal(
					internalId,
					`${internal.system.type}Internal`
				);
			});
		}
	}
}

async function applyTemplate(importData, actor) {
	const template = {attributes: {}};
	const templateName = Utils.capitaliseWords(
		Utils.fromLowerHyphen(importData.template)
	);

	importData.mutations.forEach((item) => {
		if (item == ATTRIBUTES.ballast) {
			template.attributes.ballast =
				(template.attributes.ballast || 0) - 1;
		} else if (item == ATTRIBUTES.sensors) {
			template.attributes[item] = template.attributes[item] + 3 || 3;
		} else {
			template.attributes[item] = template.attributes[item] + 1 || 1;
		}
	});

	await actor.itemsManager.applyTemplateSystem(template, templateName);
}

async function applyBackground(importData, actor) {
	const backgroundName = importData.background;
	const backgroundBase = await Utils.findCompendiumItemFromName(
		"background",
		Utils.capitaliseWords(Utils.fromLowerHyphen(backgroundName))
	);
	const background = foundry.utils.deepClone(backgroundBase.system);

	if (backgroundName == "custom") {
		importData.custom_background.forEach((item) => {
			switch (item) {
				case CUSTOM_BACKGROUND_PART.willpower:
					background.attributes.willpower =
						background.attributes.willpower + 1;
					break;
				case CUSTOM_BACKGROUND_PART.mental:
					background.attributes.mental =
						background.attributes.mental + 1;
					break;
				case CUSTOM_BACKGROUND_PART.marbles:
					background.marbles = background.marbles + 1;
					break;
				default:
					break;
			}
		});
	}
	await actor.itemsManager.applyBackgroundSystem(background);
}

async function applyAdditionalFisher(importData, actor) {
	const developments = importData.developments;
	let targetCompendium = "development";
	for (const developmentName of developments) {
		const development = await Utils.findCompendiumItemFromName(
			targetCompendium,
			Utils.capitaliseWords(Utils.fromLowerHyphen(developmentName))
		);
		await actor.itemsManager.applyDevelopment(development);
	}

	const maneuvers = importData.maneuvers;
	targetCompendium = "maneuver";
	for (const maneuverName of maneuvers) {
		const maneuver = await Utils.findCompendiumItemFromName(
			targetCompendium,
			Utils.capitaliseWords(Utils.fromLowerHyphen(maneuverName))
		);
		await actor.itemsManager.applyManeuver(maneuver);
	}

	const words = importData.deep_words;
	targetCompendium = "deep_word";
	for (const wordName of words) {
		const word = await Utils.findCompendiumItemFromName(
			targetCompendium,
			DEEPWORD_NAME_MAP[wordName]
		);
		await actor.itemsManager.applyDeepWord(word);
	}
}

/**
 * Copies broken grid spaces from one grid to another
 * @param {Grid} source The grid to copy from
 * @param {Grid} destination The grid to copy to
 */
function mapGridState(source, destination) {
	source.gridRegions.forEach((region) => {
		if (region) {
			region.gridSpaces.forEach((row) => {
				row.forEach((space) => {
					const newSpace = destination.findGridSpace(space.id);
					if (
						space.state != GRID_SPACE_STATE.locked &&
						newSpace.state != GRID_SPACE_STATE.locked &&
						space.state != newSpace.state
					) {
						newSpace.setState(space.state);
					}
				});
			});
		}
	});
}

/**
 * Finds all grid spaces that a particular internal would occupy
 * @param {HLMInternal} internal The internal to map
 * @param {Grid} grid The grid to place the internal on
 * @param {int} originSpace The space that the internal's [0,0] grid point occupies
 * @returns a list of spaces the internal occupies
 */
function identifyInternalSpaces(internal, grid, originSpace) {
	const internalSpaces = [];
	const region = grid.findGridSpace(originSpace).parentRegion;
	internal.system.grid_coords.forEach((relativeSpace) => {
		internalSpaces.push(
			parseInt(originSpace) +
				relativeSpace.x +
				relativeSpace.y * region.width
		);
	});
	return internalSpaces;
}
