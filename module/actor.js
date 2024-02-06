import {Utils} from "./utils.js";
import {AttackHandler} from "./attack.js";
import {FishDataHandler} from "./npcType.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE} from "./constants.js";

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
		this.setNPCSize(this.system.size);
		if(this.system.fishType) {
			this.setNPCType(this.system.fishType);
		}
		this._getAttributeLabels();
		if (this.system.resources) {
			this._getResourceLabels();
		}
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
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(attributeKey))
			return ATTRIBUTES.evade;
		if (attributeKey === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
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
	async shareFlatAttributes() {
		const content=await this.getFlatAttributeChatMessage();
		console.log(content);
		ChatMessage.create({
			speaker: {actor: this},
			content: content,
		});
	}

	getFlatAttributeString() {
		const attrStrings = [];
		for (const attribute in this.system.attributes.flat) {
			const attr = this.system.attributes.flat[attribute];
			attrStrings.push(
				Utils.getLocalisedAttributeLabel(attribute) +
					": " +
					attr.value.toString()
			);
		}
		return attrStrings.join("<br>");
	}

	async getFlatAttributeChatMessage() {
		const html= await renderTemplate(
			"systems/hooklineandmecha/templates/messages/flat-attributes.html",
			{
				attributes: this.system.attributes.flat
			}
		);
		return html;
	}

	async rollTargeted(attackKey, defenceKey, dieCount, dieSize) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			this.rollNoTarget(attackKey, dieCount, dieSize);
		} else {
			const target = targetSet.values().next().value;
			AttackHandler.rollToHit(
				this,
				attackKey,
				target.actor,
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

	setAttributeValue(attributeKey, value) {
		if (Utils.isRollableAttribute(attributeKey)) {
			this.system.attributes.rolled[attributeKey].value = value;
		} else if (this.system.attributes.flat[attributeKey]) {
			this.system.attributes.flat[attributeKey].value = value;
		}
	}

	setNPCType(targetType) {
		this.system.fishType=targetType;
		this.npcType = game.fishHandler.knownTypes[targetType];
	}

	setNPCSize(targetSize) {
		this.system.size=targetSize;
		this.npcSize = game.fishHandler.knownSizes[targetSize];
	}

	_getAttributeLabels() {
		for (const attributeKey in this.system.attributes.rolled) {
			const attribute = this.system.attributes.rolled[attributeKey];
			attribute.label = Utils.getLocalisedAttributeLabel(attributeKey);
		}
		for (const attributeKey in this.system.attributes.flat) {
			const attribute = this.system.attributes.flat[attributeKey];
			attribute.label = Utils.getLocalisedAttributeLabel(attributeKey);
		}
	}

	_getResourceLabels() {
		for (const resourceKey in this.system.resources) {
			const resource = this.system.resources[resourceKey];
			resource.label = Utils.getLocalisedResourceLabel(resourceKey);
		}
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

		return new WeightClass(weightClass);
	}
}
