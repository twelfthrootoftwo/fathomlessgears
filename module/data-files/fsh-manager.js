import { identifyDataTypes } from "./file-utils.js";
import { FileUploader } from "./uploader.js";
import { FileRecord, getExtension, getTargetCompendium, isItemFromFileSource } from "./file-utils.js";
import { Utils } from "../utilities/utils.js";
import { ConfirmDialog } from "../utilities/confirm-dialog.js";
import { HLMApplication } from "../sheets/application.js";
import { createHLMItemData, createHLMItemSystem } from "../items/item.js";


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
			if(!FshManager.isOpen) {
				new FshManager()
			}
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
		const self=this;
		this.fileDataItem=game.settings.get("fathomlessgears","datafiles");
	}

	/**
	 * Adds a file record to the list of files
	 * @param {FileRecord} fileId 
	 * @returns the updated list of files
	 */
	async addRecord(fileId) {
		this.fileDataItem.push(fileId);
		game.settings.set("fathomlessgears","datafiles",this.fileDataItem)
		return this.fileDataItem;
	}

	/**
	 * Removes a file record from the list
	 * @param {FileRecord} fileId
	 * @returns the updated list of files
	 */
	async removeRecord(fileId) {
		for(let record of this.fileDataItem){
			if(record.filename===fileId.filename && record.version===fileId.version){
				const index=this.fileDataItem.indexOf(record);
				this.fileDataItem.splice(index,1);
			}
		}
		game.settings.set("fathomlessgears","datafiles",this.fileDataItem)
		return this.fileDataItem;
	}

	/**
	 * Gets the file list
	 * @returns the list of file records
	 */
	getFileList() {
		return this.fileDataItem;
	}
}

/**
 * Core class for the manager window
 */
export class FshManager extends HLMApplication {
	static isOpen
	dataFiles
	dataFileRecorder
	dialogConfirm

