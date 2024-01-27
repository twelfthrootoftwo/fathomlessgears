export class FishDataHandler {
	// static knownTypes = new Map([
	// 	["aquatic", game.i18n.localize("FISHTYPE.aquatic")],
	// 	["amphibian", game.i18n.localize("FISHTYPE.amphibian")],
	// 	["abyssal", game.i18n.localize("FISHTYPE.abyssal")],
	// 	["pirate", game.i18n.localize("FISHTYPE.pirate")],
	// 	["forgotten", game.i18n.localize("FISHTYPE.forgotten")],
	// ]);

	async loadNPCData(npcDataFile) {
		const response = await fetch(npcDataFile);
		const data = await response
			.json()
			.catch((error) =>
				console.error(
					`Failed to read JSON for archive ${npcDataFile}\n${error}`
				)
			);
		if (response.ok) {
			console.log(data);
			this._loadNPCTypes(data);
			this._loadNPCSizes(data);
		} else
			throw new Error(
				"Could not access the archive from server side: " + npcDataFile
			);
	}

	_loadNPCTypes(data) {
		console.log("(Loading types)");
		//pass
	}

	_loadNPCSizes(data) {
		console.log("(Loading sizes)");
		//pass
	}

	getTypeBaseStats() {}
}
