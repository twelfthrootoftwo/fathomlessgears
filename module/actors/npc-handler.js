export class FishDataHandler {
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
			this._loadNPCTypes(data);
			this._loadNPCSizes(data);
		} else
			throw new Error(
				"Could not access the archive from server side: " + npcDataFile
			);
	}

	_loadNPCTypes(data) {
		this.knownTypes = data.types;
		for (const key in data.types) {
			this.knownTypes[key].label = game.i18n.localize("FISHTYPE." + key);
		}
	}

	_loadNPCSizes(data) {
		this.knownSizes = data.sizes;
		for (const key in data.sizes) {
			this.knownSizes[key].label = game.i18n.localize("FISHSIZE." + key);
		}
	}
}
