import {Utils} from "./utils.js";

/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
	selectedNpcType = "";
	selectedNpcSize = "";
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
		this._getAttributeLabels();
		if (this.actor.system.resources) {
			this._getResourceLabels();
		}
		if (this.actor.type === "fish") {
			this._getNPCTypes(context);
			this._getNPCSizes(context);
		}
		return context;
	}

	/**@inheritdoc */
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		if (formData.selectedNpcType) {
			this.selectedNpcType = formData.selectedNpcType;
			this.selectedNpcSize = formData.selectedNpcSize;
		}
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
		this.actor.setNPCType(this.selectedNpcType);
		this.actor.setNPCSize(this.selectedNpcSize);
		this.render();
	}

	/** @override */
	get template() {
		return `systems/hooklineandmecha/templates/${this.actor.type}-sheet.html`;
	}

	_getAttributeLabels() {
		for (const attributeKey in this.actor.system.attributes.rolled) {
			const attribute = this.actor.system.attributes.rolled[attributeKey];
			attribute.label = Utils.getLocalisedAttributeLabel(attributeKey);
		}
		for (const attributeKey in this.actor.system.attributes.flat) {
			const attribute = this.actor.system.attributes.flat[attributeKey];
			attribute.label = Utils.getLocalisedAttributeLabel(attributeKey);
		}
	}

	_getResourceLabels() {
		for (const resourceKey in this.actor.system.resources) {
			const resource = this.actor.system.resources[resourceKey];
			resource.label = Utils.getLocalisedResourceLabel(resourceKey);
		}
	}

	_getNPCTypes(context) {
		context.npcTypes = new Object();
		for (const typeKey in game.fishHandler.knownTypes) {
			const type = game.fishHandler.knownTypes[typeKey];
			type.label = game.i18n.localize("FISHTYPE." + typeKey);
			context.npcTypes[typeKey] = type;
		}
	}

	_getNPCSizes(context) {
		context.npcSizes = new Object();
		for (const sizeKey in game.fishHandler.knownSizes) {
			const size = game.fishHandler.knownSizes[sizeKey];
			size.label = game.i18n.localize("FISHSIZE." + sizeKey);
			context.npcSizes[sizeKey] = size;
		}
	}
}