	constructor(...args) {
		super(...args);
		this.dataFileRecorder=new DataFileRecorder();
		const fileList=this.dataFileRecorder.getFileList();
		this.dataFiles=fileList ? fileList : [];
		this.dialogConfirm=false;
		this.loading=false;
		FshManager.isOpen=true;
		ui.sidebar.activateTab('compendium');
		this.render(true);
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/fsh-manager.html",
			title: ".FSH Manager",
			width: 500,
			height: 400,
		});
	}

	async getData(options={}) {
		const context = {}
		context.dataFiles = this.dataFiles;
		return context
	}

	close(...args) {
		super.close(...args);
		FshManager.isOpen=false;
	}

	activateListeners(html) {
		super.activateListeners(html);
		Utils.activateButtons(html);

		document.getElementsByClassName("add-new-fsh")[0]?.addEventListener("click", () => {
			new FileUploader(this);
	  	});
		
		if(this.dataFiles.length>0) {
			html.find(".update").click(this.updateCallback.bind(this));
			html.find(".remove").click(this.removeCallback.bind(this));
		}
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
	async _onFileLoaded(ev,fileName,oldFile) {
		const fileRecord=await constructFileRecord(ev, fileName);
		this.checkFileRecordExists(fileRecord,ev,oldFile);
	}

	/**
	 * Checks if a file record matches any existing records, and triggers a dialog if it does
	 * @param {FileRecord} fileId The record for the new file
	 * @param {Blob} newFile The file itself
	 * @param {FileRecord} oldFile The record for the file to update, if any (this is passed to the outputs of this function)
	 */
	async checkFileRecordExists(fileId, newFile,oldFile) {
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
			this.startLoading(game.i18n.localize("MANAGER.init"));
			await this.readFile(fileId,newFile,oldFile);
			this.stopLoading();
		}
	}

	/**
	 * Callback from the confirm overwrite dialog
	 * @param {Boolean} proceed Overwrite only if true
	 * @param {Object} args {fileId: FileRecord, newFile: Blob, oldFile: FileRecord, fshManager: FshManager}
	 */
	async confirmOverwriteCallback(proceed,args) {
		if(proceed) {
			args.fshManager.startLoading();
			await deleteFileRecord(args.fileId, args.fshManager);
			let index=0;
			for(let record of args.fshManager.dataFiles){
				if(record.filename===args.fileId.filename && record.version===args.fileId.version) {
					args.fshManager.dataFiles.splice(index);
					break;
				}
				index+=1;
			}
			await args.fshManager.readFile(args.fileId, args.newFile, args.oldFile);
			args.fshManager.stopLoading();
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
				await processFsh(newFile, fileId, oldFile, this);
				break;
			}
			case "json": {
				await processJson(newFile, fileId, oldFile, this);
				break;
			}
		}
		if(oldFile) this.removeDataSource(oldFile);
		this.addDataSource(fileId);
	}

	/**
	 * Add a new data file to the data file list
	 * @param {FileRecord} fileRecord The file record to add
	 */
	addDataSource(fileRecord) {
		this.dataFileRecorder.addRecord(fileRecord);
		this.fileList=this.dataFileRecorder.getFileList();
		this.render(true);
	}

	/**
	 * Remove a data file from the data file list
	 * @param {FileRecord} fileRecord The file record to add
	 */
	removeDataSource(fileRecord) {
		this.dataFileRecorder.removeRecord(fileRecord);
		this.fileList=this.dataFileRecorder.getFileList();
		this.render(true);
	}

	/**
	 * Triggers the removal of a data file
	 * @param {Event} ev The callback event
	 */
	async removeCallback(ev) {
		this.startLoading(game.i18n.localize("MANAGER.init"));
		const targetRecord=new FileRecord(ev.target.attributes.filename.value,ev.target.attributes.version.value);
		await deleteFileRecord(targetRecord, this);
		this.updateLoadingMessage(game.i18n.localize("MANAGER.removesource"));
		this.removeDataSource(targetRecord);
		this.stopLoading();
	}

	/**
	 * Triggers the removal of a data file
	 * @param {Event} ev The callback event
	 */
	updateCallback(ev) {
		const targetRecord=new FileRecord(ev.target.attributes.filename.value,ev.target.attributes.version.value);
		new FileUploader(this,targetRecord);
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
async function processFsh(rawFsh, fileId, oldFile, dialog) {
	//renamed .zip
	const zip=new JSZip();
	const loadedZip=await zip.loadAsync(rawFsh);
	await readZippedFileCollection(fileId,loadedZip.files,oldFile, dialog);
}

/**
 * Prepare a json upload for processing
 * @param {string} rawJson The read-in json file
 * @param {FileRecord} fileId The file record
 * @param {FileRecord} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function processJson(rawJson, fileId, oldFile, dialog) {
	await readDataJson(rawJson, fileId.filename, fileId, oldFile, dialog);
}

/**
 * Parse extracted json and save its contents
 * @param {string} fileData JSON file contents
 * @param {string} fileName Name of this file (json or unzipped inner file)
 * @param {Object} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {Object} oldFile The file record to overwrite, if any (null if this is a new file)
 */
async function readDataJson(fileData, fileName, fileId, oldFile, dialog) {
	const preparedData=JSON.parse(fileData);
	const dataTypes=identifyDataTypes(fileData,fileName);
	if(dataTypes!= null) {
		await saveToCompendium(preparedData,dataTypes, fileId, oldFile, dialog);
	} else {
		ui.notifications.info(`Can't identify item types for ${fileName}, skipping...`);
	}
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
async function readZippedFileCollection(fileId, zippedFiles, oldFile, dialog) {
	for(let zFileName of Object.keys(zippedFiles)) {
		if(getExtension(zFileName)=="json") {
			const fileData=await zippedFiles[zFileName].async('string');
			await readDataJson(fileData, zFileName, fileId, oldFile, dialog);
		}
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
 * @param {ITEM_TYPES[]} dataTypes List of content types in this datafile
 * @param {FileRecord} fileId Datafile info in the form {filename: "filename", version: "versionString"}
 * @param {FileRecord} oldFile For an update, the id of the file to update (null if this is a new file)
 */
async function saveToCompendium(preparedData, dataTypes, fileId, oldFile, dialog) {
	for(let type of dataTypes) {
		const relevantData = extractRelevantData(preparedData, type);
		const targetCompendium = await getTargetCompendium(type);
		await targetCompendium.configure({locked: false});
		await writeNewCompendiumItems(relevantData,targetCompendium,type, fileId, dialog)
		await targetCompendium.configure({locked: true});
	}
}

/**
 * Create an item
 * @param {string} itemName The item's name
 * @param {Object} jsonData The imported data for the item
 * @param {CONTENT_TYPES} itemType The item type
 * @param {FileRecord} sourceId The record of the source file
 * @param {CompendiumCollection} compendium The collection to put the item itno
 * @returns the newly constructed Item
 */
async function createItem(itemName,jsonData,itemType,sourceId, compendium) {
	const name=jsonData.name ? jsonData.name : Utils.capitaliseWords(Utils.fromLowerHyphen(itemName));
	const record={
		"name": name,
		"type": itemType,
	}
	let item=null;
	try {
		const itemData=createHLMItemData(record,jsonData,sourceId);
		item=await compendium.createDocument(itemData);
	}
	catch(error) {
		const message="Could not create item from file data, name: "+name+", type "+Utils.getLocalisedItemType(itemType);
		ui.notifications.error(message);
	}
	return item
}

/**
 * Create new items in a compendium from a JSON read
 * @param {Object} relevantData JSON extract containing data for a specific content type
 * @param {CompendiumCollection} compendium The compendium for the intended content type
 * @param {Object} fileId The item's source file in the format {filename: "filename", version: "versionString"}
 */
async function writeNewCompendiumItems(relevantData, compendium, itemType, fileId, dialog) {
	dialog.updateLoadingMessage(`${game.i18n.localize("MANAGER.loading")} ${compendium.metadata.label}`);
	for(let itemName of Object.keys(relevantData)) {
		const item = await createItem(itemName,relevantData[itemName],itemType,fileId, compendium);
		if (item) {await compendium.importDocument(item)};
	}
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
 * Deletes all compendium items from a given source file
 * @param {FileRecord} fileId The file record to remove
 */
async function deleteFileRecord(fileId, dialog) {
	for(const compendium of game.packs) {
		dialog.updateLoadingMessage(`${game.i18n.localize("MANAGER.removing")} ${compendium.metadata.label}`);
		await removeItemsFromFileSource(compendium,fileId);
	}
}

/**
 * Removes all items from a compendium from a specific source
 * @param {CompendiumCollection} compendium The compendium to process
 * @param {FileRecord} fileId The source file to clear
 */
async function removeItemsFromFileSource(compendium, fileId) {
	await compendium.configure({locked: false});
	const index=await compendium.getIndex({fields: ["system.source"]})
	const existingItems = await index.filter((item) => isItemFromFileSource(item,fileId));
	const toDelete=[];
	existingItems.forEach(item => {
		toDelete.push(item._id);
	});
	await compendium.documentClass.deleteDocuments(toDelete,{pack:compendium.collection});
	await compendium.configure({locked: true});
}