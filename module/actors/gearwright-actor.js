import {Utils} from "../utilities/utils.js";

export async function populateActorFromGearwright(actor,data) {
    if(!testActorStructure(data)) throw new Error("Invalid Gearwright save data");
	console.log("Importing actor from gearwright");
	await constructSystemData(data,actor);
	await applyFrame(data,actor);
	await applyInternals(data,actor);
	actor.setFlag("fathomlessgears","initialised",true);
}

function testActorStructure(data) {
	const expectedFields=["callsign","frame","internals","background","custom_background","unlocks","level"];
	return Utils.testFieldsExist(data, expectedFields);
}

async function constructSystemData(importData,actor) {
	const actorData=foundry.utils.deepClone(actor.system);
	actorData.fisher_history.callsign=importData.callsign;
	actorData.fisher_history.el=parseInt(importData.level);
	actorData.fisher_history.background=Utils.capitaliseWords(importData.background);
	console.log(actorData);
	await actor.update({"system": actorData});
}

async function applyFrame(importData,actor) {
	const frame=await findCompendiumItemFromName("frame_pc",importData.frame);
	await actor.applyFrame(frame);
}

async function applyInternals(importData,actor) {
	const internalsList=importData.internals;
	for(const [gridSpace,internalName] of Object.entries(internalsList)) {
		const internal=await findCompendiumItemFromName("internal_pc",Utils.capitaliseWords(Utils.fromLowerHyphen(internalName)));
		await actor.applyInternal(internal);
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