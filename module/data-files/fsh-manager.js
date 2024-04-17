import { identifyDataTypes } from "./file-utils.js";
import { FshUploader } from "./uploader.js";
import { getExtension, getTargetCompendium } from "./file-utils.js";
import {Utils} from "../utilities/utils.js"
import IterableWeakMap from "../../foundry/common/utils/iterable-weak-map.mjs";
import {HLMItem} from "../items/item.js"
import { ConfirmDialog } from "../utilities/confirm-dialog.js";

class FileRecord {
	filename
	version

	constructor(filename, version) {
		this.filename=filename;
		this.version=version;
	}
}

/**
 * Adds the .FSH manager button to the sidebar tab
 * @param {*} app 
 * @param {*} html 
 */
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

/**
 * Class to track the data files currently in use
 */
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

	/**
	 * Adds a file record to the list of files
	 * @param {FileRecord} fileId 
	 * @returns the updated list of files
	 */
	async addRecord(fileId) {
		//TODO: Put these onto an item field
		const fileList=await this.fileDataItem.getFlag("hooklineandmecha","files");
		fileList.push(fileId);
		this.fileDataItem.setFlag("hooklineandmecha","files",fileList);
		return fileList;
	}

	/**
	 * Removes a file record from the list
	 * @param {*} filename 
	 * @param {*} version 
	 * @returns the updated list of files
	 */
	async removeRecord(filename, version) {
		//TODO: Put these onto an item field
		const fileList=await this.fileDataItem.getFlag("hooklineandmecha","files");
		for(let record of fileList){
			if(record.filename===filename && record.verion==version){
				const index=fileList.indexOf(record);
				fileList.splice(index,1);
			}
		}
		this.fileDataItem.setFlag("hooklineandmecha","files",fileList);
		return fileList;
	}

	/**
	 * Gets the file list
	 * @returns the list of file records
	 */
	getFileList() {
		return this.fileDataItem?.getFlag("hooklineandmecha","files");
	}
}

/**
 * Core class for the manager window
 */
class FshManager extends Application {
	dataFiles
	dataFileRecorder
	dialogConfirm

	constructor(...args) {
		super(...args);
		this.dataFileRecorder=new DataFileRecorder();
		const fileList=this.dataFileRecorder.getFileList();
		this.dataFiles=fileList ? fileList : [];
		this.dialogConfirm=false;
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
	 * -----------------------------------------------------
	 * Initial processing of uploaded file
	 * -----------------------------------------------------
	 */

	/**
	 * Detect the upload object type and process accordingly
	 * @param {Event} ev 
	 * @param {string} fileName Name of the uploaded file
	 * @param {FileRecord} oldFile The file record to overwrite, if any (null if this is a new file)
	 */
	async _onFshLoaded(ev,fileName,oldFile) {
		const fileRecord=await constructFileRecord(ev, fileName);
		this.checkFileRecordExists(fileRecord,ev,oldFile);
	}

	/**
	 * Checks if a file record matches any existing records, and triggers a dialog if it does
	 * @param {FileRecord} fileId The record for the new file
	 * @param {Blob} newFile The file itself
	 * @param {FileRecord} oldFile The record for the file to update, if any (this is passed to the outputs of this function)
	 */
	checkFileRecordExists(fileId, newFile,oldFile) {
		let duplicateFound=false;
		for(let record of this.dataFiles){
			if(record.filename===fileId.filename && record.version===fileId.version) {
				const dialog=new ConfirmDialog(
					"Overwriting datafile",
					"There is already a datafile record with this name and version. Overwrite?",
					this.confirmOverwriteCallback,
					{"fileId": fileId, "newFile": newFile, "oldFile": oldFile, "fshManager": this}
				);
				duplicateFound=true;
			}
		}
		if(!duplicateFound){
			this.readFile(fileId,newFile,oldFile)
		}
	}

	/**
	 * Callback from the confirm overwrite dialog
	 * @param {Boolean} proceed Overwrite only if true
	 * @param {Object} args {fileId: FileRecord, newFile: Blob, oldFile: FileRecord, fshManager: FshManager}
	 */
	async confirmOverwriteCallback(proceed,args) {
		if(proceed) {
			await deleteFileRecord(args.fileId);
			let index=0;
			for(let record of args.fshManager.dataFiles){
				if(record.filename===args.fileId.filename && record.version===args.fileId.version) {
					args.fshManager.dataFiles.splice(index);
					break;
				}
				index+=1;
			}
			args.fshManager.readFile(args.fileId, args.newFile, args.oldFile);
		}
	}

	/**
	 * Processes the file (based on its extension)
	 * @param {FileRecord} fileId The record for the file to process
	 * @param {Blob} newFile The new file
	 * @param {FileRecord} oldFile The file to update, if any (null if this is not an update)
	 */
	async readFile(fileId, newFile, oldFile) {
		switch(getExtension(fileId.filename)) {
			case "fsh": {
				await processFsh(newFile, fileId, oldFile);
				break;
			}
			case "json": {
				await processJson(newFile, fileId, oldFile);
				break;
			}
		}
		this.addDataSource(fileId);
	}

	/**
	 * Add a new data file to the data file list
	 * @param {FileRecord} fileRecord The file record to add
	 */
	addDataSource(fileRecord) {
		this.dataFileRecorder.addRecord(fileRecord);
		this.render(false);
	}
}

