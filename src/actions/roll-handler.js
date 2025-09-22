import {RollElement, RollDialog} from "../dialogs/roll-dialog.js";
import {ReelHandler} from "./reel.js";
import {constructCollapsibleRollMessage} from "./collapsible-roll.js";
import {
	ATTRIBUTES,
	ROLL_MODIFIER_TYPE,
	HIT_TYPE,
	NARRATIVE_DIFFICULTY,
	NARRATIVE_STATE
} from "../constants.js";
import {AttackHandler} from "./attack.js";
import {Utils} from "../utilities/utils.js";
import {actionText} from "./basic-action-data.js";

export class RollHandler {
	isTargetedRoll(attributeKey) {
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(attributeKey))
			return ATTRIBUTES.evasion;
		if (attributeKey === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
		if (attributeKey === ATTRIBUTES.power) return ATTRIBUTES.power;
		return false;
	}

	startRollDialog(actor, attributeKey, internalId, actionCode) {
		const modifiers = [];
		const attribute = actor.attributesWithConditions[attributeKey];
		modifiers.push(
			new RollElement(
				attribute.values.standard.base,
				ROLL_MODIFIER_TYPE.flat,
				"Frame base",
				ROLL_MODIFIER_TYPE.modifier
			)
		);
		attribute.values.standard.additions.forEach((term) => {
			modifiers.push(
				RollElement.attributeElementToRollElement(
					term,
					actor,
					ROLL_MODIFIER_TYPE.modifier
				)
			);
		});
		attribute.values.bonus.forEach((term) => {
			modifiers.push(
				RollElement.attributeElementToRollElement(
					term,
					actor,
					ROLL_MODIFIER_TYPE.bonus
				)
			);
		});
		if (attribute.values.custom != 0) {
			modifiers.push(
				new RollElement(
					attribute.values.custom,
					ROLL_MODIFIER_TYPE.flat,
					"Custom modifier (bonus)",
					ROLL_MODIFIER_TYPE.bonus
				)
			);
		}
		return new RollDialog(
			modifiers,
			actor,
			attributeKey,
			internalId,
			actionCode
		);
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {ATTRIBUTES} attributeKey: The string key of the attribute
	 * @param {int} dieCount: The total number of dice to roll
	 * @param {int} flatModifier : The total modifier to add to the roll
	 */
	async rollAttribute(rollParams) {
		let message = "";
		if (rollParams.defenceKey === ATTRIBUTES.power) {
			message = await this.initiateReel(rollParams);
		} else if (rollParams.actionCode) {
			this.basicAction(rollParams);
		} else if (rollParams.defenceKey) {
			const output = await this.rollTargeted(rollParams);
			message = output.text ? output.text : output;
		} else {
			const result = await this.rollNoTarget(rollParams);
			message = result.text;
		}
		game.tagHandler.createChatMessage(message, rollParams.actor);
	}

	async rollTargeted(rollParams) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result = await this.rollNoTarget(rollParams);
			return result;
		} else {
			const target = targetSet.values().next().value;
			return await AttackHandler.rollToHit(rollParams, target.actor);
		}
	}

	async initiateReel(rollParams) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result = await this.rollNoTarget(rollParams);
			return result.text;
		} else {
			const target = targetSet.values().next().value;
			return await ReelHandler.reel(rollParams, target);
		}
	}

	async rollNoTarget(rollParams) {
		let roll = Utils.getRoller(rollParams.dieTotal, rollParams.flatTotal);
		await roll.evaluate();

		var label = game.i18n.localize("ROLLTEXT.base");
		if (rollParams.attribute) {
			label = label.replace(
				"_ATTRIBUTE_NAME_",
				Utils.getLocalisedAttributeLabel(rollParams.attribute)
			);
		} else {
			label = label.replace("_ATTRIBUTE_NAME_", roll.formula);
		}

		const hitRollDisplay = await renderTemplate(
			"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
			{
				label_left: label,
				total: await constructCollapsibleRollMessage(roll),
				preformat: true,
				modifiers: rollParams.getDisplayModifierStack()
			}
		);
		return {text: hitRollDisplay, result: null};
	}

	static addRollHandler() {
		game.rollHandler = new RollHandler();
	}

	async basicAction(rollParams) {
		if (rollParams.actionCode != "bash") {
			rollParams.hideHitLocation = true;
		}
		const output = await this.rollTargeted(rollParams);
		let rollText = output.text;
		let heading = "";
		let minorText = "";
		let ap = 0;
		switch (rollParams.actionCode) {
			case "bash": {
				heading = "Bash";
				ap = 2;
				if (output.result != HIT_TYPE.miss) {
					const actorGrid = await rollParams.actor.items.get(
						rollParams.actor.system.gridType
					);
					const damageText = await renderTemplate(
						"systems/fathomlessgears/templates/partials/damage-partial.html",
						{
							text: game.i18n.localize("INTERNALS.damage"),
							damageVal: actorGrid.system.bashDamage,
							damageType: "damage"
						}
					);
					rollText = rollText.concat(damageText);
				}
				break;
			}
			case "threatDisplay": {
				heading = "Threat Display";
				ap = 2;
				if (output.result != HIT_TYPE.miss) {
					const actorGrid = await rollParams.actor.items.get(
						rollParams.actor.system.gridType
					);
					const damageText = await renderTemplate(
						"systems/fathomlessgears/templates/partials/damage-partial.html",
						{
							text: game.i18n.localize("INTERNALS.marbles"),
							damageVal: actorGrid.system.threatDisplayMarbles,
							damageType: "marbles"
						}
					);
					rollText = rollText.concat(damageText);
				}
				break;
			}
			case "wrangle":
			case "push":
			case "intimidate": {
				const details = actionText[rollParams.actionCode];
				heading = details.name;
				minorText = details.text;
				ap = details.ap;
				break;
			}
		}

		const messageText = await renderTemplate(
			"systems/fathomlessgears/templates/messages/message-outline.html",
			{
				heading: heading,
				minor_text: minorText,
				body: rollText,
				ap: ap
			}
		);

		game.tagHandler.createChatMessage(messageText, rollParams.actor);
	}

	goodEnoughThreshold(difficulty) {
		let value = false;
		switch (difficulty) {
			case NARRATIVE_DIFFICULTY.easy:
				value = 1;
				break;
			case NARRATIVE_DIFFICULTY.challenging:
				value = 2;
				break;
			case NARRATIVE_DIFFICULTY.hard:
				value = 3;
				break;
			case NARRATIVE_DIFFICULTY.impossible:
				value = 5;
				break;
			default:
				break;
		}
		return value;
	}

	fullSuccessThreshold(difficulty) {
		let value = false;
		switch (difficulty) {
			case NARRATIVE_DIFFICULTY.easy:
				value = 2;
				break;
			case NARRATIVE_DIFFICULTY.challenging:
				value = 3;
				break;
			case NARRATIVE_DIFFICULTY.hard:
				value = 5;
				break;
			case NARRATIVE_DIFFICULTY.impossible:
				value = 7;
				break;
			default:
				break;
		}
		return value;
	}

	getNarrativeSuccess(dieResult) {
		if (dieResult == 1) {
			return -1;
		} else if (dieResult == 6) {
			return 2;
		} else if (dieResult >= 4) {
			return 1;
		}
		return 0;
	}

	countNarrativeSuccesses(roll) {
		let successes = 0;
		roll.dice[0].results.forEach((die) => {
			successes += this.getNarrativeSuccess(die.result);
		});
		return successes;
	}

	async rollNarrative(rollParams, reroll) {
		console.log(
			`Rolling narrative with ${rollParams.modifierStack.length} labels (${rollParams.dieTotal} dice)`
		);
		let roll = Utils.getRoller(rollParams.dieTotal, 0);
		await roll.evaluate();
		const successes = this.countNarrativeSuccesses(roll);
		let state = null;
		if (rollParams.difficulty != NARRATIVE_DIFFICULTY.none) {
			if (successes > this.fullSuccessThreshold(rollParams.difficulty)) {
				state = NARRATIVE_STATE.full_success;
			} else if (
				successes > this.goodEnoughThreshold(rollParams.difficulty)
			) {
				state = NARRATIVE_STATE.good_enough;
			} else {
				state = NARRATIVE_STATE.failure;
			}
		}

		const displayString = [];

		const introductionMessage = game.i18n
			.localize("ROLLTEXT.narrativeHeader")
			.replace("_FISHER_NAME_", rollParams.actor.name);
		const introductionHtml = `<div class="attack-target">${introductionMessage}</div>`;
		displayString.push(introductionHtml);
		console.log(roll.dice[0]);
		const diceDisplay = await renderTemplate(
			"systems/fathomlessgears/templates/partials/narrative-dice-partial.html",
			{
				dice: roll.dice[0]
			}
		);
		displayString.push(diceDisplay);

		const resultDisplay = await renderTemplate(
			"systems/fathomlessgears/templates/partials/narrative-result-partial.html",
			{
				result: state,
				rerollStatus: reroll
			}
		);
		displayString.push(resultDisplay);

		displayString.join("");

		const messageText = await renderTemplate(
			"systems/fathomlessgears/templates/messages/message-outline.html",
			{
				body: displayString
			}
		);

		game.tagHandler.createChatMessage(messageText, rollParams.actor);
	}
}
