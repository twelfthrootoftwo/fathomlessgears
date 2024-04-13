export class FshUploader extends Application {
    targetFile
    manager
    newFile

    constructor(manager, targetFile=null) {
        super();
        this.targetFile=targetFile;
        this.manager=manager;
        this.render(true);
    }

    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha"],
			template: "systems/hooklineandmecha/templates/uploader.html",
			title: ".FSH Manager",
			width: 300,
			height: 100,
		});
	}

    activateListeners(html) {
		super.activateListeners(html);
		let fileInput = document.getElementById("fsh-file-select");
		if (fileInput) {
			fileInput.onchange = (ev) => {
				this._selectFsh(ev);
			};
		}
		document.getElementsByClassName("file-upload-button")[0]?.addEventListener("click", () => {
		  	this._onUploadButtonClick().then();
		});
	}

    /**
	 * Detect a selected file
	 */
	_selectFsh(ev) {
		let fsh = ev.target.files[0];
		if (!fsh) return;
		this.newFile=fsh;
	}

	/**
	 * Load the binary and activate the upload button
	 */
	async _onUploadButtonClick() {
		//need to read the file as binary since Foundry's uploaders don't like the .fsh extension
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFile);
		fr.addEventListener("load", (ev) => {
			this.manager._onFshLoaded(ev.target.result,this.newFile.name, this.targetFile).then();
            this.close();
		  });
	}
}