	/**
	 * -----------------------------------------------------
	 * Type-specific processing
	 * -----------------------------------------------------
	 */

/**
 * Extracts a .fsh file (zipped jsons) into its component files
 * @param {Blob} rawFsh Raw .fsh file data
 * @param {FileRecord} fileId The file record
 * @param {FileRecord} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function processFsh(rawFsh, fileId, oldFile) {
	//renamed .zip
	const zip=new JSZip();
	await zip.loadAsync(rawFsh).then(function (zip) {
		readZippedFileCollection(fileId,zip.files,oldFile);
	})
}

/**
 * Prepare a json upload for processing
 * @param {string} rawJson The read-in json file
 * @param {FileRecord} fileId The file record
 * @param {FileRecord} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function processJson(rawJson, fileId, oldFile) {
	await readDataJson(rawJson, fileId.filename, fileId, oldFile);
}

/**
 * Parse extracted json and save its contents
 * @param {string} fileData JSON file contents
 * @param {string} fileName Name of this file (json or unzipped inner file)
 * @param {Object} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function readDataJson(fileData, fileName, fileId, oldFile) {
	const preparedData=JSON.parse(fileData);
	const dataTypes=identifyDataTypes(fileData,fileName);
	await saveToCompendium(preparedData,dataTypes, fileId, oldFile);
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

/**
 * Process a zip file (.fsh)
 * @param {FileRecord} fileId The record for the file to process
 * @param {Blob} newFile The new file
 * @param {FileRecord} oldFile The file to update, if any (null if this is not an update)
 */
async function readZippedFileCollection(fileId, zippedFiles, oldFile) {
	for(let zFileName of Object.keys(zippedFiles)) {
		zippedFiles[zFileName].async('string').then(function (fileData) {
			return readDataJson(fileData, zFileName, fileId, oldFile);
		}).then(function (promise) {
			//await;
		})
	}
}

	/**
	 * -----------------------------------------------------
	 * Write items from extracted json data
	 * -----------------------------------------------------
	 */

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

/**
 * Create an item
 * @param {string} itemName The item's name
 * @param {Object} itemData The record for the item
 * @param {CONTENT_TYPES} itemType The item type
 * @param {FileRecord} sourceId The record of the source file
 * @param {CompendiumCollection} compendium The collection to put the item itno
 * @returns the newly constructed Item
 */
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

	/**
	 * -----------------------------------------------------
	 * Create file records
	 * -----------------------------------------------------
	 */

/**
 * Constructs a file record for a file
 * @param {Blob} file The file to record
 * @param {string} fileName The name of the file
 * @returns a FileRecord
 */
async function constructFileRecord(file,fileName){
	let versionNumber="";
	switch(getExtension(fileName)) {
		case "fsh": {
			versionNumber=await getFshVersion(file);
			break;
		}
		case "json": {
			versionNumber=await getJsonVersion(file);
			break;
		}
	}
	return new FileRecord(fileName, versionNumber)
}

//TODO: Extract version numbers when available
function getFshVersion(files) {
	return "0.0.0";
}
function getJsonVersion(rawJson) {
	return "0.0.0";
}

	/**
	 * -----------------------------------------------------
	 * Manage existing file records & items
	 * -----------------------------------------------------
	 */

/**
 * Checks whether an item comes from a source file
 * @param {Item} item The item to check
 * @param {FileRecord} fileId The source file
 * @returns True if the item is from the source file, False otherwise
 */
async function isItemFromFileSource(item,fileId) {
	itemSource = await item.getFlag("hooklineandmecha","source");
	return itemSource.filename === fileId.filename && itemSource.version === fileId.version;
}

/**
 * Deletes all compendium items from a given source file
 * @param {FileRecord} fileId The file record to remove
 */
async function deleteFileRecord(fileId) {
	for(compendium in game.packs) {
		await removeItemsFromFileSource(compendium,fileId);
	}
}

/**
 * Removes all items from a compendium from a specific source
 * @param {CompendiumCollection} compendium The compendium to process
 * @param {FileRecord} fileId The source file to clear
 */
async function removeItemsFromFileSource(compendium, fileId) {
	existingItems = await compendium.filter((item) => isItemFromFileSource(item,fileId));
	existingItems.forEach(item => {
		compendium.delete(item.id);
	})
}