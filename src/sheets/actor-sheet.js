import {ATTRIBUTES, ACTOR_TYPES, TEMPLATE} from "../constants.js";
import {Utils} from "../utilities/utils.js";
import {FileUploader} from "../data-files/uploader.js";
import {populateActorFromGearwright} from "../actors/gearwright-actor.js";

/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears", "sheet", "actor"],
			template: "systems/fathomlessgears/templates/fisher-sheet.html",
			width: 730,
			height: 650,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "gear"
				}
			],
			dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
		});
	}

	/** @inheritdoc */
	async getData(options) {
		const context = await super.getData(options);
		context.showCover =
			!context.actor.getFlag("fathomlessgears", "initialised") ||
			this.loading;
		context.showInitialiseButtons = !context.actor.getFlag(
			"fathomlessgears",
			"initialised"
		);
		context.biographyHTML = await TextEditor.enrichHTML(
			context.actor.system.biography,
			{
				secrets: this.document.isOwner,
				async: true
			}
		);
		this.getLabels(context.actor);
		context.scan_text = await context.actor.getScanText();
		context.template =
			context.actor.itemTypes.fish_template.length > 0
				? context.actor.itemTypes.fish_template[0].name
				: TEMPLATE.common;

		const items = context.actor.itemTypes;
		context.frame = items.frame_pc[0]
			? items.frame_pc[0]
			: {
					name: "",
					system: {
						gear_ability: "No frame assigned"
					}
				};
		context.size = items.size[0] ? items.size[0] : null;

		//Split attribute types
		context.rolled = {};
		context.flat = {};
		for (const [key, value] of Object.entries(
			context.actor.attributesWithConditions
		)) {
			if (key == "ballast") {
				context.ballast = value;
			} else {
				Utils.isRollableAttribute(key)
					? (context.rolled[key] = value)
					: (context.flat[key] = value);
			}
		}

		//Gather internal categories
		context.weapons = [];
		context.active = [];
		context.passive = [];
		const internals = items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.description_text = internal.getInternalDescriptionText();
			switch (internal.system.type) {
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
		});

		if (this.actor.type === ACTOR_TYPES.fisher) {
			context.history = this.buildHistoryForDisplay(items);
		}

		//Other items
		context.developments = items.development;
		context.maneuvers = items.maneuver;
		context.deep_words = items.deep_word;
		context.maneuvers.forEach((maneuver) => {
			maneuver.activated = maneuver.getFlag(
				"fathomlessgears",
				"activated"
			);
		});
		const encore = context.developments.find((development) =>
			development.isEncore()
		);
		if (encore) {
			encore.activated = encore.getFlag("fathomlessgears", "activated");
			context.encore = {
				name: encore.name,
				id: encore.id,
				activated: encore.getFlag("fathomlessgears", "activated")
			};
		}

		context.interactiveGrid = false;
		if (this.actor.getFlag("fathomlessgears", "interactiveGrid")) {
			context.interactiveGrid = true;
			context.grid = this.actor.grid;
		}
		return context;
	}

	/**@inheritdoc */
	_getSubmitData(updateData) {
		let formData = super._getSubmitData(updateData);
		let rerender = false;
		Object.values(ATTRIBUTES).forEach((attribute) => {
			const reference = `system.attributes.${attribute}.values.custom`;
			const formVal = formData[reference];
			if (!Number.isInteger(formVal)) {
				formData[reference] = 0;
				rerender = true;
			}
		});
		this.actor.calculateBallast();
		this.actor.calculateAttributeTotals();
		if (rerender) {
			this.render();
		}
		return formData;
	}

	/** @inheritdoc */
	activateListeners(html) {
		//Add classes to attribute boxes with special properties
		Object.keys(this.actor.system.attributes).forEach((key) => {
			if (Utils.isRollableAttribute(key)) {
				let attributeDocument = html
					.find(`#${key}`)
					.find(".name-box")[0];
				attributeDocument.classList.add(
					"attribute-button",
					"rollable",
					"btn"
				);
				if (this.type == ACTOR_TYPES.fish) {
					attributeDocument.classList.add("btn-dark");
				}
			}
		});

		//Activate buttons & grid interactivity for owners only
		if (
			this.actor.testUserPermission(
				game.user,
				CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
			)
		) {
			Utils.activateButtons(html);
			// html.find(".card-body").each(function () {
			// 	this.classList.add("interactable");
			// });
			html.find(".grid-base").each(function () {
				this.classList.add("interactable");
			});
		}

		super.activateListeners(html);
		html.find(".rollable").click(this._onRoll.bind(this));
		html.find(".break-button").click(this.breakInternal.bind(this));
		html.find(".post-button").click(this.postItem.bind(this));
		//html.find(".delete-item").click(this.deleteItem.bind(this));
		html.find(".reset-button").click(this.resetManeuvers.bind(this));
		html.find("#hit-location").click(this.locationHitMessage.bind(this));
		html.find("#scan").click(this.toggleScan.bind(this));
		html.find("#initialise-import").click(this.selectImport.bind(this));
		html.find("#import-button").click(this.selectImport.bind(this));
		html.find("#initialise-manual").click(
			this.selectManualSetup.bind(this)
		);
		html.find(".maneuver-checkbox").click(this.toggleManeuver.bind(this));
		if (this.actor.getFlag("fathomlessgears", "interactiveGrid")) {
			html = this.actor.grid.activateListeners(html);
		}
		if (this.actor.type === ACTOR_TYPES.fisher) {
			document
				.getElementById("post-frame-ability")
				.addEventListener("click", this.postFrameAbility.bind(this));
			html.find(".history-table-row").on(
				"dragover",
				this.dragOverHistoryTable.bind(this)
			);
			html.find(".history-table-row").on(
				"dragleave",
				this.dragLeaveHistoryTable.bind(this)
			);
			html.find(".injury-checkbox").click(
				this.toggleInjuryHealed.bind(this)
			);
		}

		if (game.sensitiveDataAvailable) {
			game.tagHandler.transformTagNameToButton($(this.element).get(0));
			game.tagHandler.addListeners();
		}
	}

	buildHistoryForDisplay(items) {
		const history = [];
		for (let i = 1; i <= this.actor.system.fisher_history.el; i++) {
			let injuries = items.history_event.filter(
				(history) =>
					history.system.obtainedAt == i &&
					history.system.type == "injury"
			);
			let touches = items.history_event.filter(
				(history) =>
					history.system.obtainedAt == i &&
					history.system.type == "touch"
			);
			history.push({
				el: i,
				injuries: injuries,
				touches: touches
			});
		}
		return history;
	}

	testOwnership() {
		return this.actor.testUserPermission(game.user, "OWNER");
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
	}

	async _onRoll(event) {
		event.preventDefault();
		if (!this.testOwnership()) {
			return false;
		}
		const attribute = event.target.attributes.attribute?.value;
		game.rollHandler.startRollDialog(this.actor, attribute);
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
		if (!this.testOwnership()) {
			return false;
		}
		const targetItem = await fromUuid(data.uuid);
		if (this.actor.itemsManager.canDropItem(targetItem)) {
			this.actor.itemsManager.receiveDrop(targetItem, event);
		} else {
			ui.notifications.info(
				`Can't drop item type ${targetItem.type} on actor type ${this.actor.type}`
			);
		}
	}

	/**
	 * Share the actor's frame ability
	 */
	postFrameAbility() {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.shareFrameAbility();
	}

	/**
	 * Mark an internal as broken/repaired
	 * @param {event} event The triggering event
	 */
	async breakInternal(event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.itemsManager.toggleInternalBroken(
			safeIdClean(event.target.dataset.id)
		);
	}

	toggleInternalBrokenDisplay(uuid) {
		document
			.querySelector(`[data-id=id${uuid}]`, ".card")
			.classList.toggle("broken");
		document
			.querySelector(`[data-id=id${uuid}]`, ".break-button")
			.classList.toggle("btn-dark");
		document
			.querySelector(`[data-id=id${uuid}]`, ".post-button")
			.classList.toggle("btn-dark");
	}

	toggleManeuver(event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.itemsManager.toggleManeuver(
			safeIdClean(event.target.dataset.id)
		);
	}

	resetManeuvers(_event) {
		if (!this.testOwnership()) {
			return false;
		}
		const maneuvers = this.actor.itemTypes.maneuver;
		maneuvers.forEach((maneuver) => {
			maneuver.setFlag("fathomlessgears", "activated", false);
		});
		const developments = this.actor.itemTypes.development;
		developments.forEach((development) => {
			if (development.isEncore()) {
				development.setFlag("fathomlessgears", "activated", false);
			}
		});
	}

	postItem(event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.postItem(safeIdClean(event.target.dataset.id));
	}

	deleteItem(event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.itemsManager.removeItemCallback(
			safeIdClean(event.target.dataset.id)
		);
	}

	locationHitMessage(_event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.locationHitMessage();
	}

	async toggleScan(_event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.toggleScan();
	}

	selectManualSetup() {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.setFlag("fathomlessgears", "initialised", true);
	}

	selectImport() {
		if (!this.testOwnership()) {
			return false;
		}
		new FileUploader(this);
	}

	async onFileLoaded(fileData, _fileName) {
		//process gearwright json
		this.loading = true;
		this.render();
		const preparedData = JSON.parse(fileData);
		populateActorFromGearwright(this.actor, preparedData).then(() => {
			this.loading = false;
			//Small delay to allow for the sheet to load post updates
			setTimeout(() => {
				this.render(true);
			}, 20);
		});
	}

	dragOverHistoryTable(event) {
		//There's no simple way to only highlight for a history item
		//TODO add extra data on drag start to pick up that this is a history item?
		event.target.parentElement.classList.add("valid-drop-hover");
	}
	dragLeaveHistoryTable(event) {
		event.target.parentElement.classList.remove("valid-drop-hover");
	}

	toggleInjuryHealed(event) {
		if (!this.testOwnership()) {
			return false;
		}
		this.actor.itemsManager.toggleInjuryHealed(
			safeIdClean(event.target.dataset.id)
		);
	}
}
function safeIdClean(safeId) {
	return safeId.substring(2);
}
