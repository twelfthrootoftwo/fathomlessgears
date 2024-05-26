import { ATTRIBUTES, ACTOR_TYPES } from "../constants.js";
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
		context.size=items.size[0] ? items.size[0] : null;

		//Split attribute types
		context.rolled={};
		context.flat={};
		for (const [key, value] of Object.entries(context.actor.system.attributes)) {
			Utils.isRollableAttribute(key) ? context.rolled[key]=value : context.flat[key]=value;
		}

		//Gather internal categories
		context.weapons=[];
		context.active=[];
		context.passive=[];
		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.description_text=this.getDescriptionText(internal);
			switch(internal.system.type) {
				case "melee":
				case "ranged":
				case "mental":
					context.weapons.push(internal);
					break;
				case "active":
					context.active.push(internal);
					break;
				case "mitigation":
				case "passive":
					context.passive.push(internal);
					break;
			}
		})
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
		//Add classes to attribute boxes with special properties
		Object.keys(this.actor.system.attributes).forEach((key) => {
			if(Utils.isRollableAttribute(key)) {
				document.getElementById(key).querySelector(".name-box").classList.add("attribute-button","rollable", "btn");
			}
		});
		const background_attributes=["mental","willpower"];
		background_attributes.forEach((key) => {
			const basePiece=document.getElementById(key).querySelector("#base").querySelector(".piece-value");
			basePiece.classList.toggle("static");
			basePiece.classList.toggle("editable");
			basePiece.classList.toggle("sheet-input");
			basePiece.disabled=false;
		});

		//Mark broken internals
		const items=this.actor.itemTypes;
		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.isBroken().then(result => {
				if(result) {
					this.toggleInternalBrokenDisplay(internal._id);
				}
			});
		});

		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));
		html.find(".break-button").click(this.breakInternal.bind(this));
		html.find(".post-button").click(this.postInternal.bind(this));
		html.find(".delete-internal").click(this.deleteInternal.bind(this));
		if(this.actor.type===ACTOR_TYPES.fisher) {
			document.getElementById("post-frame-ability").addEventListener("click",this.postFrameAbility.bind(this));
		}
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
		if (Utils.isAttribute(key)) {
			formData["system.attributes."+key+".value"] = value;
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

	breakInternal(event) {
		this.toggleInternalBrokenDisplay(event.target.dataset.id);
		this.actor.toggleInternalBroken(event.target.dataset.id);
	}

	toggleInternalBrokenDisplay(uuid) {
		document.querySelector(`[data-id=${uuid}]`,".internal-box").classList.toggle("broken");
		document.querySelector(`[data-id=${uuid}]`,".break-button").classList.toggle("btn-dark");
		document.querySelector(`[data-id=${uuid}]`,".post-button").classList.toggle("btn-dark");
	}

	postInternal(event) {
		console.log("Posting internal"+event.target.dataset.id);
	}

	deleteInternal(event) {
		this.actor.removeInternal(event.target.dataset.id);
	}

	getDescriptionText(internal) {
		let description_text="";
		Object.keys(internal.system.attributes).forEach((key) => {
			if(internal.system.attributes[key] > 0 && key != ATTRIBUTES.weight) {
				description_text=description_text.concat(internal.system.attributes[key].toString()," ",Utils.getLocalisedAttributeLabel(key),"\n")
			}
		});
		description_text=description_text.concat(internal.system.action_text);
		return description_text;
	}
}
