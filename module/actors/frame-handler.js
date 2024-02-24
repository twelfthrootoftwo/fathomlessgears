export class FrameDataHandler {
	async loadFrameData(frameDataFile) {
		const response = await fetch(frameDataFile);
		const data = await response
			.json()
			.catch((error) =>
				console.error(
					`Failed to read JSON for archive ${frameDataFile}\n${error}`
				)
			);
		if (response.ok) {
			this._loadFrames(data);
		} else
			throw new Error(
				"Could not access the archive from server side: " + frameDataFile
			);
	}

    _loadFrames(data) {
        this.frames=data;
        for (const key in data) {
			this.frames[key].label = capitaliseWords(key.replace("_"," "));
		}
    }
}