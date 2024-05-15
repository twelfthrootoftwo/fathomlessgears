import {Utils} from "../utilities/utils.js";
import {AttackHandler} from "../actions/attack.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE, ITEM_TYPES} from "../constants.js";
import { RollElement, RollDialog } from "../actions/roll-dialog.js";

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
		let totalVal=0;
		if(Utils.isRollableAttribute(attributeKey)) {
			totalVal=this.system.attributes.rolled[attributeKey].total;
		} else if(Utils.isDowntimeAttribute(attributeKey)) {
			totalVal=this.system.downtime.rollable[attributeKey].value;
		}
		const baseMod=new RollElement(totalVal,"flat","Base stat");
		modifiers.push(baseDice, baseMod);
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

	calculateAttributeTotals() {
		const updateData={"rolled":{},"flat":{}};
		Object.keys(this.system.attributes.rolled).forEach((key) => {
			const attr=this.system.attributes.rolled[key];
			attr.total=attr.base+attr.internals+attr.modifier;
			updateData.rolled[key]=attr;
		});
		Object.keys(this.system.attributes.flat).forEach((key) => {
			const attr=this.system.attributes.flat[key];
			attr.total=attr.base+attr.internals+attr.modifier;
			updateData.flat[key]=attr;
		});
		if(this._id) this.update({"system.attributes": updateData});
		this.calculateBallast();
	}

	/**
	 * Change an attribute value
	 * @param {string} attributeKey The attribute to change
	 * @param {int} value The new value
	 * @param {string} target The attribute component (base, internals, modifier)
	 * @returns true if the change was successful, false if the attribute key or target are not valid
	 */
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

	/**
	 * Apply a modifier to an attribute value
	 * @param {string} attributeKey The attribute to change
	 * @param {int} value The new value to add to the existing value
	 * @param {string} target The attribute component (base, internals, modifier)
	 * @returns true if the change was successful, false if the attribute key or target are not valid
	 */
	modifyAttributeValue(attributeKey, value, target){
		//Apply ballast change
		if(attributeKey=="ballast") {
			this.system.ballast.base.value=this.system.ballast.base.value+value;
		} else if(attributeKey=="repair_kits") {
			this.system.resources.repair.value+=value;
			this.system.resources.repair.max+=value;
		} else {
			//Check the target is an attribute, quit if not
			if(!(Utils.isAttribute(attributeKey)&&Utils.isAttributeComponent(target))) return false;
			//Apply changes in appropriate place
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
			return true;
		}
	}

	modifyResourceValue(resourceKey,value) {
		console.log("Modifying resource")
		if(!Utils.isResource(resourceKey)) return false;
		this.system.resources[resourceKey].value+=value;
		this.system.resources[resourceKey].max+=value;
	}

	/**
	 * -----------------------------------------------------
	 * Get labels for display objects
	 * #TODO can this go on the sheet?
	 * -----------------------------------------------------
	 */

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

	_getDowntimeLabels() {
		for (const downtimeKey in this.system.downtime.rollable) {
			const attribute = this.system.downtime.rollable[downtimeKey];
			attribute.label = Utils.getLocalisedDowntimeLabel(downtimeKey);
		}
	}

	_setLabels() {
		this._getAttributeLabels();
		this._getBallastLabels();
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
		const items=this.itemTypes;
		let baseVal=0;
		let weight=0;
		if(this.type==ACTOR_TYPES.fisher) {
			console.log("Calculating ballast")
			if(items.frame_pc.length > 0) baseVal=items.frame_pc[0].system.ballast;
			items.internal_pc.forEach((internal) => {
				baseVal+=internal.system.ballast;
				weight+=internal.system.attributes.weight;
			})
		} else {
			//TODO NPC ballast calc
		}
		this.system.ballast.base.value=baseVal;
		const weightBallast=Math.floor(weight/5);
		this.system.ballast.weight.value=weightBallast;
		const ballastMods=this.system.ballast.modifiers.value;
		this.system.ballast.total.value=baseVal+weightBallast+ballastMods;
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
				this.setAttributeValue(key,size.system.attributes[key],"base");
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
		console.log(this)
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
			this.setAttributeValue(key,frame.system.attributes[key],"base");
		})
		this.system.ballast.base.frame=frame.system.ballast;
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
		console.log(this);
	}

	/**
	 * Item drop processing for internals
	 * @param {Item} internal
	 */
	async applyInternal(internal) {
		//Apply attributes
		Object.keys(internal.system.attributes).forEach((key) => {
			this.modifyAttributeValue(key,internal.system.attributes[key],"internals");
		})
		//Modify resources
		this.modifyResourceValue("repair",internal.system.repair_kits);
		await this.update({"system": this.system});

		const item=await Item.create(internal,{parent: this});
		item.setFlag("hooklineandmecha","broken",false);
		this.system.internals.push(item._id);
		this.update({"system": this.system});
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

	async getFrameAbilityChatMessage() {
		const frame=this.itemTypes.frame_pc[0];
		console.log(frame);
		const display = await renderTemplate(
			"systems/hooklineandmecha/templates/messages/frame-ability.html",
			{
				frame_ability_name: frame.system.gear_ability_name,
				frame_ability_text: frame.system.gear_ability,
			}
		);
		console.log(display);
		return display;		
	}

	async toggleInternalBroken(uuid) {
		const internal=this.items.get(uuid);
		await internal.toggleBroken();

		//Apply attribute changes
		const isBroken=await internal.isBroken();
		console.log("Toggling internal to "+isBroken)
		const multiplier=isBroken ? -1 : 1
		Object.keys(internal.system.attributes).forEach((key) => {
			if(key!=ATTRIBUTES.weight) {
				this.modifyAttributeValue(key,multiplier*internal.system.attributes[key],"internals");
			}
		})
	}
}
