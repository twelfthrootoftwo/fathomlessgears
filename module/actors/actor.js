import {Utils} from "../utilities/utils.js";
import {AttackHandler} from "../actions/attack.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE, ITEM_TYPES, ATTRIBUTE_MIN, ATTRIBUTE_MAX_ROLLED, ATTRIBUTE_MAX_FLAT} from "../constants.js";
import { RollElement, RollDialog } from "../actions/roll-dialog.js";

export class AttributeElement {
	value
	source
	type
	label

	constructor(value,source,type,label) {
		this.value=value;
		this.source=source;
		this.type=type;
		this.label=label;
	}
}

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class HLMActor extends Actor {
	/** @inheritdoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.calculateAttributeTotals();
		this._setLabels();
	}

	static isTargetedRoll(attributeKey) {
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(attributeKey))
			return ATTRIBUTES.evade;
		if (attributeKey === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
		return false;
	}

	startRollDialog(attributeKey) {
		console.log("Building modifiers");
		const modifiers=[];
		const baseDice=new RollElement(2,"die","Base");
		modifiers.push(baseDice);
		const attribute=this.system.attributes[attributeKey];
		modifiers.push(new RollElement(
			attribute.values.standard.base,
			"flat",
			"Frame base"
		));
		attribute.values.standard.additions.forEach((term) => {
			modifiers.push(new RollElement(
				term.value,
				"flat",
				term.label
			))
		});
		attribute.values.bonus.forEach((term) => {
			modifiers.push(new RollElement(
				term.value,
				"flat",
				term.label
			))
		});
		modifiers.push(new RollElement(
			attribute.values.custom,
			"flat",
			"Custom modifier"
		));
		new RollDialog(modifiers,this,attributeKey);
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {ATTRIBUTES} attributeKey: The string key of the attribute
	 * @param {int} dieCount: The total number of dice to roll
	 * @param {int} flatModifier : The total modifier to add to the roll
	 */
	async rollAttribute(attributeKey, dieCount, flatModifier) {
		const defenceKey = HLMActor.isTargetedRoll(attributeKey);
		if (defenceKey) {
			this.rollTargeted(attributeKey, defenceKey, dieCount, flatModifier);
		} else {
			this.rollNoTarget(attributeKey, dieCount, flatModifier);
		}
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
		for (const attribute in this.system.attributes) {
			const attr = this.system.attributes[attribute];
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

	async locationHitMessage() {
		const locationResult=await AttackHandler.rollHitLocation(this);
		if(locationResult) {
			const displayString=await AttackHandler.generateLocationDisplay(locationResult);
			ChatMessage.create({
				speaker: {actor: this},
				content: displayString,
			});
		}
	}

	async rollTargeted(attackKey, defenceKey, dieCount, flatModifier) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			this.rollNoTarget(attackKey, dieCount, flatModifier);
		} else {
			const target = targetSet.values().next().value;
			AttackHandler.rollToHit(
				this,
				attackKey,
				target.actor,
				defenceKey,
				dieCount,
				flatModifier
			);
		}
	}

	async rollNoTarget(attributeKey, dieCount, flatModifier) {
		let roll = Utils.getRoller(dieCount, flatModifier);
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

	/**
	 * Evaluate totals for all attributes & save results
	 */
	calculateAttributeTotals() {
		const updateData={};
		Object.keys(this.system.attributes).forEach((key) => {
			updateData[key]=this.calculateSingleAttribute(key);
		});
		if(this._id) this.update({"system.attributes": updateData});
	}

	/**
	 * Calculate the total value of a chosen attribute
	 * @param {ATTRIBUTE} key Attribute to calculate
	 * @returns none
	 */
	calculateSingleAttribute(key) {
		if(key=="ballast") {
			this.calculateBallast();
			return;
		}
		const attr=this.system.attributes[key];
		let total=0;
		total=attr.values.standard.base;
		attr.values.standard.additions.forEach((val) => {
			total+=val.value;
		});
		if(total<ATTRIBUTE_MIN) total=ATTRIBUTE_MIN;
		if(Utils.isRollableAttribute(key) && total>ATTRIBUTE_MAX_ROLLED) total=ATTRIBUTE_MAX_ROLLED;
		if(Utils.isDefenceAttribute(key) && total>ATTRIBUTE_MAX_FLAT) total=ATTRIBUTE_MAX_FLAT;
		attr.values.bonus.forEach((val) => {
			total+=val.value;
		});
		attr.total=total;
		return;
	}

	/**
	 * Change the base attribute value
	 * @param {string} attributeKey The attribute to change
	 * @param {int} value The new value
	 * @returns true if the change was successful, false if the attribute key is not valid
	 */
	setBaseAttributeValue(attributeKey, value) {
		if(!Utils.isAttribute(attributeKey)) return false;
		const targetAttribute=this.system.attributes[attributeKey]
		targetAttribute.values.standard.base=value;
		this.calculateSingleAttribute(attributeKey)
		this.update({"system": this.system});
		return true;
	}

	/**
	 * Apply a (standard) modifier to an attribute
	 * @param {ATTRIBUTE} key The attribute to add the modifier to
	 * @param {AttributeElement} modifier The modifier to add
	 */
	addAttributeModifier(key,modifier) {
		const targetAttribute=this.system.attributes[key];
		targetAttribute.values.standard.additions.push(modifier);
		this.calculateSingleAttribute(key);
		this.update({"system": this.system});
	}

	/**
	 * Removes an attribute modifier, if it exists
	 * @param {ATTRIBUTE} key The attribute to modify
	 * @param {string} source The id of the modifier to remove (usually the id of the object that created it)
	 */
	removeAttributeModifier(key,source) {
		const targetAttribute=this.system.attributes[key];
		let delIndex=-1;
		let index=0;
		targetAttribute.values.standard.additions.forEach((modifier) => {
			if(modifier.source==source) {
				delIndex=index;
			}
			index+=1;
		})
		if(delIndex>=0) {targetAttribute.values.standard.additions.splice(delIndex,1);}
		this.calculateSingleAttribute(key);
		this.update({"system": this.system});
	}

	/**
	 * Change the current & maximum values of a resource
	 * @param {string} resourceKey The resource to modify
	 * @param {int} value The value change to apply
	 * @returns True if the change was successful, False if the key is not a resource
	 */
	modifyResourceValue(resourceKey,value) {
		if(!Utils.isResource(resourceKey)) return false;
		this.system.resources[resourceKey].value+=value;
		this.system.resources[resourceKey].max+=value;
		this.update({"system": this.system});
		return true;
	}

	/**
	 * -----------------------------------------------------
	 * Get labels for display objects
	 * #TODO can this go on the sheet?
	 * -----------------------------------------------------
	 */

	_getAttributeLabels() {
		for (const attributeKey in this.system.attributes) {
			const attribute = this.system.attributes[attributeKey];
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

	_getDowntimeLabels() {
		for (const downtimeKey in this.system.downtime.rollable) {
			const attribute = this.system.downtime.rollable[downtimeKey];
			attribute.label = Utils.getLocalisedDowntimeLabel(downtimeKey);
		}
	}

	_setLabels() {
		this._getAttributeLabels();
		if (this.system.resources) {
			this._getResourceLabels();
		}
		if (this.system.downtime) {
			this._getDowntimeLabels();
		}
	}

	/**
	 * Compute the actor's ballast value
	 */
	calculateBallast() {
		const ballast=this.system.attributes.ballast;
		const weightBallast=Math.floor(this.system.attributes.weight.total/5);
		ballast.values.standard.weight=weightBallast;
		let ballastMods=0;
		ballast.values.standard.additions.forEach((element) => {
			ballastMods+=element.value;
		})
		ballast.total=ballast.values.standard.base+weightBallast+ballastMods+ballast.values.custom;
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

	/**
	 * Checks whether a size can be dropped onto this actor
	 * @param {Item} sizeItem The size being dropped
	 * @returns True if this size can be dropped, False otherwise
	 */
	checkAllowedSize(sizeItem) {
		if(sizeItem.name.toLowerCase()=="fisher") {
			return this.type="fisher";
		} else {
			return this.type!="fisher";
		}
	}

	/**
	 * Directs a new item to the correct process on adding the item to the actor
	 * @param {Item} item The item to apply
	 */
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

	/**
	 * Item drop processing for size
	 * @param {Item} size 
	 */
	async applySize(size) {
		//Apply attribute changes
		if(size.name != "Fisher") {
			Object.keys(size.system.attributes).forEach((key) => {
				this.setBaseAttributeValue(key,size.system.attributes[key]);
			})
		}
		//Remove existing size item
		if(this.system.size) {
			const oldSize=this.items.get(this.system.size);
			oldSize?.delete();
		}
		//Create new size item
		const item=await Item.create(size,{parent: this});
		this.system.size=item._id
		this.update({"system": this.system});
	}

	/**
	 * Item drop processing for frames
	 * @param {Item} frame
	 */
	async applyFrame(frame) {
		console.log("Applying frame");
		if(this.type != "fisher") return;
		//Apply attribute changes
		Object.keys(frame.system.attributes).forEach((key) => {
			this.setBaseAttributeValue(key,frame.system.attributes[key]);
		})
		//Remove existing size item
		if(this.system.frame) {
			const oldFrame=this.items.get(this.system.frame);
			this.modifyResourceValue("repair",-oldFrame.system.repair_kits);
			this.modifyResourceValue("core",-oldFrame.system.core_integrity);
			oldFrame?.delete();
		}
		this.modifyResourceValue("repair",frame.system.repair_kits);
		this.modifyResourceValue("core",frame.system.core_integrity);
		await this.update({"system": this.system});

		//Create new size item
		const item=await Item.create(frame,{parent: this});
		this.system.frame=item._id;
		this.calculateBallast();
		this.update({"system": this.system});
	}

	/**
	 * Item drop processing for internals
	 * @param {Item} internal
	 */
	async applyInternal(internal) {
		console.log("Applying internal");
		const item=await Item.create(internal,{parent: this});
		item.setFlag("hooklineandmecha","broken",false);
		this.system.internals.push(item._id);
		//Apply attributes
		Object.keys(internal.system.attributes).forEach((key) => {
			if(Utils.isAttribute(key) && internal.system.attributes[key]!=0) {
				const modifier=new AttributeElement(
					internal.system.attributes[key],
					item._id,
					"internal",
					internal.name
				);
				this.addAttributeModifier(key,modifier);
			}
		})
		//Modify resources
		if(internal.system.repair_kits) {this.modifyResourceValue("repair",internal.system.repair_kits);}
		await this.update({"system": this.system});
	}

	/**
	 * Send this actor's flat attributes to the chat log
	 */
	async shareFrameAbility() {
		const content=await this.getFrameAbilityChatMessage();
		ChatMessage.create({
			speaker: {actor: this},
			content: content,
		});
	}

	/**
	 * Send this actor's frame ability to the chat log
	 */
	async getFrameAbilityChatMessage() {
		const frame=this.itemTypes.frame_pc[0];
		const display = await renderTemplate(
			"systems/hooklineandmecha/templates/messages/frame-ability.html",
			{
				frame_ability_name: frame.system.gear_ability_name,
				frame_ability_text: frame.system.gear_ability,
			}
		);
		return display;		
	}

	/**
	 * Mark an internal as broken
	 * @param {string} uuid The UUID of the internal to break
	 */
	async toggleInternalBroken(uuid) {
		const internal=this.items.get(uuid);
		await internal.toggleBroken();

		//Apply attribute changes
		const isBroken=await internal.isBroken();
		console.log("Toggling internal to "+isBroken)
		Object.keys(internal.system.attributes).forEach((key) => {
			if(key!=ATTRIBUTES.weight && internal.system.attributes[key]!=0) {
				if(isBroken) {
					this.removeAttributeModifier(key,uuid);
				} else {
					const modifier=new AttributeElement(
						internal.system.attributes[key],
						internal._id,
						"internal",
						internal.name
					);
					this.addAttributeModifier(key,modifier);
				}
			}
		})
	}

	/**
	 * Deletes an internal from this actor
	 * @param {string} uuid The UUID of the internal to delete
	 */
	async removeInternal(uuid) {
		const internal=this.items.get(uuid);
		Object.keys(internal.system.attributes).forEach((key) => {
			this.removeAttributeModifier(key,uuid);
		});
		this.calculateBallast();
		this.modifyResourceValue("repair",-1*internal.system.repair_kits);
		this.update({"system": this.system});
		internal.delete();
	}
}
