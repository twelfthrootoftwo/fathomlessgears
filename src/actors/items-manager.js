import {Utils} from "../utilities/utils.js";
import {
	ACTOR_TYPES,
	ATTRIBUTES,
	ITEM_TYPES,
	GRID_TYPE,
	TEMPLATE_WEIGHT
} from "../constants.js";
import {ConfirmDialog} from "../utilities/confirm-dialog.js";
import {
	BALLAST_TOKEN_CONDITIONS,
	findConditionEffect,
	quickCreateCounter
} from "../conditions/conditions.js";

export class AttributeElement {
	value;
	source;
	type;
	label;

	constructor(value, source, type, label) {
		this.value = value;
		this.source = source;
		this.type = type;
		this.label = label;
	}
}

export class ItemsManager {
	constructor(actor) {
		this.actor = actor;
	}

	/**
	 * Checks whether an item can be dropped onto this actor
	 * @param {Item} item The item being dropped
	 * @returns True if this object can be dropped, False otherwise
	 */
	canDropItem(item) {
		let acceptedTypes = [];
		switch (this.actor.type) {
			case "fisher":
				acceptedTypes = [
					ITEM_TYPES.frame_pc,
					ITEM_TYPES.internal_pc,
					ITEM_TYPES.development,
					ITEM_TYPES.maneuver,
					ITEM_TYPES.deep_word,
					ITEM_TYPES.background,
					ITEM_TYPES.condition,
					ITEM_TYPES.history_event
				];
				break;
			case "fish":
				acceptedTypes = [
					ITEM_TYPES.internal_npc,
					ITEM_TYPES.size,
					ITEM_TYPES.condition
				];
				break;
		}
		if (acceptedTypes.includes(item.type)) {
			return true;
		}
		return false;
	}

	/**
	 * Directs a new item to the correct process on adding the item to the actor
	 * @param {Item} item The item to apply
	 */
	receiveDrop(item, context) {
		switch (item.type) {
			case ITEM_TYPES.size:
				this.applySize(item);
				break;
			case ITEM_TYPES.frame_pc:
				this.applyFrame(item);
				break;
			case ITEM_TYPES.internal_pc:
			case ITEM_TYPES.internal_npc:
				this.onInternalDrop(item);
				break;
			case ITEM_TYPES.development:
				this.applyDevelopment(item);
				break;
			case ITEM_TYPES.maneuver:
				this.applyManeuver(item);
				break;
			case ITEM_TYPES.deep_word:
				this.applyDeepWord(item);
				break;
			case ITEM_TYPES.background:
				this.applyBackground(item);
				break;
			case ITEM_TYPES.condition:
				this.dropCondition(item, context);
				break;
			case ITEM_TYPES.history_event:
				this.dropHistory(item, context);
				break;
		}
	}

	async removeItemCallback(uuid) {
		const item = this.actor.items.get(uuid);
		if (
			item.type == ITEM_TYPES.internal_npc ||
			item.type == ITEM_TYPES.internal_pc
		) {
			this.onInternalRemove(uuid);
		} else {
			this._removeItem(uuid);
		}
	}

	/**
	 * Searches a particular item type for an existing item with a given name
	 * Returns the existing item if it exists, otherwise null
	 * @param {ITEM_TYPES} itemType The type of item to find
	 * @param {string} itemName The name of the target item
	 */
	findItemByNameAndType(itemType, itemName) {
		let existing = this.actor.itemTypes[itemType];
		let target = null;
		existing.forEach((item) => {
			if (item.name == itemName) {
				target = item;
			}
		});
		return target;
	}

	/**
	 * Searches a particular item type for an existing item with a given name
	 * Returns the existing item if it exists, otherwise null
	 * @param {ITEM_TYPES} itemType The type of item to find
	 * @param {string} itemName The name of the target item
	 */
	findConditionByStatus(statusId) {
		let existing = this.actor.effects;
		let target = null;
		existing.forEach((effect) => {
			if (effect.statuses.has(statusId)) {
				target = effect;
			}
		});
		return target;
	}

