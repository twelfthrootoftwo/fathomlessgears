import { testFieldsExist } from "../items/import-validator.js";
import {Utils} from "../utilities/utils.js";
import { constructGrid } from "../grid/grid-base.js";
import { GRID_SPACE_STATE } from "../constants.js";

export async function populateActorFromGearwright(actor,data) {
    if(!testFieldsExist(data,"actor")) throw new Error("Invalid Gearwright save data");
	console.log("Importing actor from gearwright");
	actor.resetForImport();
	const gridObject=actor.getFlag("fathomlessgears","interactiveGrid") ? actor.grid : await constructGrid(actor);
	await constructSystemData(data,actor);
	await applyFrame(data,actor,gridObject);
	await applyInternals(data,actor,gridObject);
	if(actor.getFlag("fathomlessgears","interactiveGrid")) mapGridState(actor.grid,gridObject);
	actor.assignInteractiveGrid(gridObject);
	console.log(gridObject);
	actor.setFlag("fathomlessgears","initialised",true);
}

async function constructSystemData(importData,actor) {
	const actorData=foundry.utils.deepClone(actor.system);
	actorData.fisher_history.callsign=importData.callsign;
	actorData.fisher_history.el=parseInt(importData.level);
	actorData.fisher_history.background=Utils.capitaliseWords(importData.background);
	console.log(actorData);
	await actor.update({"system": actorData});
}

async function applyFrame(importData,actor,gridObject) {
	const frame=await findCompendiumItemFromName("frame_pc",importData.frame);
	await actor.applyFrame(frame);
	const unlocks=[];
	unlocks.push(...importData.unlocks);
	unlocks.push(...frame.system.default_unlocks);
	gridObject.applyUnlocks(unlocks);
}

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

function identifyInternalSpaces(internal,grid,originSpace) {
	const internalSpaces=[];
	const region=grid.findGridSpace(originSpace).parentRegion;
	internal.system.grid_coords.forEach((relativeSpace) => {
		internalSpaces.push(parseInt(originSpace)+relativeSpace.x+relativeSpace.y*region.width);
	})
	return internalSpaces;
}