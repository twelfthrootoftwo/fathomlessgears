import {Utils} from "../utilities/utils.js";

export class FileUploader extends Application {
	targetFile;
	manager;
	newFile;

	constructor(manager, options = null) {
		super();
		this.uploaderOptions = options;
		this.manager = manager;

		if (this.uploaderOptions?.importNameOption) {
			this.uploaderOptions.importNameFlag = true;
		}
		this.render(true);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/uploader.html",
			title: "File Upload",
			width: 400,
			height: 115
		});
	}

	async getData(options) {
		const context = await super.getData(options);
		context.importName = this.uploaderOptions?.importNameOption;
		return context;
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
		document
			.getElementsByClassName("file-upload-button")[0]
			?.addEventListener("click", () => {
				this._onUploadButtonClick().then();
			});
		if (this.uploaderOptions.importNameOption) {
			html.find(".import-name-checkbox").change(async (_evt) => {
				this.uploaderOptions.importNameFlag =
					!this.uploaderOptions.importNameFlag;
			});
		}
	}

	/**
	 * Detect a selected file
	 */
	_selectFile(ev) {
		let file = ev.target.files[0];
		if (!file) return;
		this.newFile = file;
	}

	/**
	 * Load the binary and activate the upload button
	 */
	async _onUploadButtonClick() {
		//need to read the file as binary since Foundry's uploaders don't like the .fsh extension
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFile);
		fr.addEventListener("load", (ev) => {
			this.manager
				.onFileLoaded(
					ev.target.result,
					this.newFile.name,
					this.uploaderOptions
				)
				.then();
			this.close();
		});
	}
}
