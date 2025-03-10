import {RollElement, RollDialog} from "./roll-dialog.js";
import {ReelHandler} from "./reel.js";
import {constructCollapsibleRollMessage} from "./collapsible-roll.js";
import {ATTRIBUTES, ROLL_MODIFIER_TYPE, HIT_TYPE} from "../constants.js";
import {AttackHandler} from "./attack.js";
import {Utils} from "../utilities/utils.js";

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
		const attribute = actor.system.attributes[attributeKey];
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
		console.log("Basic action function");
		const output = await this.rollTargeted(rollParams);
		let rollText = output.text;
		let heading = "";
		let minorText = "";
		switch (rollParams.actionCode) {
			case "bash": {
				heading = "Bash";
				if (output.result != HIT_TYPE.miss) {
					const actorGrid = await rollParams.actor.items.get(
						rollParams.actor.system.gridType
					);
					const damageText = await renderTemplate(
						"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
						{
							label_left: game.i18n.localize("INTERNALS.damage"),
							total: actorGrid.system.bashDamage,
							outcome: ""
						}
					);
					rollText = rollText.concat(damageText);
				}
				break;
			}
			case "threatDisplay": {
				heading = "Threat Display";
				if (output.result != HIT_TYPE.miss) {
					const actorGrid = await rollParams.actor.items.get(
						rollParams.actor.system.gridType
					);
					const damageText = await renderTemplate(
						"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
						{
							label_left: game.i18n.localize("INTERNALS.marbles"),
							total: actorGrid.system.threatDisplayMarbles,
							outcome: ""
						}
					);
					rollText = rollText.concat(damageText);
				}
				break;
			}
			case "wrangle":
				heading = "Wrangle";
				minorText = game.sensitiveActionHandler.getActionText(
					rollParams.actionCode
				);
				break;
			case "push":
				heading = "Push";
				minorText = game.sensitiveActionHandler.getActionText(
					rollParams.actionCode
				);
				break;
			case "intimidate":
				heading = "Intimidate";
				minorText = game.sensitiveActionHandler.getActionText(
					rollParams.actionCode
				);
				break;
		}

		const messageText = await renderTemplate(
			"systems/fathomlessgears/templates/messages/message-outline.html",
			{
				heading: heading,
				minor_text: minorText,
				body: rollText
			}
		);

		game.tagHandler.createChatMessage(messageText, rollParams.actor);
	}
}
