import {Utils} from "../utilities/utils.js";
import {AttackHandler} from "../actions/attack.js";
import {ATTRIBUTES, RESOURCES, HIT_TYPE, ITEM_TYPES} from "../constants.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class HLMActor extends Actor {
	/** @inheritdoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.calculateBallast();
		this._setLabels();
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
		var formula = "";
		if (attributeKey) {
			const rollAttribute = this.system.attributes.rolled[attributeKey];
			formula =
				dieCount + "d" + dieSize + "+" + rollAttribute.total.toString();
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
					attr.total.toString()
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
		let roll = this.getAttributeRoller(attributeKey, dieCount, dieSize);
		await roll.evaluate();

		var label = game.i18n.localize("ROLLTEXT.base");
		if (attributeKey) {
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

	setAttributeValue(attributeKey, value,target) {
		if(!Utils.isAttribute(attributeKey)) return;
		let targetAttribute=null;
		let targetAttributeAddress="";
		if (Utils.isRollableAttribute(attributeKey)) {
			targetAttribute=this.system.attributes.rolled[attributeKey]
			targetAttributeAddress=`system.attributes.rolled.${attributeKey}`
		} else if (this.system.attributes.flat[attributeKey]) {
			targetAttribute=this.system.attributes.flat[attributeKey]
			targetAttributeAddress=`system.attributes.flat.${attributeKey}`
		}
		targetAttribute[target]=value;
		const totalValue=targetAttribute.base+targetAttribute.internals+targetAttribute.modifier;
		targetAttribute.total=totalValue;
		this.update({[`${targetAttributeAddress}.${target}`] : value, [`${targetAttributeAddress}.total`] : totalValue});
	}

	modifyAttributeValue(attributeKey, value, target){
		if(!Utils.isAttribute(attributeKey)) return;
		let targetAttribute=null;
		let targetAttributeAddress="";
		if (Utils.isRollableAttribute(attributeKey)) {
			targetAttribute=this.system.attributes.rolled[attributeKey]
			targetAttributeAddress=`system.attributes.rolled.${attributeKey}`
		} else if (this.system.attributes.flat[attributeKey]) {
			targetAttribute=this.system.attributes.flat[attributeKey]
			targetAttributeAddress=`system.attributes.flat.${attributeKey}`
		}
		targetAttribute[target]+=value;
		const totalValue=targetAttribute.base+targetAttribute.internals+targetAttribute.modifier;
		targetAttribute.total=totalValue;
		this.update({[`${targetAttributeAddress}.${target}`] : targetAttribute[target], [`${targetAttributeAddress}.total`] : totalValue});
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
			const bal = this.system.ballast[ballastKey];
			bal.label = Utils.getLocalisedBallastLabel(ballastKey);
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
		const baseBallast=this.system.ballast.base.value;
		const weightBallast=Math.floor(this.system.attributes.flat.weight.total/5);
		this.system.ballast.weight.value=weightBallast;
		const ballastMods=this.system.ballast.modifiers.value;
		this.system.ballast.total.value=baseBallast+weightBallast+ballastMods;
	}

	/**
	 * Checks whether an item can be dropped onto this actor
	 * @param {Item} item The item being dropped
	 * @returns True if this object can be dropped, False otherwise
	 */
	canDropItem(item) {
		let acceptedTypes=[]
		switch(this.type) {
			case "fisher":
				acceptedTypes=[ITEM_TYPES.frame_pc, ITEM_TYPES.internal_pc];
				break;
			case "fish":
				acceptedTypes=[ITEM_TYPES.internal_npc];
				break;
		}
		if(acceptedTypes.includes(item.type)) {
			return true;
		} else if(item.type==ITEM_TYPES.size){
			return this.checkAllowedSize(item);
		}
		return false;
	}

	checkAllowedSize(sizeItem) {
		if(sizeItem.key=="fisher") {
			return this.type="fisher";
		} else {
			return this.type!="fisher";
		}
	}

	receiveDrop(item) {
		switch(item.type) {
			case ITEM_TYPES.size:
				this.applySize(item)
				break;
			case ITEM_TYPES.frame_pc:
				this.applyFrame(item);
				break;
			case ITEM_TYPES.internal_pc:
			case ITEM_TYPES.internal_npc:
				this.applyInternal(item);
				break;
		}
	}

	applySize(size) {
		const sizeData=size.flags.hooklineandmecha.data
		this.setFlag("hooklineandmecha","size",sizeData)
		if(sizeData.key != "fisher") {
			Object.keys(sizeData).forEach((key) => {
				this.setAttributeValue(key,sizeData[key],"base");
			})
		}
		console.log(this)
	}

	applyFrame(frame) {
		if(this.type != "fisher") return;
		this.setFlag("hooklineandmecha","frame",frame.flags.hooklineandmecha.data)
	}

	applyInternal(internal) {
		this.internals.push(internal);
		Object.keys(internal).forEach((key) => {
			this.modifyAttributeValue(key,internal[key],"internals");
		})
		this.update({"internals": this.internals});
	}
}
