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
		this.calculateBallast();
		this.setNPCSize(this.system.size);
		if(this.system.fishType) {
			this.setNPCType(this.system.fishType);
		}
		this._setLabels();
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
		console.log(attributeKey);

		let roll = this.getAttributeRoller(attributeKey, dieCount, dieSize);
		await roll.evaluate();

		var label = game.i18n.localize("ROLLTEXT.base");
		console.log(label);
		if (attributeKey) {
			console.log("Replacing with attribute")
			label=label.replace("_ATTRIBUTE_NAME_", Utils.getLocalisedAttributeLabel(attributeKey));
		} else {
			label=label.replace("_ATTRIBUTE_NAME_", roll.formula);
		}

		const hitRollDisplay = await renderTemplate(
			"systems/hooklineandmecha/templates/partials/labelled-roll-partial.html",
			{
				label_left: label,
				total: roll.total,
				tooltip: `${roll.formula}:  ${roll.result}`,
			}
		);

		const hitMessage = await ChatMessage.create({
			speaker: {actor: this},
			content: hitRollDisplay,
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

	_getBallastLabels() {
		for (const ballastKey in this.system.ballast) {
			console.log(ballastKey);
			const bal = this.system.ballast[ballastKey];
			bal.label = Utils.getLocalisedBallastLabel(ballastKey);
			console.log(bal);
		}
	}

	_setLabels() {
		this._getAttributeLabels();
		this._getBallastLabels();
		if (this.system.resources) {
			this._getResourceLabels();
		}
	}

	calculateBallast() {
		console.log(this);
		const baseBallast=this.system.ballast.base.value;
		const weightBallast=Math.floor(this.system.attributes.flat.weight.value/5);
		const ballastMods=this.system.ballast.modifiers.value;
		this.system.ballast.total.value=baseBallast+weightBallast+ballastMods;
	}
}
