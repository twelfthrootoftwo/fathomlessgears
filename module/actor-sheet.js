import {Utils} from "./utils.js";

/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
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
		console.log("Getting context data");
		console.log(context);
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
		return context;
	}

	/**@inheritdoc */
	/**Not doing anything, just here to provide debug info when saving the sheet*/
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		console.log("Form data:");
		console.log(formData);
		return formData;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));

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
}