	/**
	 * Item drop processing for grid
	 * @param {Item} grid
	 */
	async applyGrid(grid) {
		if (
			this.actor.type == ACTOR_TYPES.fisher &&
			grid.system.type != GRID_TYPE.fisher
		) {
			return false;
		} else if (
			this.actor.type != ACTOR_TYPES.fisher &&
			grid.system.type == GRID_TYPE.fisher
		) {
			return false;
		}
		//Remove existing size item
		if (this.actor.system.gridType) {
			const oldGrid = this.actor.items.get(this.actor.system.gridType);
			oldGrid?.delete();
		}
		//Create new size item
		const item = await Item.create(grid, {parent: this.actor});
		this.actor.system.gridType = item._id;
		await this.actor.update({system: this.actor.system});
		Hooks.callAll("gridUpdated", this.actor);
	}

	/**
	 * Item drop processing for size
	 * @param {Item} size
	 */
	async applySize(size) {
		if (this.actor.type == ACTOR_TYPES.fisher) return false;
		//Apply attribute changes
		Object.keys(size.system.attributes).forEach((key) => {
			this.actor.setBaseAttributeValue(key, size.system.attributes[key]);
		});
		//Remove existing size item
		if (this.actor.system.size) {
			const oldSize = this.actor.items.get(this.actor.system.size);
			oldSize?.delete();
		}
		this.actor.update({system: this.actor.system});
		//Create new size item
		const item = await Item.create(size, {parent: this.actor});
		this.actor.system.size = item._id;
		this.actor.update({system: this.actor.system});

		//Apply grid
		const newGrid = await Utils.getGridFromSize(size.name);
		await this.applyGrid(newGrid);

		//Update token size
		this.actor.updateDefaultTokenSize(
			Utils.getTokenSizeFromSize(size.name)
		);

		Hooks.callAll("sizeUpdated", this.actor);
	}

	/**
	 * Item drop processing for frames
	 * @param {Item} frame
	 */
	async applyFrame(frame) {
		if (this.actor.type != ACTOR_TYPES.fisher) return false;
		//Apply attribute changes
		Object.keys(frame.system.attributes).forEach((key) => {
			this.actor.setBaseAttributeValue(key, frame.system.attributes[key]);
		});
		//Remove existing size item
		if (this.actor.system.frame) {
			const oldFrame = this.actor.items.get(this.actor.system.frame);
			this.actor.modifyResourceValue(
				"repair",
				-oldFrame.system.repair_kits
			);
			this.actor.modifyResourceValue(
				"core",
				-oldFrame.system.core_integrity
			);
			oldFrame?.delete();
		}
		this.actor.modifyResourceValue("repair", frame.system.repair_kits);
		this.actor.modifyResourceValue("core", frame.system.core_integrity);
		await this.actor.update({system: this.actor.system});

		//Create new size item
		const item = await Item.create(frame, {parent: this.actor});
		this.actor.system.frame = item._id;
		this.actor.calculateBallast(true);

		//Resize token if needed
		if (item.name == "Jolly Roger") {
			this.actor.updateDefaultTokenSize(2);
		}

		await this.actor.update({system: this.actor.system});
		Hooks.callAll("frameUpdated", this.actor);
	}

	async onInternalDrop(internal) {
		if (this.actor.getFlag("fathomlessgears", "interactiveGrid")) {
			new ConfirmDialog(
				"Override Imported Data",
				`Manually adding an internal to this actor will disable the interactive grid.<br>
				To keep the interactive grid, you should update the character by uploading a new Gearwright save file.<br>
				Manually add internal?`,
				this.actor.applyInternalDeactivateGrid,
				{actor: this.actor, internal: internal}
			);
		} else {
			this.applyInternal(internal);
		}
	}

