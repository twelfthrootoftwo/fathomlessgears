import { identifyDataTypes } from "./file-utils.js";
import { FshUploader } from "./uploader.js";
import { getExtension, getTargetCompendium } from "./file-utils.js";
import {Utils} from "../utilities/utils.js"
import IterableWeakMap from "../../foundry/common/utils/iterable-weak-map.mjs";
import {HLMItem} from "../items/item.js"


export function addFshManager(app, html) {
	const compendium=html[0].classList?.contains("compendium-sidebar")? html : html.siblings().filter(`.compendium-sidebar`);
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

class DataFileRecorder {
	fileDataItem
	constructor() {
		for(const item of game.items) if (item.name === "datafiles"){
			this.fileDataItem=item;
			return this;
		} 
		//If no datafile item found:
		const self=this;
		Item.create({name: "datafiles", type: "record"}).then(function (item) {
			item.setFlag("hooklineandmecha","files",[]);
			self.fileDataItem=item;
			return self;
		});		
	}

	async addRecord(fileId) {
		//TODO: Put these onto an item field
		const fileList=await this.fileDataItem.getFlag("hooklineandmecha","files");
		fileList.push(fileId);
		this.fileDataItem.setFlag("hooklineandmecha","files",fileList);
		return fileList;
	}

	async removeRecord(filename, version) {
		//TODO: Put these onto an item field
		fileList=await this.fileDataItem.getFlag("hooklineandmecha","files");
		for(let record of fileList){
			if(record.filename===filename && record.verion==version){
				const index=fileList.indexOf(record);
				fileList.splice(index,1);
			}
		}
		this.fileDataItem.setFlag("hooklineandmecha","files",fileList);
		return fileList;
	}

	getFileList() {
		return this.fileDataItem?.getFlag("hooklineandmecha","files");
	}
}

class FshManager extends Application {
	dataFiles
	dataFileRecorder

	constructor(...args) {
		super(...args);
		this.dataFileRecorder=new DataFileRecorder();
		const fileList=this.dataFileRecorder.getFileList();
		this.dataFiles=fileList ? fileList : [];
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

		document.getElementsByClassName("add-new-fsh")[0]?.addEventListener("click", () => {
			new FshUploader(this);
	  	});
		
		// if(this.dataFiles.length>0) {
		// 	html.find(".remove").click(this.removeDataFile.bind(this));
		// }
	}

	/**
	 * Detect the upload object type and process accordingly
	 * @param {Event} ev 
	 * @param {string} fileName Name of the uploaded file
	 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
	 */
	async _onFshLoaded(ev,fileName,oldFile) {
		let versionNumber="0.0.0"
		switch(getExtension(fileName)) {
			case "fsh": {
				versionNumber=await this.processFsh(ev, fileName, oldFile);
				break;
			}
			case "json": {
				versionNumber=await this.processJson(ev, fileName, oldFile);
				break;
			}
		}
		this.addDataSource(fileName,versionNumber);
	}
	

	/**
	 * Extracts a .fsh file (zipped jsons) into its component files
	 * @param {Blob} rawFsh Raw .fsh file data
	 * @param {string} fileName Name of uploaded file
	 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
	 */
	async processFsh(rawFsh, fileName, oldFile) {
		//renamed .zip
		const zip=new JSZip();
		let version="";
		await zip.loadAsync(rawFsh).then(function (zip) {
			version=getFshVersion(zip.files);
			const fileId={filename: fileName, version: version};
			for(let zippedFile of Object.keys(zip.files)) {
				zip.files[zippedFile].async('string').then(function (fileData) {
					return readDataFile(fileData, zippedFile, fileId, oldFile);
				}).then(function (promise) {
					//await;
				})
			}
		})
		return version;
	}

	/**
	 * Prepare a json upload for processing
	 * @param {string} rawJson The read-in json file
	 * @param {string} fileName The name of the uploaded file
	 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
	 * @returns the version number as a string
	 */
	async processJson(rawJson, fileName, oldFile) {
		const version=getJsonVersion(rawJson);
		const fileId={filename: fileName, version: version};
		await readDataFile(rawJson, fileName, fileId, oldFile);
		return version;
	}

	/**
	 * Add a new data file to the data file list
	 * @param {string} fileName The data file's name (files will be tracked by their name)
	 * @param {string} versionNumber The version number of this file
	 */
	addDataSource(fileName, versionNumber) {
		const fileRecord={filename: fileName, version: versionNumber};
		//this.dataFiles.push(fileRecord);
		this.dataFileRecorder.addRecord(fileRecord);
		this.render(false);
	}

}

//TODO: Extract version numbers when available
function getFshVersion(files) {
	return "0.0.0";
}
function getJsonVersion(rawJson) {
	return "0.0.0";
}

/**
 * Parse extracted json and save its contents
 * @param {string} fileData JSON file contents
 * @param {string} fileName Name of this file (json or unzipped inner file)
 * @param {Object} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function readDataFile(fileData, fileName, fileId, oldFile) {
	const preparedData=JSON.parse(fileData);
	const dataTypes=identifyDataTypes(fileData,fileName);
	await saveToCompendium(preparedData,dataTypes, fileId, oldFile);
}

/**
 * Create items from an assembled JSON data file, then write them to the appropriate compendium
 * @param {Object} preparedData The JSON file of items to write
 * @param {CONTENT_TYPES[]} dataTypes List of content types in this datafile
 * @param {Object} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {Object} oldFile For an update, the id of the file to update (null if this is a new file)
 */
async function saveToCompendium(preparedData, dataTypes, fileId, oldFile) {
	for(let type of dataTypes) {
		const relevantData = extractRelevantData(preparedData, type);
		const targetCompendium = await getTargetCompendium(type);
		await targetCompendium.configure({locked: false});
		if(oldFile!=null){
			await updateCompendiumItems(relevantData,targetCompendium,type,oldFile,fileId)
		} else {
			await writeNewCompendiumItems(relevantData,targetCompendium,type, fileId)
		}
		await targetCompendium.configure({locked: true});
	}
}

async function createItem(itemName,itemData,itemType,sourceId, compendium) {
	const name=Utils.capitaliseWords(Utils.fromLowerHyphen(itemName));
	const itemCreationData={
		"name": name,
		"type": itemType,
		"system": {
			"source": sourceId,
			"data": itemData
		}
	}
	const item=await compendium.createDocument(itemCreationData);
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
		const item = await createItem(itemName,relevantData[itemName],itemType,fileId, compendium);
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
			const item = await createItem(itemName,relevantData[itemName],itemType,newFileId, compendium);
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