import { ATTRIBUTES, ACTOR_TYPES } from "../constants.js";
import {Utils} from "../utilities/utils.js";
import { Grid } from "../grid/grid-base.js";
import { FileUploader } from "../data-files/uploader.js";
import {populateActorFromGearwright} from "../actors/gearwright-actor.js"

/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
	grid

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears", "sheet", "actor"],
			template: "systems/fathomlessgears/templates/fisher-sheet.html",
			width: 700,
			height: 550,
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
		context.showInitialiseCover=!context.actor.getFlag("fathomlessgears","initialised")
		context.biographyHTML = await TextEditor.enrichHTML(
			context.actor.system.biography,
			{
				secrets: this.document.isOwner,
				async: true,
			}
		);
		this.getLabels(context.actor);
		context.scan_text=await context.actor.getScanText();

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
			if(key=="ballast") {context.ballast=value; }
			else {
				Utils.isRollableAttribute(key) ? context.rolled[key]=value : context.flat[key]=value;
			}
		}

		//Gather internal categories
		context.weapons=[];
		context.active=[];
		context.passive=[];
		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.description_text=internal.getInternalDescriptionText();
			switch(internal.system.type) {
				case "close":
				case "far":
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

		context.interactiveGrid=false;
		if(this.actor.getFlag("fathomlessgears","interactiveGrid")){
			this.grid=new Grid(context.actor.system.grid);
			this.grid.actor=context.actor;
			context.interactiveGrid=true;
			context.grid=this.grid;
		}
		return context;
	}

	/**@inheritdoc */
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		this.actor.calculateBallast();
		this.actor.calculateAttributeTotals();
		return formData;
	}

	/** @inheritdoc */
	activateListeners(html) {
		//Add classes to attribute boxes with special properties
		Object.keys(this.actor.system.attributes).forEach((key) => {
			if(Utils.isRollableAttribute(key)) {
				let attributeDocument=html.find(`#${key}`).find(".name-box")[0];
				attributeDocument.classList.add("attribute-button","rollable", "btn");
			}
		});

		//Activate buttons & grid interactivity for owners only
		if(this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
			Utils.activateButtons(html);
			html.find(".internal-body").each(function() {
				this.classList.add("interactable");
			});
			html.find(".grid-base").each(function() {
				this.classList.add("interactable");
			});
		}

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
		html.find("#hit-location").click(this.locationHitMessage.bind(this));
		html.find("#scan").click(this.toggleScan.bind(this));
		html.find("#initialise-import").click(this.selectImport.bind(this))
		html.find("#initialise-manual").click(this.selectManualSetup.bind(this))
		if(this.actor.getFlag("fathomlessgears","interactiveGrid")) {
			html.find(".grid-space").click(this.grid.clickGridSpace.bind(this));
		}
		if(this.actor.type===ACTOR_TYPES.fisher) {
			document.getElementById("post-frame-ability").addEventListener("click",this.postFrameAbility.bind(this));
		}
	}

	testOwnership() {
		return this.actor.testUserPermission(game.user,"OWNER");
	}

	getLabels(actor) {
		//Attributes
		for (const attributeKey in actor.system.attributes) {
			const attribute = actor.system.attributes[attributeKey];
			attribute.label = Utils.getLocalisedAttributeLabel(attributeKey);
		}

		//Resources
		if (actor.system.resources) {
			for (const resourceKey in actor.system.resources) {
				const resource = actor.system.resources[resourceKey];
				resource.label = Utils.getLocalisedResourceLabel(resourceKey);
			}
		}

		//Downtime
		if (actor.system.downtime) {
			for (const downtimeKey in actor.system.downtime.rollable) {
				const attribute = actor.system.downtime.rollable[downtimeKey];
				attribute.label = Utils.getLocalisedDowntimeLabel(downtimeKey);
			}
		}
	}

	async _onRoll(event) {
		event.preventDefault();
		if(!this.testOwnership()) {return false;}
		const attribute = event.target.attributes.attribute?.value;
		this.actor.startRollDialog(attribute);
	}

	/** @override */
	get template() {
		return `systems/fathomlessgears/templates/${this.actor.type}-sheet.html`;
	}

	/**
	 * Accept and process an item dropped on this sheet
	 * @param {DragEvent} event The initiating drag event
	 * @param {*} data What's being dropped
	 */
	async _onDropItem(event, data) {
		if(!this.testOwnership()) {return false;}
		const targetItem=await fromUuid(data.uuid);
		if(this.actor.canDropItem(targetItem)) {
			this.actor.receiveDrop(targetItem);
		} else {
			ui.notifications.info(`Can't drop item type ${targetItem.type} on actor type ${this.actor.type}`);
		}
	}

	/**
	 * Share the actor's frame ability
	 */
	postFrameAbility() {
		if(!this.testOwnership()) {return false;}
		this.actor.shareFrameAbility();
	}

	/**
	 * Mark an internal as broken/repaired
	 * @param {event} event The triggering event
	 */
	async breakInternal(event) {
		if(!this.testOwnership()) {return false;}
		this.toggleInternalBrokenDisplay(safeIdClean(event.target.dataset.id));
		this.actor.toggleInternalBroken(safeIdClean(event.target.dataset.id));
	}

	toggleInternalBrokenDisplay(uuid) {
		document.querySelector(`[data-id=id${uuid}]`,".internal-box").classList.toggle("broken");
		document.querySelector(`[data-id=id${uuid}]`,".break-button").classList.toggle("btn-dark");
		document.querySelector(`[data-id=id${uuid}]`,".post-button").classList.toggle("btn-dark");
	}

	postInternal(event) {
		if(!this.testOwnership()) {return false;}
		this.actor.postInternal(safeIdClean(event.target.dataset.id));
	}

	deleteInternal(event) {
		if(!this.testOwnership()) {return false;}
		this.actor.removeInternal(safeIdClean(event.target.dataset.id));
	}

	locationHitMessage(event) {
		if(!this.testOwnership()) {return false;}
		this.actor.locationHitMessage();
	}

	async toggleScan(event) {
		if(!this.testOwnership()) {return false;}
		this.actor.toggleScan();
	}

	selectManualSetup() {
		if(!this.testOwnership()) {return false;}
		this.actor.setFlag("fathomlessgears","initialised",true);
	}

	selectImport() {
		if(!this.testOwnership()) {return false;}
		new FileUploader(this);
	}

	async _onFileLoaded(fileData,fileName,oldFile) {
		//process gearwright json
		const preparedData=JSON.parse(fileData);
		populateActorFromGearwright(this.actor,preparedData);
	}
}
function safeIdClean(safeId) {
	return safeId.substring(2);
}