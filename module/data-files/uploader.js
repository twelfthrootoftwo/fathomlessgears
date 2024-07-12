import { Utils } from "../utilities/utils.js";

export class FileUploader extends Application {
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
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/uploader.html",
			title: "File Upload",
			width: 400,
			height: 100,
		});
	}

    activateListeners(html) {
		super.activateListeners(html);
		Utils.activateButtons(html);
		let fileInput = document.getElementById("fsh-file-select");
		if (fileInput) {
			fileInput.onchange = (ev) => {
				this._selectFile(ev);
			};
		}
		document.getElementsByClassName("file-upload-button")[0]?.addEventListener("click", () => {
		  	this._onUploadButtonClick().then();
		});
	}

    /**
	 * Detect a selected file
	 */
	_selectFile(ev) {
		let file = ev.target.files[0];
		if (!file) return;
		this.newFile=file;
	}

	/**
	 * Load the binary and activate the upload button
	 */
	async _onUploadButtonClick() {
		//need to read the file as binary since Foundry's uploaders don't like the .fsh extension
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFile);
		fr.addEventListener("load", (ev) => {
			this.manager._onFileLoaded(ev.target.result,this.newFile.name, this.targetFile).then();
            this.close();
		  });
	}
}