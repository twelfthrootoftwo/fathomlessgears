import {Utils} from "../utilities/utils.js";
import {ACTOR_TYPES, ATTRIBUTES, HIT_TYPE, COVER_STATES} from "../constants.js";

export class AttackHandler {
	static async rollToHit(rollParams, defender) {
		const attackRoll = Utils.getRoller(
			rollParams.dieTotal,
			rollParams.flatTotal
		);
		await attackRoll.evaluate();
		const hitResult = AttackHandler.determineHitMargin(
			attackRoll,
			defender.attributesWithConditions[rollParams.defenceKey],
			AttackHandler.canCrit(rollParams.attribute),
			rollParams.cover
		);

		let locationResult = null;
		if (AttackHandler.requiresLocationDisplay(rollParams, hitResult)) {
			locationResult = await AttackHandler.rollHitLocation(defender);
		}

		const rollOutput = {};
		rollOutput.text = await AttackHandler.createHitRollMessage(
			rollParams,
			attackRoll,
			defender,
			hitResult,
			locationResult
		);
		rollOutput.result = hitResult.upgraded
			? hitResult.upgraded
			: hitResult.original;
		return rollOutput;
	}

	static determineHitMargin(attackRoll, defenceAttr, canCrit, cover) {
		const defenceVal = defenceAttr.total + defenceAttr.values.custom;
		const modifiedDefence = AttackHandler.applyCover(defenceVal, cover);
		const hitMargin = attackRoll.total - modifiedDefence;
		const combinedResult = {original: "", upgraded: null};

		if (hitMargin >= 5 && canCrit) {
			combinedResult.original = HIT_TYPE.crit;
		} else if (hitMargin >= 0) {
			combinedResult.original = HIT_TYPE.hit;
		} else {
			combinedResult.original = HIT_TYPE.miss;
		}
		if (AttackHandler.upgradeRoll(attackRoll)) {
			let upgradeResult = "";
			if (canCrit) upgradeResult = HIT_TYPE.crit;
			else upgradeResult = HIT_TYPE.hit;
			if (upgradeResult != combinedResult.original) {
				combinedResult.upgraded = upgradeResult;
			}
		}
		return combinedResult;
	}

	static async createHitRollMessage(
		rollParams,
		attackRoll,
		defender,
		hitResult,
		locationResult
	) {
		const displayString = [];
		//Intro
		const introductionMessage = game.i18n
			.localize("ROLLTEXT.attackHeader")
			.replace("_ATTACKER_NAME_", rollParams.actor.name)
			.replace("_TARGET_NAME_", defender.name)
			.replace("_COVER_TEXT_", getCoverText(rollParams.cover));
		const introductionHtml = `<div class="attack-target">${introductionMessage}</div>`;
		displayString.push(introductionHtml);

		const hitRollMessage = await AttackHandler.hitRollText(
			attackRoll,
			hitResult,
			locationResult,
			rollParams.getDisplayModifierStack()
		);
		displayString.push(hitRollMessage);
		return displayString.join("");
	}

	static async hitRollText(
		attackRoll,
		hitResult,
		locationResult,
		modifierStack
	) {
		const displayString = [];
		//To hit
		let hitResultText = "";
		if (hitResult.upgraded) {
			hitResultText =
				"<s>" +
				game.i18n.localize("HIT." + hitResult.original) +
				"</s> " +
				game.i18n.localize("HIT." + hitResult.upgraded);
		} else {
			hitResultText = game.i18n.localize("HIT." + hitResult.original);
		}

		let collapsibleRollInfo = {
			parts: attackRoll.dice.map((d) => d.getTooltipData()),
			formula: attackRoll.formula,
			total: attackRoll.total
		};
		const hitRollDisplay = await renderTemplate(
			"systems/fathomlessgears/templates/partials/to-hit-partial.html",
			{
				modifiers: modifierStack,
				collapsibleRollInfo: collapsibleRollInfo,
				outcome: hitResultText
			}
		);

		displayString.push(hitRollDisplay);

		if (locationResult != null) {
			const locationDisplay =
				await AttackHandler.generateLocationDisplay(locationResult);
			displayString.push(locationDisplay);
		} else if (
			hitResult.original === HIT_TYPE.crit ||
			hitResult.upgraded === HIT_TYPE.crit
		) {
			displayString.push(`<p>${game.i18n.localize("MESSAGE.crit")}</p>`);
		}
		return displayString.join("");
	}

