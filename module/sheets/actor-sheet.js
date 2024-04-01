import {Utils} from "../utilities/utils.js";

/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
	selectedNpcType = "";
	selectedNpcSize = "";
	updateTypeAndSize=false;
	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha", "sheet", "actor"],
			template: "systems/hooklineandmecha/templates/fisher-sheet.html",
			width: 600,
			height: 600,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "attributes",
				},
			],
			scrollY: [".biography", ".attributes"],
			dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
		});
	}

	/** @inheritdoc */
	async getData(options) {
		const context = await super.getData(options);
		context.biographyHTML = await TextEditor.enrichHTML(
			context.actor.system.biography,
			{
				secrets: this.document.isOwner,
				async: true,
			}
		);
		// if (this.actor.type === "fish") {
		// 	this._getNPCTypes(context);
		// 	this._getNPCSizes(context);
		// 	if (this.actor.system.fishType) {
		// 		context.selectedNpcType = this.actor.system.fishType;
		// 	}
		// 	if (this.actor.system.size) {
		// 		context.selectedNpcSize = this.actor.system.size;
		// 	}
		// }
		return context;
	}

	/**@inheritdoc */
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		// if(this.updateTypeAndSize) {
		// 	console.log("Updating type and size");

		// 	formData["system.fishType"]=formData.selectedNpcType;
		// 	formData["system.size"]=formData.selectedNpcSize;
			
		// 	const npcType = game.fishHandler.knownTypes[formData.selectedNpcType];
		// 	for (let key in npcType) {
		// 		console.log("Updating "+key)
		// 		this.setAttributeValue(formData,key, npcType[key]);
		// 	}
		// 	this.actor.npcType=npcType;

		// 	const npcSize = game.fishHandler.knownSizes[formData.selectedNpcSize];
		// 	for (let key in npcSize) {
		// 		console.log("Updating "+key)
		// 		this.setAttributeValue(formData,key, npcSize[key]);
		// 	}
		// 	this.actor.npcSize=npcSize;
		// }
		this.actor.calculateBallast();
		return formData;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));
		html.find(".set-types").click(this.setTypes.bind(this));

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;
	}

	async _onRoll(event) {
		event.preventDefault();
		const dieCount = event.target.attributes.diecount.value;
		const dieSize = event.target.attributes.diesize.value;
		const attribute = event.target.attributes.attribute?.value;

		this.actor.rollAttribute(attribute, dieCount, dieSize);
	}

	setTypes(event) {
		this.updateTypeAndSize=true;
		this.submit();
		this.updateTypeAndSize=false;
	}

	/** @override */
	get template() {
		return `systems/hooklineandmecha/templates/${this.actor.type}-sheet.html`;
	}

	_getNPCSizes(context) {
		context.npcSizes = new Object();
		//TODO Get/apply size options from compendium
		// for (const sizeKey in game.fishHandler.knownSizes) {
		// 	if (sizeKey==="fisher") continue;
		// 	const size = game.fishHandler.knownSizes[sizeKey];
		// 	size.label = game.i18n.localize("FISHSIZE." + sizeKey);
		// 	context.npcSizes[sizeKey] = size;
		// }
	}

	setAttributeValue(formData, key, value) {
		if (Utils.isRollableAttribute(key)) {
			formData["system.attributes.rolled."+key+".value"] = value;
		} else if (Utils.isFlatAttribute(key)) {
			formData["system.attributes.flat."+key+".value"] = value;
		}
	}

	/**
	 * Accept and process an item dropped on this sheet
	 * @param {DragEvent} event The initiating drag event
	 * @param {*} data What's being dropped
	 */
	async _onDropItem(event, data) {
		const targetItem=await fromUuid(data.uuid);
		console.log(targetItem);
		if(this.actor.canDropItem(targetItem)) {
			this.actor.receiveDrop(targetItem);
		} else {
			console.log(`Can't drop item type ${targetItem.type} on actor type ${this.actor.type}`);
		}
	}
}
