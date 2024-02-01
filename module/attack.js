import {Utils} from "./utils.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE} from "./constants.js";

export class AttackHandler {
	static async rollToHit(
		attacker,
		attackKey,
		defender,
		defenceKey,
		dieCount,
		dieSize
	) {
		const attackRoll = attacker.getAttributeRoller(
			attackKey,
			dieCount,
			dieSize
		);
		await attackRoll.evaluate();
		const hitResult = AttackHandler.determineHitMargin(
			attackRoll,
			defender.system.attributes.flat[defenceKey].value,
			AttackHandler.canCrit(attacker)
		);

		const attackAttrLabel = game.i18n.localize(
			Utils.getLocalisedAttributeLabel(attackKey)
		);
		AttackHandler.createHitRollMessage(
			attackRoll,
			attacker,
			defender,
			attackAttrLabel,
			hitResult
		);
	}

	static determineHitMargin(attackRoll, defenceVal, canCrit) {
		const hitMargin = attackRoll.total - defenceVal;

		if (hitMargin >= 5 && canCrit) {
			return HIT_TYPE.crit;
		} else if (hitMargin >= 0) {
			return HIT_TYPE.hit;
		} else {
			return HIT_TYPE.miss;
		}
	}

	static async createHitRollMessage(
		attackRoll,
		attacker,
		defender,
		attackAttrLabel,
		hitResult
	) {
		//Intro
		const introductionMessage = game.i18n
			.localize("ROLLTEXT.attackIntro")
			.replace("_ATTRIBUTE_NAME_", attackAttrLabel)
			.replace("_TARGET_NAME_", defender.name);

		//To hit
		const hitRollDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/roll-partial.html",
			{
				flavor: introductionMessage,
				formula: attackRoll.formula,
				total: attackRoll.total,
			}
		);

		const successDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/target-dc-partial.html",
			{
				result: game.i18n.localize(
					Utils.getLocalisedHitType(hitResult)
				),
			}
		);

		const displayString = [hitRollDisplay, successDisplay].join("<br>");

		const hitMessage = ChatMessage.create({
			speaker: {actor: attacker},
			content: displayString,
		});
	}

	static canCrit(attacker) {
		return attacker.type === ACTOR_TYPES.fisher;
	}
}
