import {Utils} from "../utilities/utils.js";
import {AttackHandler} from "../actions/attack.js";
import {
	ACTOR_TYPES,
	ATTRIBUTES,
	HIT_TYPE,
	ATTRIBUTE_MIN,
	ATTRIBUTE_MAX_ROLLED,
	ATTRIBUTE_MAX_FLAT,
	BALLAST_MIN,
	BALLAST_MAX
} from "../constants.js";

import {Grid} from "../grid/grid-base.js";
import {ItemsManager} from "./items-manager.js";
import {
	ATTRIBUTE_ONLY_CONDITIONS,
	findConditionFromStatus,
	NUMBERED_CONDITIONS,
	quickCreateCounter
} from "../conditions/conditions.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class HLMActor extends Actor {
	/** @inheritdoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		if (this.getFlag("fathomlessgears", "interactiveGrid")) {
			this.grid = new Grid(this.system.grid);
			this.grid.actor = this;
		}
		const items = this.itemTypes;

		const internals = items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.description_text = internal.getInternalDescriptionText();
		});

		const attackItems = items.internal_pc
			.concat(items.internal_npc)
			.concat(items.maneuver)
			.concat(items.deep_word);
		attackItems.forEach((item) => {
			if (item.system.attack) {
				item.system.attack.damageDescription =
					item.getDamageDescription(this);
				item.system.attack.damageNumber = item.getDamageNumber(this);
			}
		});

		this.itemsManager = new ItemsManager(this);

		this.queuedEffects = [];
	}

	/** @inheritdoc */
	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		if (game.user._id == userId) {
			this.setFlag("fathomlessgears", "initialised", false);

			if (this.type == ACTOR_TYPES.fish) {
				//Initialise scanning state
				const flag = this.getFlag("fathomlessgears", "scanned");
				if (flag == null || flag == undefined) {
					this.setFlag("fathomlessgears", "scanned", false);
				}

				//Default fish to None permissions
				let ownership = foundry.utils.deepClone(this.ownership);
				ownership["default"] = 0;
				this.update({ownership});
			} else if (this.type == ACTOR_TYPES.fisher) {
				if (!this.system.gridType) {
					this.itemsManager = new ItemsManager(this);
					Utils.getGridFromSize("Fisher").then((grid) => {
						this.itemsManager.applyGrid(grid);
					});
				}

				//Default fishers to Observer permission
				let ownership = foundry.utils.deepClone(this.ownership);
				ownership["default"] = 2;
				this.update({ownership});
			}
		}
	}

	/** @inheritdoc */
	applyActiveEffects() {
		super.applyActiveEffects();
		setTimeout(() => {
			this.applyConditions();
		}, 100);
	}

	async applyConditions() {
		if (!this.itemsManager) {
			this.itemsManager = new ItemsManager(this);
		}
		console.log("applyConditions");

		if (this.firstOwner() && game.user.id == this.firstOwner().id) {
			if (!this.updatingConditions) {
				this.updatingConditions = true;
				const conditionNames = [];
				let effectArray = this.effects.contents;
				for (let i in effectArray) {
					let activeEffect = effectArray[i];
					let conditionName = activeEffect.statuses
						.values()
						.next().value;
					conditionNames.push(conditionName);

					if (NUMBERED_CONDITIONS.includes(conditionName)) {
						quickCreateCounter(activeEffect, false);
					}
					if (
						Array.from(
							game.availableConditionItems?.keys()
						).includes(conditionName)
					) {
						await this.applySingleActiveEffect(activeEffect);
					}
				}
				await this.removeInactiveEffects(conditionNames);
				this.updatingConditions = false;
				if (this.queueApply) {
					this.queueApply = false;
					this.applyConditions();
				}
			} else {
				this.queueApply = true;
			}
		}
	}

	async applySingleActiveEffect(activeEffect) {
		console.log("applySingleActiveEffect");
		if (this.queuedEffects.includes(activeEffect.name)) return;
		let effectCounter = foundry.utils.getProperty(
			activeEffect,
			"flags.statuscounter.counter"
		);
		const counterValue = effectCounter.value;
		const statusName = activeEffect.statuses.values().next().value;

		const effectValue = Math.max(Math.min(counterValue, 3), -3);

		const existingCondition =
			this.itemsManager.findConditionByStatus(statusName);

		if (
			existingCondition &&
			ATTRIBUTE_ONLY_CONDITIONS.includes(statusName) &&
			existingCondition.system.value != effectValue
		) {
			this.queuedEffects.push(activeEffect.name);
			existingCondition.system.value = effectValue;
			await existingCondition
				.update({"system.value": effectValue})
				.then(() => {
					this.queuedEffects.filter(
						(name) => name != activeEffect.name
					);
				});
			await this.itemsManager.updateCondition(existingCondition);
		} else if (!existingCondition) {
			this.queuedEffects.push(activeEffect.name);
			let newCondition = await findConditionFromStatus(statusName);
			if (newCondition) {
				if (newCondition.system.value)
					newCondition.system.value = effectValue;
				await this.itemsManager.applyNewCondition(newCondition);
				this.queuedEffects.filter((name) => name != activeEffect.name);
			}
		}
	}

	/**
	 * Removes condition items and attribute modifiers associated with conditions not currently active on this actor
	 * @param {str[]} activeConditionNames List of condition names that are currently active
	 */
	async removeInactiveEffects(activeConditionNames) {
		this.itemTypes.condition.forEach(async (existingCondition) => {
			if (
				!activeConditionNames.includes(
					existingCondition.system.effectName
				)
			) {
				await this.itemsManager.removeItemCallback(
					existingCondition._id
				);
			}
		});
	}

	/**
	 * Get the numerical value of a condition
	 * @param {str} conditionName Name of the condition
	 * @returns number
	 */
	getConditionValue(conditionName) {
		const condition = this.effects.getName(
			game.i18n.localize(`CONDITIONS.${conditionName}`)
		);
		if (!condition) return 0;
		return condition.flags.statuscounter.counter.value || 0;
	}

	getConditionItem(conditionName) {
		let targetCondition = null;
		this.itemTypes.condition.forEach((existingCondition) => {
			if (conditionName == existingCondition.name) {
				targetCondition = existingCondition;
			}
		});
		return targetCondition;
	}

	async locationHitMessage() {
		const locationResult = await AttackHandler.rollHitLocation(this);
		if (locationResult) {
			const displayString =
				await AttackHandler.generateLocationDisplay(locationResult);
			game.tagHandler.createChatMessage(displayString, this);
		}
	}

	/**
	 * Evaluate totals for all attributes & save results
	 */
	async calculateAttributeTotals(updateSource = true) {
		const updateData = {};
		Object.keys(this.system.attributes).forEach((key) => {
			updateData[key] = this.calculateSingleAttribute(key);
		});
		if (this._id && updateSource) {
			await this.update({"system.attributes": updateData});
		}
	}

	/**
	 * Calculate the total value of a chosen attribute
	 * @param {ATTRIBUTE} key Attribute to calculate
	 * @returns none
	 */
	calculateSingleAttribute(key) {
		if (key == "ballast") {
			return this.calculateBallast();
		}
		const attr = this.system.attributes[key];
		let total = 0;
		total = attr.values.standard.base;
		attr.values.standard.additions.forEach((val) => {
			total += val.value;
		});
		if (total < ATTRIBUTE_MIN) total = ATTRIBUTE_MIN;
		const applyAttributeMaxRolled = [
			ATTRIBUTES.close,
			ATTRIBUTES.far,
			ATTRIBUTES.power,
			ATTRIBUTES.speed
		];
		if (
			applyAttributeMaxRolled.includes(key) &&
			total > ATTRIBUTE_MAX_ROLLED
		)
			total = ATTRIBUTE_MAX_ROLLED;
		if (Utils.isDefenceAttribute(key) && total > ATTRIBUTE_MAX_FLAT)
			total = ATTRIBUTE_MAX_FLAT;
		attr.values.bonus.forEach((val) => {
			total += val.value;
		});
		attr.total = total;
		return attr;
	}

	/**
	 * Change the base attribute value
	 * @param {string} attributeKey The attribute to change
	 * @param {int} value The new value
	 * @returns true if the change was successful, false if the attribute key is not valid
	 */
	setBaseAttributeValue(attributeKey, value) {
		if (!Utils.isAttribute(attributeKey)) return false;
		const targetAttribute = this.system.attributes[attributeKey];
		targetAttribute.values.standard.base = value;
		this.calculateSingleAttribute(attributeKey);
		return true;
	}

	/**
	 * Apply a (standard) modifier to an attribute
	 * @param {ATTRIBUTE} key The attribute to add the modifier to
	 * @param {AttributeElement} modifier The modifier to add
	 */
	addAttributeModifier(key, modifier) {
		const targetAttribute = this.system.attributes[key];
		targetAttribute.values.standard.additions.push(modifier);
		this.calculateSingleAttribute(key);
	}

	/**
	 * Removes an attribute modifier, if it exists
	 * @param {ATTRIBUTE} key The attribute to modify
	 * @param {string} source The id of the modifier to remove (usually the id of the object that created it)
	 */
	removeAttributeModifier(key, source) {
		const targetAttribute = this.system.attributes[key];
		console.log(this.system.attributes[key]);
		let delIndex = -1;
		let index = 0;
		targetAttribute.values.standard.additions.forEach((modifier) => {
			if (modifier.source == source) {
				delIndex = index;
			}
			index += 1;
		});
		if (delIndex >= 0) {
			targetAttribute.values.standard.additions.splice(delIndex, 1);
		} else {
			console.log(`Could not find modifier ${source}`);
		}
		this.calculateSingleAttribute(key);
	}

	/**
	 * Change the current & maximum values of a resource
	 * @param {string} resourceKey The resource to modify
	 * @param {int} value The value change to apply
	 * @returns True if the change was successful, False if the key is not a resource
	 */
	modifyResourceValue(resourceKey, value) {
		if (!Utils.isResource(resourceKey)) return false;
		this.system.resources[resourceKey].value += value;
		this.system.resources[resourceKey].max += value;
		if (this.system.resources[resourceKey].value < 0)
			this.system.resources[resourceKey].value = 0;
		if (this.system.resources[resourceKey].max < 0)
			this.system.resources[resourceKey].max = 0;
		return true;
	}

	/**
	 * Compute the actor's ballast value
	 */
	calculateBallast() {
		const ballast = this.system.attributes.ballast;
		const weight = this.system.attributes.weight;

		//Calculate ballast weight from standard values only
		//Homebrew ballast modifications can be done via the ballast custom mods
		let weightTotal = weight.values.standard.base;
		weight.values.standard.additions.forEach((element) => {
			weightTotal += element.value;
		});
		const weightBallast = Math.floor(weightTotal / 5);

		ballast.values.standard.weight = weightBallast;
		let ballastMods = 0;
		ballast.values.standard.additions.forEach((element) => {
			ballastMods += element.value;
		});
		ballast.total =
			ballast.values.standard.base +
			weightBallast +
			ballastMods +
			ballast.values.custom;

		if (ballast.total < BALLAST_MIN) ballast.total = BALLAST_MIN;
		if (ballast.total > BALLAST_MAX) ballast.total = BALLAST_MAX;

		return ballast;
	}

	/**
	 * Send this actor's flat attributes to the chat log
	 */
	async shareFrameAbility() {
		const frame = this.itemTypes.frame_pc[0];
		frame.postToChat(this);
	}

	/**
	 * Posts the chat message associated with an internal
	 * @param {string} uuid The ID of the internal
	 */
	async postItem(uuid) {
		const item = this.items.get(uuid);
		item.postToChat(this);
	}

	/**
	 * Make an attack with an internal, and post the attack result to the chat
	 * @param {string} uuid The ID of the internal
	 * @param {ATTRIBUTE} attackKey The attacking attribute
	 * @param {int} totalDieCount Number of dice to roll
	 * @param {int} totalFlat Total flat bonus to the roll
	 * @param {COVER_STATE} cover Whether or not this attack is affected by cover
	 */
	async triggerRolledItem(rollParams) {
		const internal = this.items.get(rollParams.internalId);
		const rollOutput = await game.rollHandler.rollTargeted(rollParams);
		const displayString = await renderTemplate(
			"systems/fathomlessgears/templates/messages/internal.html",
			{
				internal: internal,
				minor_text: internal.getItemDescriptionText(),
				major_text: rollOutput.text,
				showDamage: rollOutput.result != HIT_TYPE.miss,
				damageText: game.i18n.localize("INTERNALS.damage"),
				marbleText: game.i18n.localize("INTERNALS.marbles")
			}
		);
		game.tagHandler.createChatMessage(displayString, this);
	}

	/**
	 * Switch this actor from interactive to image grid
	 */
	async removeInteractiveGrid() {
		this.grid = null;
		let targetGridString =
			"systems/fathomlessgears/assets/blank-grid-fish.jpg";
		if (this.type == ACTOR_TYPES.fisher) {
			targetGridString = "systems/fathomlessgears/assets/blank-grid.jpg";
		}
		this.setFlag("fathomlessgears", "interactiveGrid", false);
		await this.update({"system.grid": targetGridString});
	}

	/**
	 * Remove this actor's interactive grid, then add a new internal
	 * @param {bool} proceed Take the action or no?
	 * @param {Object} args {internal: HLMInternal, actor: HLMActor}
	 */
	async applyInternalDeactivateGrid(proceed, args) {
		if (proceed) {
			await args.actor.removeInteractiveGrid();
			args.actor.itemsManager.applyInternal(args.internal);
		}
	}

	/**
	 * Remove this actor's interactive grid, then remove an internal
	 * @param {bool} proceed Take the action or no?
	 * @param {Object} args {uuid: str, actor: HLMActor}
	 */
	async removeInternalDeactivateGrid(proceed, args) {
		if (proceed) {
			await args.actor.removeInteractiveGrid();
			args.actor.itemsManager._removeItem(args.uuid);
		}
	}

	/**
	 * Assigns an initialised grid to this actor
	 * @param {Grid} gridObject The initialised grid for this actor
	 */
	async assignInteractiveGrid(gridObject) {
		this.grid = gridObject;
		await this.update({"system.grid": gridObject.toJson()});
		await this.setFlag("fathomlessgears", "interactiveGrid", true);
	}

	/**
	 * Get a list of users that have Observer or Owner permissions on this actor
	 * @returns a list of users
	 */
	async getObservers() {
		const observers = await game.users.filter((user) => {
			const isOwner = this.testUserPermission(
				user,
				CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
			);
			const isObserver = this.testUserPermission(
				user,
				CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
			);
			return isOwner || isObserver;
		});
		return observers;
	}

	async breakInternalMessage(internal) {
		const isBroken = await internal.isBroken();
		ChatMessage.create({
			whisper: await this.getObservers(),
			content: `${this.name}'s ${internal.name} ${isBroken ? "breaks!" : "is repaired"}`
		});
	}

	/**
	 * Toggle the scan state for this actor
	 * Written by VoidPhoenix, used with permission (thanks!)
	 */
	async toggleScan() {
		if (this.type != ACTOR_TYPES.fish) {
			return false;
		}
		const scanned = !(await this.getFlag("fathomlessgears", "scanned"));
		this.setFlag("fathomlessgears", "scanned", scanned);
		let ownership = foundry.utils.deepClone(this.ownership);
		ownership["default"] = scanned ? 2 : 0;
		await this.update({ownership});

		// Print the result to chat.
		let message = `<div style="display: flex; flex-direction: column; align-items: center;">
			<img src="${this.img}" style="border:none; max-height: 150px;"/>
			<div style="font-size: 16px;">Scan data available!</div>
		</div>`;
		if (!scanned) {
			message = `<div style="display: flex; flex-direction: column; align-items: center;">
				<div style="font-size: 16px; font-style: italic;">Scan revoked</div>
			</div>`;
		}

		// Send to chat

		game.tagHandler.createChatMessage(message, this);
	}

	/**
	 * Get a string reflecting whether this actor is scanned or not
	 * @returns str
	 */
	async getScanText() {
		if (await this.getFlag("fathomlessgears", "scanned")) {
			return game.i18n.localize("SHEET.scantrue");
		} else {
			return game.i18n.localize("SHEET.scanfalse");
		}
	}

	/**
	 * Declare a scan action
	 * @returns False if this action is invalid (this actor is a fish or there are no targeted actors)
	 */
	async scanTarget() {
		if (this.type == ACTOR_TYPES.fish) return false;
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			//TODO allow choosing target afterwards
			ui.notifications.info(game.i18n.localize("MESSAGE.scannotarget"));
			return false;
		} else {
			const target = targetSet.values().next().value;
			const content = `<p class="message-text-only">${game.i18n.localize("MESSAGE.scantarget").replace("_ACTOR_NAME_", this.name).replace("_TARGET_NAME_", target.name)}</p>`;
			game.tagHandler.createChatMessage(content, this);
		}
	}

	updateDefaultTokenSize(size) {
		this.update({
			"prototypeToken.height": size,
			"prototypeToken.width": size
		});
	}

	firstOwner() {
		const playerOwners = Object.entries(this.ownership)
			.filter(
				([id, level]) =>
					!game.users.get(id)?.isGM &&
					game.users.get(id)?.active &&
					level === 3
			)
			.map(([id, _level]) => id);

		if (playerOwners.length > 0) {
			return game.users.get(playerOwners[0]);
		}

		/* if no online player owns this actor, fall back to first GM */
		return game.users.activeGM;
	}
}
