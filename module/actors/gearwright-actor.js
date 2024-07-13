import {Utils} from "../utilities/utils.js";

export function populateActorFromGearwright(actor,data) {
    if(!testActorStructure(data)) throw new Error("Invalid Gearwright save data");
    const systemData=constructSystemData(data);
    //actor.update({"system": systemData});
}

function testActorStructure(data) {
	const expectedFields=["callsign","frame","internals","background","custom_background","unlocks","level"];
	return Utils.testFieldsExist(data, expectedFields);
}

function constructSystemData(data) {
	console.log("Importing actor from gearwright");
	console.log(data);
	return null;
}