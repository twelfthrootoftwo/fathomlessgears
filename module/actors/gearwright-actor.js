import {Utils} from "../utilities/utils.js";

function populateActorFromGearwright(actor,data) {
    if(!testActorStructure(data)) throw new Error("Invalid Gearwright save data");
    systemData=constructSystemData(data);
    actor.update({"system": systemData});
}

function testActorStructure(data) {
	const expectedFields=["callsign","frame","internals","background","custom_background","unlocks","level"];
	Object.values(ATTRIBUTES).forEach((attribute) => {
		expectedFields.push(ATTRIBUTE_KEY_MAP[attribute]);
	})
	return Utils.testFieldsExist(data, expectedFields);
}