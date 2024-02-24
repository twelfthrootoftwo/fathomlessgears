import {Utils} from "../utilities/utils.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE} from "../constants.js";

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

		let locationResult = null;
		if (hitResult === HIT_TYPE.hit) {
			locationResult = await AttackHandler.rollHitLocation(defender);
		}

		const attackAttrLabel = game.i18n.localize(
			Utils.getLocalisedAttributeLabel(attackKey)
		);
		AttackHandler.createHitRollMessage(
			attackRoll,
			attacker,
			defender,
			attackAttrLabel,
			hitResult,
			locationResult
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
		hitResult,
		locationResult
	) {
		const displayString = [];
		//Intro
		const introductionMessage = game.i18n
			.localize("ROLLTEXT.attackHeader")
			.replace("_ATTACKER_NAME_", attacker.name)
			.replace("_TARGET_NAME_", defender.name);
		const introductionHtml=`<div class="message-header">${introductionMessage}</div>`
		displayString.push(introductionHtml);

		//To hit
		const hitRollDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/labelled-roll-partial.html",
			{
				label_left: game.i18n
				.localize("ROLLTEXT.attackIntro")
				.replace("_ATTRIBUTE_NAME_", attackAttrLabel),
				total: attackRoll.total,
				tooltip: `${attackRoll.formula}:  ${attackRoll.result}`,
				outcome: game.i18n.localize("HIT."+hitResult),
			}
		);
		displayString.push(hitRollDisplay);

		if (hitResult === HIT_TYPE.hit) {
			const locationDisplay = await AttackHandler.generateLocationDisplay(
				locationResult
			);
			displayString.push(locationDisplay);
		}

		const hitMessage = await ChatMessage.create({
			speaker: {actor: attacker},
			content: displayString.join(""),
		});
	}

	static canCrit(actor) {
		return actor.type === ACTOR_TYPES.fisher;
	}

	static async rollHitLocation(defender) {
		const formula = defender.npcSize.hitLocationRoll
			? defender.npcSize.hitLocationRoll
			: "1";
		const locationRoll = new Roll(formula);
		await locationRoll.evaluate();

		const hitZone = defender.npcSize.hitRegions.find((location) => {
			return AttackHandler.checkHitZone(locationRoll, location);
		});

		const columnRoll = new Roll("1d" + hitZone.columns.toString());
		await columnRoll.evaluate();

		return {locationRoll, hitZone, columnRoll};
	}

	static checkHitZone(locationRoll, hitZone) {
		return (
			locationRoll.total >= hitZone.range.at(0) &&
			locationRoll.total <= hitZone.range.at(-1)
		);
	}

	static async generateLocationDisplay(locationResult) {
		const locationDisplayParts = [];
		if (locationResult.locationRoll.formula !== "1") {
			let hitZone = await renderTemplate(
				"systems/hooklineandmecha/templates/partials/labelled-roll-partial.html",
				{
					label_left: game.i18n.localize("ROLLTEXT.hitZone"),
					tooltip: `${locationResult.locationRoll.formula}:  ${locationResult.locationRoll.result}`,
					total: locationResult.locationRoll.total,
					outcome: Utils.getLocalisedHitZone(
						locationResult.hitZone.location)
				}
			);
			locationDisplayParts.push(hitZone);
		}
		const column = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/labelled-roll-partial.html",
			{
				label_left: game.i18n.localize("ROLLTEXT.hitColumn"),
				tooltip: locationResult.columnRoll.formula,
				total: locationResult.columnRoll.total,
			}
		);
		locationDisplayParts.push(column);
		return locationDisplayParts.join("");
	}
}
