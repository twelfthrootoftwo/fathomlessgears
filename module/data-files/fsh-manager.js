import { identifyDataTypes } from "./file-management.js";
import { getExtension, getTargetCompendium } from "./file-utils.js";


export function addFshManager(app, html) {
	const compendium=html.siblings().filter(`.compendium-sidebar`);
	const presetManager=$(compendium).find(`.fsh-content-manager`);
	if(presetManager.length==0) {
		const buttons=$(compendium).find(`.header-actions`);
		let button = document.createElement("button");
		button.setAttribute("style", "flex-basis: 100%; margin-top: 5px;");
		button.innerHTML = "<i class='fsh-content-manager i--s'></i> FSH Manager";
		button.addEventListener("click", () => {
			new FshManager()
		});
		buttons.after(button);
	}
}

class FshManager extends Application {
	datafiles=[]

	constructor(...args) {
		super(...args);
		(async() => {
			//TODO Create a datafile list to allow for source management
			// console.log("Getting file list")
			// const storageDir="systems/hooklineandmecha/storage/";
			// const files=await FilePicker.browse("data",storageDir,{extensions: [".json"]})
			// files.files.forEach((file) => {
			// 	const filename=file.slice(file.lastIndexOf("/")+1,file.lastIndexOf("."));
			// 	this.datafiles.push(filename);
			// })
			// console.log(`Files: ${this.datafiles}`)
			this.render(true)
		}) ();
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha"],
			template: "systems/hooklineandmecha/templates/fsh-manager.html",
			title: ".FSH Manager",
			width: 400,
			height: 400,
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
		
		//TODO Reactivate this in the case there's a preeisting data source
		//html.find(".remove").click(this.removeDataFile.bind(this));
		
	}

	_selectFsh(ev) {
		let fsh = ev.target.files[0];
		if (!fsh) return;
		this.newFsh=fsh;
	}

	async _onUploadButtonClick() {
		//need to read the file as binary since Foundry's uploaders don't like the .fsh extension
		const fr = new FileReader();
		fr.readAsBinaryString(this.newFsh);
		fr.addEventListener("load", (ev) => {
			this._onFshLoaded(ev.target.result,this.newFsh.name).then();
		  });
	}

	async _onFshLoaded(ev,fileName) {
		switch(getExtension(fileName)) {
			case "fsh": {
				this.processFsh(ev);
			}
		}
	}

	

	/**
	 * 
	 * @param {Blob} rawFsh Raw .fsh file data
	 */
	processFsh(rawFsh) {
		//renamed .zip
		const zip=new JSZip();
		zip.loadAsync(rawFsh).then(function (zip) {
			for(let fileName of Object.keys(zip.files)) {
				zip.files[fileName].async('string').then(function (fileData) {
					const preparedData=JSON.parse(fileData);
					console.log(preparedData);
					const dataTypes=identifyDataTypes(fileData,fileName);
					return saveToCompendium(preparedData,dataTypes);
				}).then(function (promise) {
					//await;
				})
			}
		})
	}
}

/**
 * Create items from an assembled JSON data file, then write them to the appropriate compendium
 * @param {Object} preparedData The JSON file of items to write
 * @param {CONTENT_TYPES[]} dataTypes List of content types in this datafile
 */
async function saveToCompendium(preparedData, dataTypes) {
	for(let type of dataTypes) {
		const targetCompendium = getTargetCompendium(type);
		await targetCompendium.configure({locked: false});
		for(let item of Object.keys(preparedData)) {
			const itemData=preparedData[item];
			itemData.name=item;
			itemData.type=type;
			await Item.create(itemData, {temporary: true}).then(function (item) {
				return targetCompendium.importDocument(item);
			}).then(function (promise) {
				console.log(`Importing Item ${item.name} into Compendium pack ${targetCompendium.collection}`);
			})
		}
		await targetCompendium.configure({locked: true});
	}
}