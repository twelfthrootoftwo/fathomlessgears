import {Utils} from "./utils.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class HLMActor extends Actor {
	/** @inheritdoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.system.weightClass = WeightClass.evaluateWeightClass(
			this.system.attributes.flat.weight.value,
			0
		);
	}

	/* -------------------------------------------- */

	/**
	 * Is this Actor used as a template for other Actors?
	 * @type {boolean}
	 */
	get isTemplate() {
		return !!this.getFlag("hooklineandmecha", "isTemplate");
	}

	static isTargetedRoll(attributeKey) {
		if (["close", "far"].includes(attributeKey)) return "evade";
		if (attributeKey === "mental") return "willpower";
		return false;
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {*} attributeKey: The string key of the attribute
	 * @param {*} dieCount: The number of dice to roll
	 * @param {*} dieSize : The size of dice to roll
	 */
	async rollAttribute(attributeKey, dieCount, dieSize) {
		const defenceKey = HLMActor.isTargetedRoll(attributeKey);
		if (defenceKey) {
			this.rollTargeted(attributeKey, defenceKey, dieCount, dieSize);
		} else {
			this.rollNoTarget(attributeKey, dieCount, dieSize);
		}
	}

	getAttributeRoller(attributeKey, dieCount, dieSize) {
		var formula = new Roll();
		if (attributeKey) {
			const rollAttribute = this.system.attributes.rolled[attributeKey];
			formula =
				dieCount + "d" + dieSize + "+" + rollAttribute.value.toString();
		} else {
			formula = dieCount + "d" + dieSize;
		}

		return new Roll(formula);
	}

	/**
	 * Send this actor's flat attributes to the chat log
	 */
	shareFlatAttributes() {
		ChatMessage.create({
			speaker: {actor: this},
			content: this.getFlatAttributeString(),
		});
	}

	getFlatAttributeString() {
		const attrStrings = [];
		for (const attribute in this.system.attributes.flat) {
			const attr = this.system.attributes.flat[attribute];
			attrStrings.push(attr.label + ": " + attr.value.toString());
		}
		return attrStrings.join("<br>");
	}

	async rollTargeted(attackKey, defenceKey, dieCount, dieSize) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			this.rollNoTarget(attackKey, dieCount, dieSize);
		} else {
			const target = targetSet.values().next().value;
			target.actor.rollToHit(
				this,
				attackKey,
				defenceKey,
				dieCount,
				dieSize
			);
		}
	}

	async rollNoTarget(attributeKey, dieCount, dieSize) {
		var label = "";
		if (attributeKey) {
			label =
				"Rolling " +
				Utils.getLocalisedAttributeLabel(attributeKey) +
				":";
		} else {
			label = "Rolling " + formula + ":";
		}

		let roll = this.getAttributeRoller(attributeKey, dieCount, dieSize);
		await roll.evaluate();
		roll.toMessage({
			speaker: ChatMessage.getSpeaker({actor: this.actor}),
			flavor: label,
		});
	}

	async rollToHit(attacker, attackKey, defenceKey, dieCount, dieSize) {
		const attackRoll = attacker.getAttributeRoller(
			attackKey,
			dieCount,
			dieSize
		);
		await attackRoll.evaluate();
		let hitResult = "";
		const hitMargin =
			attackRoll.total - this.system.attributes.flat[defenceKey].value;

		if (hitMargin >= 5 && attacker.type == "fisher") {
			hitResult = "crit";
		} else if (hitMargin >= 0) {
			hitResult = "hit";
		} else {
			hitResult = "miss";
		}
		const attackAttrLabel = this.system.attributes.rolled[attackKey].label;
		this.createHitRollMessage(
			attackRoll,
			attacker,
			attackAttrLabel,
			hitResult
		);
	}

	async createHitRollMessage(
		attackRoll,
		attacker,
		attackAttrLabel,
		hitResult
	) {
		//Intro
		const introductionMessage = game.i18n
			.localize("ROLLTEXT.attackIntro")
			.replace("_ATTRIBUTE_NAME_", attackAttrLabel)
			.replace("_TARGET_NAME_", this.name);

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
				result: hitResult,
			}
		);

		const displayString = [hitRollDisplay, successDisplay].join("<br>");

		const hitMessage = ChatMessage.create({
			speaker: {actor: attacker},
			content: displayString,
		});
	}
}

export class WeightClass {
	static maxClass = 4;
	static minClass = 0;
	constructor(value) {
		if (value < WeightClass.minClass || value > WeightClass.maxClass) {
			throw new Error(
				`WeightClass value must be between ${WeightClass.minClass.toString()} and ${WeightClass.maxClass.toString()} (received ${value.toString()})`
			);
		}
		this.value = value;
		switch (value) {
			case 4:
				this.label = game.i18n.localize("WEIGHT.ultraLight");
				break;
			case 3:
				this.label = game.i18n.localize("WEIGHT.light");
				break;
			case 2:
				this.label = game.i18n.localize("WEIGHT.medium");
				break;
			case 1:
				this.label = game.i18n.localize("WEIGHT.heavy");
				break;
			case 0:
				this.label = game.i18n.localize("WEIGHT.ultraHeavy");
				break;
		}
	}
	static evaluateWeightClass(weight, shift) {
		var baseWeightClass;
		if (weight < 11) {
			baseWeightClass = 3;
		} else if (weight < 21) {
			baseWeightClass = 2;
		} else {
			baseWeightClass = 1;
		}

		var weightClass = baseWeightClass + shift;
		weightClass =
			weightClass < WeightClass.minClass
				? WeightClass.minClass
				: weightClass;
		weightClass =
			weightClass > WeightClass.maxClass
				? WeightClass.maxClass
				: weightClass;
		console.log("Calculated weight: " + weightClass.toString());

		return new WeightClass(weightClass);
	}
}
