import { identifyDataTypes } from "./file-utils.js";
import { getExtension, getTargetCompendium } from "./file-utils.js";
import {Utils} from "../utilities/utils.js"
//import {HLMItem} from "../items/item.js"


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
	dataFiles
	dataFileItem

	constructor(...args) {
		super(...args);
		//TODO Create a datafile list to allow for source management
		let dataFileItem = null;
		console.log("Getting file list")
		for(const item of game.items) if (item.name === "datafiles") dataFileItem = item;
		if(!dataFileItem) {
			const self=this;
			Item.create({name: "datafiles", type: "record"}).then(function (item) {
				item.setFlag("hooklineandmecha","files",[]);
				self.dataFiles=[];
				self.dataFileItem=item;
			})
		} else {
			this.dataFiles=dataFileItem.getFlag("hooklineandmecha","files");
		}
		this.dataFileItem=dataFileItem;
		console.log(`Files: ${this.dataFiles}`)
		this.render(true)
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

	async getData(options={}) {
		const context = {}
		context.dataFiles = this.dataFiles;
		return context
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
		
		if(this.dataFiles.length>0) {
			html.find(".remove").click(this.removeDataFile.bind(this));
		}
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
		let versionNumber="0.0.0"
		switch(getExtension(fileName)) {
			case "fsh": {
				versionNumber=this.processFsh(ev);
				break;
			}
			case "json": {
				versionNumber=this.processJson(ev, fileName);
				break;
			}
		}
		this.addDataSource(fileName,versionNumber);
	}

	

	/**
	 * Extracts a .fsh file (zipped jsons) into its component files
	 * @param {Blob} rawFsh Raw .fsh file data
	 */
	processFsh(rawFsh) {
		//renamed .zip
		const zip=new JSZip();
		zip.loadAsync(rawFsh).then(function (zip) {
			for(let fileName of Object.keys(zip.files)) {
				zip.files[fileName].async('string').then(function (fileData) {
					return readDataFile(fileData, fileName);
				}).then(function (promise) {
					//await;
				})
			}
		})
		return "0.0.0";
	}

	processJson(rawJson, fileName) {
		readDataFile(rawJson, fileName);
		return "0.0.0"
	}

	/**
	 * Add a new data file to the data file list
	 * @param {string} fileName The data file's name (files will be tracked by their name)
	 * @param {string} versionNumber The version number of this file
	 */
	addDataSource(fileName, versionNumber) {
		console.log("Adding data file")
		this.dataFiles.push({"filename": fileName, "version": versionNumber});
		this.dataFileItem.setFlag("hooklineandmecha","files",this.dataFiles);
	}

}

async function readDataFile(fileData, fileName, update) {
	const preparedData=JSON.parse(fileData);
	const dataTypes=identifyDataTypes(fileData,fileName);
	await saveToCompendium(preparedData,dataTypes, fileName, update);
}

/**
 * Create items from an assembled JSON data file, then write them to the appropriate compendium
 * @param {Object} preparedData The JSON file of items to write
 * @param {CONTENT_TYPES[]} dataTypes List of content types in this datafile
 * @param {Object} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {boolean} update True: replace existing data where possible; False: don't overwrite
 * @param {Object} oldFileId For an update, the id of the file to update
 */
async function saveToCompendium(preparedData, dataTypes, fileId, update, oldFileId=null) {
	for(let type of dataTypes) {
		const relevantData = extractRelevantData(preparedData, type);
		const targetCompendium = getTargetCompendium(type);
		await targetCompendium.configure({locked: false});
		if(update){
			await updateCompendiumItems(relevantData,targetCompendium,type,oldFileId,fileId)
		} else {
			await writeNewCompendiumItems(relevantData,targetCompendium,type, fileId)
		}
		await targetCompendium.configure({locked: true});
	}
}

async function createItem(itemName,itemData,itemType,sourceId) {
	const name=Utils.capitaliseWords(Utils.fromLowerHyphen(itemName));
	const item = await Item.create({name: name, type: itemType}, {});
	await item.setFlag("hooklineandmecha","data", itemData);
	await item.setFlag("hooklineandmecha","source",sourceId)
	return item
}

/**
 * Create new items in a compendium from a JSON read
 * @param {Object} relevantData JSON extract containing data for a specific content type
 * @param {CompendiumCollection} compendium The compendium for the intended content type
 * @param {Object} fileId The item's source file in the format {filename: "filename", version: "versionString"}
 */
async function writeNewCompendiumItems(relevantData, compendium, itemType, fileId) {
	for(let itemName of Object.keys(relevantData)) {
		const item = await createItem(itemName,relevantData[itemName],itemType,fileId);
		await compendium.importDocument(item);
	}
}

/**
 * Update items in a compendium that come from a specific source
 * @param {Object} relevantData JSON extract containing data for a specific content type
 * @param {CompendiumCollection} compendium The compendium for the intended content type
 * @param {CONTENT_TYPES} itemType The item type to update
 * @param {Object} oldFileId The file record to update, in the format {filename: "filename", version: "versionString"}
 * @param {Object} newFileId The record for the updated file
 */
async function updateCompendiumItems(relevantData,compendium,itemType,oldFileId,newFileId) {
	for(let itemName of Object.keys(relevantData)) {
		if(itemNameExists(itemName, compendium)) {
			await overwriteItem(relevantData[itemName],compendium,oldFileId,newFileId);
		} else {
			const item = await createItem(itemName,relevantData[itemName],itemType,newFileId);
			await compendium.importDocument(item);
		}
	}

	//Delete old items
	removeItemsFromFileSource(compendium, oldFileId);
}

async function removeItemsFromFileSource(compendium, fileId) {
	existingItems = await compendium.filter((item) => isItemFromFileSource(item,fileId));
	existingItems.forEach(item => {
		compendium.delete(item.id);
	})
}

/**
 * Extract a specific data type from a read JSON.
 * Currently all input files contain only a single type, so there's no need to run this
 * @param {Object} preparedData JSON file that has been read in
 * @param {CONTENT_TYPE} type Data type to extract
 */
function extractRelevantData(preparedData,type) {
	return preparedData;
}

async function isItemFromFileSource(item,fileId) {
	itemSource = await item.getFlag("hooklineandmecha","source");
	return itemSource.filename === fileId.filename && itemSource.version === fileId.version;
}