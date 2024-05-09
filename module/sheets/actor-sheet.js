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
			width: 700,
			height: 700,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "character",
				},
			],
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
        const items=context.actor.itemTypes;
		context.frame=items.frame_pc[0] ? items.frame_pc[0] : {
			name: "",
			system: {
				"gear_ability": "No frame assigned"
			}
		};
		context.internals=items.internals;
		console.log(context);
		return context;
	}

	/**@inheritdoc */
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		this.actor.calculateBallast();
		return formData;
	}

	/** @inheritdoc */
	activateListeners(html) {
		Object.keys(this.actor.system.attributes.rolled).forEach((key) => {
			document.getElementById(key).querySelector(".name-box").classList.add("attribute-button","rollable", "btn");
		});
		const background_attributes=["mental","willpower"];
		background_attributes.forEach((key) => {
			const basePiece=document.getElementById(key).querySelector("#base").querySelector(".piece-value");
			basePiece.classList.toggle("static");
			basePiece.classList.toggle("editable");
			basePiece.classList.toggle("sheet-input");
			basePiece.disabled=false;
		});

		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));
		document.getElementById("post-frame-ability").addEventListener("click",this.postFrameAbility.bind(this));
	}

	async _onRoll(event) {
		event.preventDefault();
		const attribute = event.target.attributes.attribute?.value;

		this.actor.startRollDialog(attribute);
	}

	/** @override */
	get template() {
		return `systems/hooklineandmecha/templates/${this.actor.type}-sheet.html`;
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
		if(this.actor.canDropItem(targetItem)) {
			this.actor.receiveDrop(targetItem);
		} else {
			console.log(`Can't drop item type ${targetItem.type} on actor type ${this.actor.type}`);
		}
	}

	postFrameAbility() {
		this.actor.shareFrameAbility();
	}
}