	async onInternalRemove(uuid) {
		if (this.actor.getFlag("fathomlessgears", "interactiveGrid")) {
			new ConfirmDialog(
				"Override Imported Data",
				`Manually removing an internal from this actor will disable the interactive grid.<br>
				To keep the interactive grid, you should update the character by uploading a new Gearwright save file.<br>
				Manually remove internal?`,
				this.actor.removeInternalDeactivateGrid,
				{actor: this.actor, uuid: uuid}
			);
		} else {
			this._removeItem(uuid);
		}
	}

	/**
	 * Item drop processing for internals
	 * @param {Item} internal
	 */
	async applyInternal(internal) {
		console.log("Applying internal");
		const item = await Item.create(internal, {parent: this.actor});
		item.setFlag("fathomlessgears", "broken", false);
		this.actor.system.internals.push(item._id);
		//Apply attributes
		Object.keys(internal.system.attributes).forEach((key) => {
			if (
				Utils.isAttribute(key) &&
				internal.system.attributes[key] != 0
			) {
				const modifier = new AttributeElement(
					internal.system.attributes[key],
					item._id,
					"internal",
					internal.name
				);
				this.actor.addAttributeModifier(key, modifier);
			}
		});
		//Modify resources
		if (internal.system.repair_kits) {
			this.actor.modifyResourceValue(
				"repair",
				internal.system.repair_kits
			);
		}

		//Special logic for Ascended Form
		if (internal.name == "Ascended Form") {
			this.applyAllDeepWords();
		}

		this.actor.calculateBallast(true);

		await this.actor.update({system: this.actor.system});
		Hooks.callAll("internalAdded", this.actor);
		return item._id;
	}

	/**
	 * Mark an internal as broken
	 * @param {string} uuid The UUID of the internal to break
	 */
	async toggleInternalBroken(uuid) {
		const internal = this.actor.items.get(uuid);
		await internal.toggleBroken();

		//Apply attribute changes
		const isBroken = await internal.isBroken();
		console.log("Toggling internal to broken state " + isBroken);
		if (!internal.isSturdy()) {
			Object.keys(internal.system.attributes).forEach((key) => {
				if (
					key != ATTRIBUTES.weight &&
					internal.system.attributes[key] != 0
				) {
					if (isBroken) {
						this.actor.removeAttributeModifier(key, uuid);
					} else {
						const modifier = new AttributeElement(
							internal.system.attributes[key],
							internal._id,
							"internal",
							internal.name
						);
						this.actor.addAttributeModifier(key, modifier);
					}
				}
			});
		}

		await this.actor.update({system: this.actor.system});
		this.actor.breakInternalMessage(internal);

		Hooks.callAll("internalBrokenToggled", internal, this.actor);
	}

	/**
	 * Deletes an internal from this actor
	 * @param {string} uuid The UUID of the internal to delete
	 */
	async _removeItem(uuid) {
		const item = this.actor.items.get(uuid);
		if (!item) {
			console.log(`No item ${uuid}`);
			return;
		}
		const isInternal =
			item.type == ITEM_TYPES.internal_npc ||
			item.type == ITEM_TYPES.internal_pc;
		console.log("Clearing attributes");
		let attributeChanged = false;
		if (item.system.attributes) {
			Object.keys(item.system.attributes).forEach((key) => {
				if (item.system.attributes[key] != 0) {
					attributeChanged =
						this.actor.removeAttributeModifier(key, uuid) ||
						attributeChanged;
				}
			});
		}

		console.log("Clearing resources");
		if (this.actor.system.resources) {
			if (item.system.repair_kits)
				attributeChanged =
					this.actor.modifyResourceValue(
						"repair",
						-1 * item.system.repair_kits
					) || attributeChanged;
			if (item.system.marbles)
				attributeChanged =
					this.actor.modifyResourceValue(
						"marbles",
						-1 * item.system.marbles
					) || attributeChanged;
		}

		if (attributeChanged) {
			console.log("Updating");
			this.actor.calculateBallast();
			await this.actor.update({system: this.actor.system});
		}

		//Re-retrieve item in case delete has been called twice as a race condition
		const itemCheck = this.actor.items.get(uuid);
		if (itemCheck) {
			setTimeout(async () => {
				console.log("Deleting item");
				await item.delete();
			}, 100);
		}

		if (isInternal) {
			Hooks.callAll("internalDeleted", this);
		}
	}

