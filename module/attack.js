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

		let locationResult = null;
		if (hasLocationRoll(defender) && hitResult === HIT_TYPE.hit) {
			locationResult = rollHitLocation(defender);
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
		hitResult
	) {
		const displayString = [];
		//Intro
		const introductionMessage = game.i18n
			.localize("ROLLTEXT.attackIntro")
			.replace("_ATTRIBUTE_NAME_", attackAttrLabel)
			.replace("_TARGET_NAME_", defender.name);
		displayString.push(introductionMessage);

		//To hit
		const hitRollDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/roll-partial.html",
			{
				flavor: introductionMessage,
				formula: attackRoll.formula,
				total: attackRoll.total,
			}
		);
		displayString.push(hitRollDisplay);

		const successDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/target-dc-partial.html",
			{
				result: game.i18n.localize(
					Utils.getLocalisedHitType(hitResult)
				),
			}
		);
		displayString.push(successDisplay);

		if (hitResult === HIT_TYPE.hit) {
			const locationDisplay = await generateLocationDisplay(
				locationResult
			);
			displayString.push(hitRollDisplay);
		}

		const hitMessage = ChatMessage.create({
			speaker: {actor: attacker},
			content: displayString.join("<br>"),
		});
	}

	static canCrit(attacker) {
		return attacker.type === ACTOR_TYPES.fisher;
	}

	static async rollHitLocation(defender) {
		const locationRoll = new Roll();
		locationRoll.formula = defender.size.hitLocationRoll
			? defender.size.hitLocationRoll
			: "1";
		await locationRoll.evaluate();

		const location = defender.size.hitRegions.find((location) => {
			locationRoll.total >= location.range[0] &&
				locationRoll.total <= location.range[-1];
		});

		const columnRoll = new Roll();
		columnRoll.formula = "1d" + location.columns.toString();
		await columnRoll.evaluate();

		return locationRoll, location, columnRoll;
	}

	static async generateLocationDisplay(locationResult) {
		const locationDisplayParts = [];
		if (locationResult.locationRoll.formula !== "1") {
			const hitZone = await renderTemplate(
				"systems/hooklineandmecha/templates/partials/target-dc-partial.html",
				{
					result: game.i18n.localize(
						Utils.getLocalisedHitType(hitResult)
					),
				}
			);
			locationDisplayParts.push(hitZone);
		}
		const column = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/target-dc-partial.html",
			{
				result: game.i18n.localize(
					Utils.getLocalisedHitType(hitResult)
				),
			}
		);
		locationDisplayParts.push(column);
		return locationDisplayParts.join("<br>");
	}
}
