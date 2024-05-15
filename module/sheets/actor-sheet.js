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
		console.log("Getting data");
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

		//Gather internal categories
		context.weapons=[];
		context.active=[];
		context.passive=[];
		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			switch(internal.system.type) {
				case "melee":
				case "ranged":
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
		//Add classes to attribute boxes with special properties
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

		//Mark broken internals
		const items=this.actor.itemTypes;
		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.isBroken().then(result => {
				if(result) {
					console.log("Found a broken internal");
					this.toggleInternalBrokenDisplay(internal._id);
				}
			});
		});

		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));
		html.find(".break-button").click(this.breakInternal.bind(this));
		html.find(".post-button").click(this.postInternal.bind(this));
		html.find(".delete-internal").click(this.deleteInternal.bind(this));
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

	breakInternal(event) {
		this.toggleInternalBrokenDisplay(event.target.id);
		this.actor.toggleInternalBroken(event.target.id);
	}

	toggleInternalBrokenDisplay(uuid) {
		console.log("Toggling broken display");
		document.querySelector(`#${uuid}`,".internal-box").classList.toggle("broken");
		document.querySelector(`#${uuid}`,".break-button").classList.toggle("btn-dark");
		document.querySelector(`#${uuid}`,".post-button").classList.toggle("btn-dark");
	}

	postInternal(event) {
		console.log("Posting internal"+event.target.id);
	}

	deleteInternal(event) {
		console.log("Deleting internal"+event.target.id);
		this.actor.removeInternal(event.target.id);
	}
}
