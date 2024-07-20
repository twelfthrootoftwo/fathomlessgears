import { testFieldsExist } from "../items/import-validator.js";
import {Utils} from "../utilities/utils.js";
import { constructGrid } from "../grid/grid-base.js";
import { GRID_SPACE_STATE } from "../constants.js";

/**
 * Build an actor based on a Gearwright save (including interactive grid)
 * @param {HLMActor} actor The actor to populate
 * @param {Object} data JSON import of Gearwright save
 */
export async function populateActorFromGearwright(actor,data) {
    if(!testFieldsExist(data,"actor")) throw new Error("Invalid Gearwright save data");
	console.log("Importing actor from gearwright");
	actor.removeInternals();
	const gridObject=actor.getFlag("fathomlessgears","interactiveGrid") ? actor.grid : await constructGrid(actor);
	await constructSystemData(data,actor);
	await applyFrame(data,actor,gridObject);
	await applyInternals(data,actor,gridObject);
	if(actor.getFlag("fathomlessgears","interactiveGrid")) mapGridState(actor.grid,gridObject);
	actor.assignInteractiveGrid(gridObject);
	console.log(gridObject);
	actor.setFlag("fathomlessgears","initialised",true);
}

/**
 * Applies base system data to actor (callsign, el, background)
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 */
async function constructSystemData(importData,actor) {
	const actorData=foundry.utils.deepClone(actor.system);
	actorData.fisher_history.callsign=importData.callsign;
	actorData.fisher_history.el=parseInt(importData.level);
	actorData.fisher_history.background=Utils.capitaliseWords(importData.background);
	await actor.update({"system": actorData});
}

/**
 * Applies frame to actor
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 * @param {Grid} gridObject The new grid which will be assigned to the actor later
 */
async function applyFrame(importData,actor,gridObject) {
	const frame=await findCompendiumItemFromName("frame_pc",importData.frame);
	await actor.applyFrame(frame);
	const unlocks=[];
	unlocks.push(...importData.unlocks);
	unlocks.push(...frame.system.default_unlocks);
	gridObject.applyUnlocks(unlocks);
}

/**
 * Applies internals data to actor, including the actor's interactive grid
 * @param {Object} importData Gearwright save
 * @param {HLMActor} actor The actor to populate
 * @param {Grid} gridObject The new grid which will be assigned to the actor later
 */
async function applyInternals(importData,actor,gridObject) {
	const internalsList=importData.internals;
	for(const [gridSpace,internalName] of Object.entries(internalsList)) {
		const internal=await findCompendiumItemFromName("internal_pc",Utils.capitaliseWords(Utils.fromLowerHyphen(internalName)));
		const internalId=await actor.applyInternal(internal);
		const spaces=identifyInternalSpaces(internal,gridObject,gridSpace);
		spaces.forEach((id) => {
			const space=gridObject.findGridSpace(id);
			space.setInternal(internalId,`${internal.system.type}Internal`);
		})
	}
}

/**
 * Gets an item from a compendium by name
 * @param {str} compendiumName The compendium to search
 * @param {str} itemName The item to retrieve
 * @returns the HLMItem from the compendium (null if not found)
 */
async function findCompendiumItemFromName(compendiumName,itemName) {
	let collection=null;
	if(["core_macros","grid_type"].includes(compendiumName)) {
		collection=await game.packs.get(`fathomlessgears.${compendiumName}`);
	} else {
		collection=await game.packs.get(`world.${compendiumName}`);
	}
	if(!collection.indexed) {
		await collection.getIndex();
	}
	const record = collection.index.filter(p => p.name.toLowerCase() == itemName.toLowerCase());
	const item=await collection.getDocument(record[0]._id);
	return item
}

/**
 * Copies broken grid spaces from one grid to another
 * @param {Grid} source The grid to copy from
 * @param {Grid} destination The grid to copy to
 */
function mapGridState(source,destination) {
	source.gridRegions.forEach((region) => {
		if(region) {
			region.gridSpaces.forEach((row) => {
				row.forEach((space) => {
					if(space.state==GRID_SPACE_STATE.broken) {
						const newSpace=destination.findGridSpace(space.id);
						if(newSpace.state==GRID_SPACE_STATE.intact) {
							newSpace.setState(GRID_SPACE_STATE.broken);
						}
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
function identifyInternalSpaces(internal,grid,originSpace) {
	const internalSpaces=[];
	const region=grid.findGridSpace(originSpace).parentRegion;
	internal.system.grid_coords.forEach((relativeSpace) => {
		internalSpaces.push(parseInt(originSpace)+relativeSpace.x+relativeSpace.y*region.width);
	})
	return internalSpaces;
}