	static canCrit(attackKey) {
		return attackKey != ATTRIBUTES.mental;
	}

	static async rollHitLocation(defender) {
		const hitZoneInfo = defender.items.get(defender.system.gridType);
		if (!hitZoneInfo) {
			game.tagHandler.createChatMessage(
				defender.name + " has no grid type assigned!",
				defender
			);
			return false;
		}
		const formula = hitZoneInfo.system.hitLocationRoll
			? hitZoneInfo.system.hitLocationRoll
			: "1";
		const locationRoll = new Roll(formula);
		await locationRoll.evaluate();

		const hitZone = hitZoneInfo.system.hitRegions.find((location) => {
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
		let zoneRoll = null;
		if (locationResult.locationRoll.formula !== "1") {
			zoneRoll = {};
			zoneRoll.roll = {
				parts: locationResult.locationRoll.dice.map((d) =>
					d.getTooltipData()
				),
				formula: locationResult.locationRoll.formula,
				total: locationResult.locationRoll.total
			};
			zoneRoll.label = game.i18n.localize("ROLLTEXT.hitZone");
			zoneRoll.name = Utils.getLocalisedHitZone(
				locationResult.hitZone.location
			);
		}
		const columnRoll = {
			roll: {
				parts: locationResult.columnRoll.dice.map((d) =>
					d.getTooltipData()
				),
				formula: locationResult.columnRoll.formula,
				total: locationResult.columnRoll.total
			},
			label: game.i18n.localize("ROLLTEXT.hitColumn")
		};
		const result = await renderTemplate(
			"systems/fathomlessgears/templates/partials/location-roll.html",
			{
				zoneRoll: zoneRoll,
				columnRoll: columnRoll
			}
		);
		return result;
	}

	static upgradeRoll(rollResult) {
		//Extract d6 terms from list of terms
		const diceResults = [];
		rollResult.terms.forEach((term) => {
			if (term.faces && term.faces === 6) {
				diceResults.push(term);
			}
		});

		//Count 6s
		let counter = 0;
		diceResults.forEach((term) => {
			term.results.forEach((die) => {
				if (die.result === 6) counter += 1;
			});
		});

		return counter > 1;
	}

	static requiresLocationDisplay(rollParams, hitResult) {
		if (rollParams.hideHitLocation) return false;
		if (rollParams.attribute == ATTRIBUTES.mental) return false;
		if (hitResult.upgraded) {
			return (
				hitResult.upgraded === HIT_TYPE.hit ||
				(hitResult.upgraded === HIT_TYPE.crit &&
					rollParams.actor.type === ACTOR_TYPES.fish)
			);
		} else {
			return (
				hitResult.original === HIT_TYPE.hit ||
				(hitResult.original === HIT_TYPE.crit &&
					rollParams.actor.type === ACTOR_TYPES.fish)
			);
		}
	}

	static applyCover(defenceVal, cover) {
		switch (cover) {
			case COVER_STATES.none:
				return defenceVal;
			case COVER_STATES.soft:
				return defenceVal + 2;
			case COVER_STATES.hard:
				return defenceVal + 4;
			default:
				return defenceVal;
		}
	}
}

function getCoverText(cover) {
	switch (cover) {
		case COVER_STATES.none:
			return "";
		case COVER_STATES.soft:
			return game.i18n.localize("ROLLTEXT.softcover");
		case COVER_STATES.hard:
			return game.i18n.localize("ROLLTEXT.hardcover");
		default:
			return "";
	}
}
