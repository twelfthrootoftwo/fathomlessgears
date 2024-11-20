import { RollElement, RollDialog } from "./roll-dialog.js";
import { ReelHandler } from "./reel.js";
import {constructCollapsibleRollMessage} from "./collapsible-roll.js"
import {ATTRIBUTES,ROLL_MODIFIER_TYPE} from "../constants.js";
import {AttackHandler} from "./attack.js";
import {Utils} from "../utilities/utils.js";

export class RollHandler {
    isTargetedRoll(attributeKey) {
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(attributeKey))
			return ATTRIBUTES.evasion;
		if (attributeKey === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
		if (attributeKey===ATTRIBUTES.power) return ATTRIBUTES.power;
		return false;
	}

	startRollDialog(actor, attributeKey,internalId) {
		const modifiers=[];
		const attribute=actor.system.attributes[attributeKey];
		modifiers.push(new RollElement(
			attribute.values.standard.base,
			ROLL_MODIFIER_TYPE.flat,
			"Frame base",
			ROLL_MODIFIER_TYPE.modifier,
		));
		attribute.values.standard.additions.forEach((term) => {
			modifiers.push(RollElement.attributeElementToRollElement(term,actor,ROLL_MODIFIER_TYPE.modifier))
		});
		attribute.values.bonus.forEach((term) => {
			modifiers.push(RollElement.attributeElementToRollElement(term,actor,ROLL_MODIFIER_TYPE.bonus))
		});
		if(attribute.values.custom!=0) {
			modifiers.push(new RollElement(
				attribute.values.custom,
				ROLL_MODIFIER_TYPE.flat,
				"Custom modifier (bonus)",
				ROLL_MODIFIER_TYPE.bonus
			));
		}
		return new RollDialog(modifiers, actor, attributeKey,internalId);
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {ATTRIBUTES} attributeKey: The string key of the attribute
	 * @param {int} dieCount: The total number of dice to roll
	 * @param {int} flatModifier : The total modifier to add to the roll
	 */
    async rollAttribute(actor, attributeKey, dieCount, flatModifier,cover,modifierStack) {
		const defenceKey = this.isTargetedRoll(attributeKey);
		let message="";
		if(defenceKey===ATTRIBUTES.power) {
			message=await this.initiateReel(actor, dieCount, flatModifier,modifierStack);
		} else if (defenceKey) {
			const output=await this.rollTargeted(actor, attributeKey, defenceKey, dieCount, flatModifier,cover,modifierStack);
			message=output.text ? output.text : output;
		} else {
			const result=await this.rollNoTarget(attributeKey, dieCount, flatModifier,modifierStack);
			message=result.text;
		}
		const hitMessage = await ChatMessage.create({
			speaker: {actor: actor},
			content: message,
		});
	}


	async rollTargeted(actor, attackKey, defenceKey, dieCount, flatModifier,cover,modifierStack) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result= await this.rollNoTarget(attackKey, dieCount, flatModifier,modifierStack);
			return result;
		} else {
			const target = targetSet.values().next().value;
			return await AttackHandler.rollToHit(
				actor,
				attackKey,
				target.actor,
				defenceKey,
				dieCount,
				flatModifier,
				cover,
				modifierStack
			);
		}
	}

	async initiateReel(actor, dieCount, flatModifier,modifierStack) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result= await this.rollNoTarget(ATTRIBUTES.power, dieCount, flatModifier,modifierStack);
			return result.text;
		} else {
			const target = targetSet.values().next().value;
			return await ReelHandler.reel(
				actor,
				target.actor,
				dieCount,
				flatModifier,
				modifierStack
			);
		}
	}

	async rollNoTarget(attributeKey, dieCount, flatModifier,modifierStack) {
		let roll = Utils.getRoller(dieCount, flatModifier);
		await roll.evaluate();

		var label = game.i18n.localize("ROLLTEXT.base");
		if (attributeKey) {
			label=label.replace("_ATTRIBUTE_NAME_", Utils.getLocalisedAttributeLabel(attributeKey));
		} else {
			label=label.replace("_ATTRIBUTE_NAME_", roll.formula);
		}

		const hitRollDisplay = await renderTemplate(
			"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
			{
				label_left: label,
				total: await constructCollapsibleRollMessage(roll),
				preformat: true,
				modifiers: modifierStack
			}
		);
		return {text: hitRollDisplay, result: null};
	}

	static addRollHandler() {
		game.rollHandler = new RollHandler();
	};
}