	/**
	 * Remove all items on this actor, other than frame/size (pre import)
	 */
	async removeItems() {
		const items = this.actor.itemTypes.internal_pc
			.concat(this.actor.itemTypes.internal_npc)
			.concat(this.actor.itemTypes.development)
			.concat(this.actor.itemTypes.deep_word)
			.concat(this.actor.itemTypes.maneuver);
		items.forEach((item) => {
			this._removeItem(item._id);
		});
	}

	async applyDevelopment(development) {
		console.log("Applying development");
		const item = await Item.create(development, {parent: this.actor});

		//Special logic for Encore, since it's an activated development
		if (item.isEncore()) {
			item.setFlag("fathomlessgears", "activated", false);
		}
		//Apply attributes
		Object.keys(item.system.attributes).forEach((key) => {
			if (Utils.isAttribute(key) && item.system.attributes[key] != 0) {
				const modifier = new AttributeElement(
					item.system.attributes[key],
					item._id,
					"development",
					item.name
				);
				this.actor.addAttributeModifier(key, modifier);
			}
		});
		//Modify resources
		if (item.system.repair_kits) {
			this.actor.modifyResourceValue("repair", item.system.repair_kits);
		}
		this.actor.calculateBallast(true);

		await this.actor.update({system: this.actor.system});
		return item._id;
	}

	async applyManeuver(maneuver) {
		console.log("Applying maneuver");
		const item = await Item.create(maneuver, {parent: this.actor});

		item.setFlag("fathomlessgears", "activated", false);

		await this.actor.update({system: this.actor.system});
		return item._id;
	}

	async applyDeepWord(word) {
		console.log("Applying deep word");
		const item = await Item.create(word, {parent: this.actor});

		item.setFlag("fathomlessgears", "activated", false);

		await this.actor.update({system: this.actor.system});
		return item._id;
	}

	async applyAllDeepWords() {
		const collection = await game.packs.get(`world.deep_word`);
		const records = collection.index.filter(
			(p) => p.name != "Serenity, A Promise Kept"
		);
		records.forEach(async (record) => {
			const item = await collection.getDocument(record._id);
			this.applyDeepWord(item);
		});
	}

	async applyBackground(background) {
		if (this.actor.type == ACTOR_TYPES.fisher) {
			this.applyBackgroundSystem(background.system);
		}
	}

	async removeOldBackground() {
		if (this.actor.itemTypes.background[0]) {
			const oldBackground = this.actor.itemTypes.background[0];
			this.actor.modifyResourceValue(
				"marbles",
				-oldBackground.system.marbles
			);
			await this.actor.update({
				"system.attributes": this.actor.system.attributes,
				"system.resources": this.actor.system.resources
			});
			oldBackground?.delete();
		}
	}

	async applyBackgroundSystem(system) {
		let originalMarbles = false;
		if (await this.actor.getFlag("fathomlessgears", "initialised")) {
			originalMarbles = this.actor.system.resources.marbles.value;
		}

		await this.removeOldBackground();

		Object.keys(system.attributes).forEach((key) => {
			this.actor.setBaseAttributeValue(key, system.attributes[key]);
		});
		this.actor.modifyResourceValue("marbles", system.marbles);
		if (originalMarbles) {
			this.actor.system.resources.marbles.value = originalMarbles;
		}
		await this.actor.update({
			"system.attributes": this.actor.system.attributes,
			"system.resources": this.actor.system.resources
		});

		await Item.create(
			{name: "Background", type: ITEM_TYPES.background, system: system},
			{parent: this.actor}
		);
		Hooks.callAll("backgroundUpdated", this.actor);
	}

	async removeOldTemplate() {
		if (this.actor.itemTypes.fish_template[0]) {
			const oldTemplate = this.actor.itemTypes.fish_template[0];
			await this._removeItem(oldTemplate._id);

			//Template weight is stored as a bonus
			const targetAttribute = this.actor.system.attributes.weight;
			let delIndex = -1;
			let index = 0;
			targetAttribute.values.bonus.forEach((modifier) => {
				if (modifier.source == oldTemplate._id) {
					delIndex = index;
				}
				index += 1;
			});
			if (delIndex >= 0) {
				targetAttribute.values.bonus.splice(delIndex, 1);
			} else {
				console.log(`Could not find template weight!`);
			}
			await this.actor.update({
				"system.attributes.weight": this.actor.system.attributes.weight
			});
		}
	}

	async applyTemplateSystem(system, name) {
		await this.removeOldTemplate();
		const newTemplate = await Item.create(
			{name: name, type: ITEM_TYPES.fish_template, system: system},
			{parent: this.actor}
		);

		Object.keys(newTemplate.system.attributes).forEach((key) => {
			if (
				Utils.isAttribute(key) &&
				newTemplate.system.attributes[key] != 0
			) {
				const modifier = new AttributeElement(
					newTemplate.system.attributes[key],
					newTemplate._id,
					"template",
					newTemplate.name
				);
				this.actor.addAttributeModifier(key, modifier);
			}
		});
		const templateWeight = new AttributeElement(
			TEMPLATE_WEIGHT[newTemplate.name],
			newTemplate._id,
			"template",
			newTemplate.name
		);
		this.actor.system.attributes.weight.values.bonus.push(templateWeight);
		this.actor.update({"system.attributes": this.actor.system.attributes});

		Hooks.callAll("templateUpdated", this.actor);
	}

	async toggleManeuver(uuid) {
		const item = this.actor.items.get(uuid);
		const currentState = item.getFlag("fathomlessgears", "activated");
		item.setFlag("fathomlessgears", "activated", !currentState);
	}

	/**
	 * Adds a condition to this actor by dropping the condition item on it
	 * Will both create the condition item and set the active effect on tokens
	 * @param {Item} condition A new Condition item to duplicate onto this actor
	 */
	async dropCondition(condition, dataset) {
		if (dataset.value) {
			condition.system.value = parseInt(dataset.value);
		} else if (condition.system.value === true) {
			condition.system.value = 1;
		}

		let tokens = null;
		if (BALLAST_TOKEN_CONDITIONS.includes(condition.system.effectName)) {
			tokens = this.actor.getBallastTokens();
		} else {
			tokens = this.actor.getNonBallastTokens();
		}

		let existingCondition = this.findConditionByStatus(
			condition.system.effectName
		);
		if (existingCondition) {
			tokens.forEach(async (token) => {
				const existingEffect = token.actor.appliedEffects.filter(
					(appliedEffect) =>
						appliedEffect.statuses.has(condition.system.effectName)
				)[0];
				let effectCounter = foundry.utils.getProperty(
					existingEffect,
					"flags.statuscounter.counter"
				);
				let targetValue = Math.max(
					Math.min(
						effectCounter
							? condition.system.value + effectCounter.value
							: condition.system.value,
						3
					),
					-3
				);
				await quickCreateCounter(existingEffect, targetValue);
			});
		} else {
			if (condition.system.effectName) {
				console.log("Starting effect creation");
				tokens.forEach(async (token) => {
					console.log("Creating new effect instance");
					await this.addNewTokenEffect(token, condition);
				});
			}
		}
	}

	applyCondition(condition) {
		//Apply attributes
		Object.keys(condition.system.attributes).forEach((key) => {
			if (
				Utils.isAttribute(key) &&
				condition.system.attributes[key] != 0
			) {
				const modifier = new AttributeElement(
					condition.system.attributes[key] * condition.system.value,
					condition._id,
					"condition",
					condition.name
				);
				this.actor.addAttributeModifier(key, modifier);
			}
		});

		this.actor.calculateBallast();
	}

	/**
	 * Changes the attribute modifiers associated with a condition
	 * @param {Item} condition The existing condition, updated with the new value
	 */
	async updateCondition(condition) {
		Object.keys(condition.system.attributes).forEach((key) => {
			if (condition.system.attributes[key] != 0) {
				let found = false;
				this.actor.system.attributes[
					key
				].values.standard.additions.forEach((modifier) => {
					if (modifier.source == condition._id) {
						console.log("Updating existing mod");
						if (
							modifier.value !=
							condition.system.attributes[key] *
								condition.system.value
						) {
							modifier.value =
								condition.system.attributes[key] *
								condition.system.value;
							changes = true;
						}

						found = true;
					}
				});
				if (!found) {
					console.log("Applying new mod");
					const modifier = new AttributeElement(
						condition.system.attributes[key] *
							condition.system.value,
						condition._id,
						"condition",
						condition.name
					);
					this.actor.addAttributeModifier(key, modifier);
					console.log(this.actor);
				}
			}
		});
	}

	/**
	 * Add a token effect to a token (after dropping a condition item on an actor)
	 * @param {TokenDocument} token The token to add the effect to
	 * @param {Item} condition Condition item that triggers this effect
	 */
	async addNewTokenEffect(token, condition) {
		if (condition.system.value === true) {
			condition.system.value = 1;
		}
		await token.toggleActiveEffect(
			findConditionEffect(condition.system.effectName)
		);
		const effect = token.actor.appliedEffects.filter((appliedEffect) =>
			appliedEffect.statuses.has(condition.system.effectName)
		)[0];
		setTimeout(
			async () =>
				await quickCreateCounter(effect, condition.system.value),
			100
		);
	}

	async dropHistory(history, event) {
		let item = await Item.create(history, {parent: this.actor});

		let targetEL = this.actor.system.fisher_history.el;
		if (event.target) {
			let targetRow = event.target.closest(".history-table-row");
			if (targetRow?.dataset.el) {
				targetEL = targetRow.dataset.el;
			}
		}

		item.update({"system.obtainedAt": targetEL});

		if (item.system.type == "injury") {
			item.update({"system.healed": false});
		}

		Object.keys(item.system.attributes).forEach((key) => {
			if (Utils.isAttribute(key) && item.system.attributes[key] != 0) {
				const modifier = new AttributeElement(
					item.system.attributes[key],
					item._id,
					"history",
					item.name
				);
				this.actor.addAttributeModifier(key, modifier);
			}
		});
		await this.actor.update({
			"system.attributes": this.actor.system.attributes
		});
	}

	async toggleInjuryHealed(id) {
		let item = this.actor.items.get(id);
		if (item.system.healed) {
			Object.keys(item.system.attributes).forEach((key) => {
				if (
					Utils.isAttribute(key) &&
					item.system.attributes[key] != 0
				) {
					const modifier = new AttributeElement(
						item.system.attributes[key],
						item._id,
						"history",
						item.name
					);
					this.actor.addAttributeModifier(key, modifier);
				}
			});
			this.actor.update({
				"system.attributes": this.actor.system.attributes
			});
		} else {
			Object.keys(item.system.attributes).forEach((key) => {
				if (
					Utils.isAttribute(key) &&
					item.system.attributes[key] != 0
				) {
					this.actor.removeAttributeModifier(key, id);
				}
			});
			this.actor.update({
				"system.attributes": this.actor.system.attributes
			});
		}
		item.update({"system.healed": !item.system.healed});
	}

	async clearConditions() {
		for (const effect of this.actor.effects) {
			if (effect.statuses.has("ballast")) continue;
			await effect.delete();
		}
	}
}
