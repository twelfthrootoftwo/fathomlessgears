import {Utils} from "../utilities/utils.js";
import {AttackHandler} from "../actions/attack.js";
import {ACTOR_TYPES, ATTRIBUTES, RESOURCES, HIT_TYPE, ITEM_TYPES, ATTRIBUTE_MIN, ATTRIBUTE_MAX_ROLLED, ATTRIBUTE_MAX_FLAT, GRID_TYPE, ROLL_MODIFIER_TYPE} from "../constants.js";
import { RollElement, RollDialog } from "../actions/roll-dialog.js";
import { ReelHandler } from "../actions/reel.js";
import {constructCollapsibleRollMessage} from "../actions/collapsible-roll.js"
import { Grid } from "../grid/grid-base.js";
import { ConfirmDialog } from "../utilities/confirm-dialog.js";

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
		if(this.getFlag("fathomlessgears","interactiveGrid")) {
			this.grid=new Grid(this.system.grid);	
			this.grid.actor=this;	
		}
		const items=this.itemTypes;

		const internals=items.internal_pc.concat(items.internal_npc);
		internals.forEach((internal) => {
			internal.description_text=internal.getInternalDescriptionText();
		});
	}

	/** @inheritdoc */
	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		if(game.user._id==userId) {
			this.setFlag("fathomlessgears","initialised",false)

			if(this.type==ACTOR_TYPES.fish) {
				//Initialise scanning state
				const flag=this.getFlag("fathomlessgears","scanned");
				if(flag==null || flag==undefined) {
					this.setFlag("fathomlessgears","scanned",false);
				}

				//Default fish to None permissions
				let ownership = foundry.utils.deepClone(this.ownership);
				ownership["default"] = 0;
				this.update({ownership});


			} else if(this.type==ACTOR_TYPES.fisher){
				if(!this.system.gridType){
					Utils.getGridFromSize("Fisher").then((grid) => {
						this.applyGrid(grid);
					});
				}

				//Default fishers to Observer permission
				let ownership = foundry.utils.deepClone(this.ownership);
				ownership["default"] = 2;
				this.update({ownership});
			}
		}
	}

	static isTargetedRoll(attributeKey) {
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(attributeKey))
			return ATTRIBUTES.evasion;
		if (attributeKey === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
		if (attributeKey===ATTRIBUTES.power) return ATTRIBUTES.power;
		return false;
	}

	startRollDialog(attributeKey,internalId) {
		const modifiers=[];
		const attribute=this.system.attributes[attributeKey];
		modifiers.push(new RollElement(
			attribute.values.standard.base,
			ROLL_MODIFIER_TYPE.flat,
			"Frame base",
			ROLL_MODIFIER_TYPE.modifier,
		));
		attribute.values.standard.additions.forEach((term) => {
			modifiers.push(RollElement.attributeElementToRollElement(term,this,ROLL_MODIFIER_TYPE.modifier))
		});
		attribute.values.bonus.forEach((term) => {
			modifiers.push(RollElement.attributeElementToRollElement(term,this,ROLL_MODIFIER_TYPE.bonus))
		});
		modifiers.push(new RollElement(
			attribute.values.custom,
			ROLL_MODIFIER_TYPE.flat,
			"Custom modifier (bonus)",
			ROLL_MODIFIER_TYPE.bonus
		));
		return new RollDialog(modifiers,this,attributeKey,internalId);
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {ATTRIBUTES} attributeKey: The string key of the attribute
	 * @param {int} dieCount: The total number of dice to roll
	 * @param {int} flatModifier : The total modifier to add to the roll
	 */
	async rollAttribute(attributeKey, dieCount, flatModifier,cover) {
		const defenceKey = HLMActor.isTargetedRoll(attributeKey);
		let message="";
		if(defenceKey===ATTRIBUTES.power) {
			message=await this.initiateReel(dieCount, flatModifier);
		} else if (defenceKey) {
			const output=await this.rollTargeted(attributeKey, defenceKey, dieCount, flatModifier,cover);
			message=output.text ? output.text : output;
		} else {
			const result=await this.rollNoTarget(attributeKey, dieCount, flatModifier);
			message=result.text;
		}
		const hitMessage = await ChatMessage.create({
			speaker: {actor: this},
			content: message,
		});
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

	async rollTargeted(attackKey, defenceKey, dieCount, flatModifier,cover) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result= await this.rollNoTarget(attackKey, dieCount, flatModifier);
			return result;
		} else {
			const target = targetSet.values().next().value;
			return await AttackHandler.rollToHit(
				this,
				attackKey,
				target.actor,
				defenceKey,
				dieCount,
				flatModifier,
				cover
			);
		}
	}

	async initiateReel(dieCount, flatModifier) {
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			const result= await this.rollNoTarget(ATTRIBUTES.power, dieCount, flatModifier);
			return result.text;
		} else {
			const target = targetSet.values().next().value;
			return await ReelHandler.reel(
				this,
				target.actor,
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
			"systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
			{
				label_left: label,
				total: await constructCollapsibleRollMessage(roll),
				preformat: true
			}
		);
		return {text: hitRollDisplay, result: null};
	}

	/**
	 * Evaluate totals for all attributes & save results
	 */
	calculateAttributeTotals() {
		const updateData={};
		Object.keys(this.system.attributes).forEach((key) => {
			updateData[key]=this.calculateSingleAttribute(key);
		});
		if(this._id) {
			this.update({"system.attributes": updateData});
		}
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
		const applyAttributeMaxRolled=[ATTRIBUTES.close,ATTRIBUTES.far,ATTRIBUTES.power,ATTRIBUTES.speed];
		if(applyAttributeMaxRolled.includes(key) && total>ATTRIBUTE_MAX_ROLLED) total=ATTRIBUTE_MAX_ROLLED;
		if(Utils.isDefenceAttribute(key) && total>ATTRIBUTE_MAX_FLAT) total=ATTRIBUTE_MAX_FLAT;
		attr.values.bonus.forEach((val) => {
			total+=val.value;
		});
		attr.total=total;
		return attr;
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
		if(delIndex>=0) {
			console.log(`Deleted modifier ${source}`)
			targetAttribute.values.standard.additions.splice(delIndex,1);
		} else {
			console.log(`Could not find modifier ${source}`)			
		}
		this.calculateSingleAttribute(key);
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
		return true;
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
		if(ballast.total<ATTRIBUTE_MIN) ballast.total=ATTRIBUTE_MIN;
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
				acceptedTypes=[ITEM_TYPES.internal_npc,ITEM_TYPES.size];
				break;
		}
		if(acceptedTypes.includes(item.type)) {
			return true;
		}
		return false;
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
				this.onInternalDrop(item);
				break;
		}
	}

	/**
	 * Item drop processing for grid
	 * @param {Item} grid
	 */
	async applyGrid(grid) {
		if(this.type==ACTOR_TYPES.fisher && grid.system.type!=GRID_TYPE.fisher) {
			return false;
		} else if(this.type!=ACTOR_TYPES.fisher && grid.system.type==GRID_TYPE.fisher) {
			return false;
		}
		//Remove existing size item
		if(this.system.gridType) {
			const oldGrid=this.items.get(this.system.gridType);
			oldGrid?.delete();
		}
		//Create new size item
		const item=await Item.create(grid,{parent: this});
		this.system.gridType=item._id
		await this.update({"system": this.system});
		Hooks.callAll("gridUpdated",this)
	}

	/**
	 * Item drop processing for size
	 * @param {Item} size 
	 */
	async applySize(size) {
		if(this.type==ACTOR_TYPES.fisher) return false;
		//Apply attribute changes
		Object.keys(size.system.attributes).forEach((key) => {
			this.setBaseAttributeValue(key,size.system.attributes[key]);
		})
		//Remove existing size item
		if(this.system.size) {
			const oldSize=this.items.get(this.system.size);
			oldSize?.delete();
		}
		this.update({"system": this.system});
		//Create new size item
		const item=await Item.create(size,{parent: this});
		this.system.size=item._id
		this.update({"system": this.system});

		//Apply grid
		const newGrid=await Utils.getGridFromSize(size.name);
		await this.applyGrid(newGrid);
		Hooks.callAll("sizeUpdated",this)
	}

	/**
	 * Item drop processing for frames
	 * @param {Item} frame
	 */
	async applyFrame(frame) {
		console.log("Applying frame");
		if(this.type != ACTOR_TYPES.fisher) return false;
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
		await this.update({"system": this.system});
		Hooks.callAll("frameUpdated",this)
	}

	async onInternalDrop(internal) {
		if(this.getFlag("fathomlessgears","interactiveGrid")) {
			new ConfirmDialog(
				"Override Imported Data",
				`Manually adding an internal to this actor will disable the interactive grid.<br>
				To keep the interactive grid, you should update the character by uploading a new Gearwright save file.<br>
				Manually add internal?`,
				this.applyInternalDeactivateGrid,
				{"actor": this, "internal": internal}
			)
		} else {
			this.applyInternal(internal);
		}
	}

	async onInternalRemove(uuid) {
		if(this.getFlag("fathomlessgears","interactiveGrid")) {
			new ConfirmDialog(
				"Override Imported Data",
				`Manually removing an internal from this actor will disable the interactive grid.<br>
				To keep the interactive grid, you should update the character by uploading a new Gearwright save file.<br>
				Manually remove internal?`,
				this.removeInternalDeactivateGrid,
				{"actor": this, "uuid": uuid}
			)
		} else {
			this.removeInternal(uuid);
		}
	}

	/**
	 * Item drop processing for internals
	 * @param {Item} internal
	 */
	async applyInternal(internal) {
		console.log("Applying internal");
		const item=await Item.create(internal,{parent: this});
		item.setFlag("fathomlessgears","broken",false);
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
		this.calculateBallast();
		
		await this.update({"system": this.system});
		Hooks.callAll("internalAdded",this)
		return item._id;
	}

	/**
	 * Send this actor's flat attributes to the chat log
	 */
	async shareFrameAbility() {
		const frame=this.itemTypes.frame_pc[0];
		frame.postToChat(this);
	}

	/**
	 * Posts the chat message associated with an internal
	 * @param {string} uuid The ID of the internal
	 */
	async postInternal(uuid) {
		const internal=this.items.get(uuid);
		internal.postToChat(this);
	}

	/**
	 * Make an attack with an internal, and post the attack result to the chat
	 * @param {string} uuid The ID of the internal
	 * @param {ATTRIBUTE} attackKey The attacking attribute
	 * @param {int} totalDieCount Number of dice to roll
	 * @param {int} totalFlat Total flat bonus to the roll
	 * @param {COVER_STATE} cover Whether or not this attack is affected by cover
	 */
	async triggerRolledInternal(uuid,attackKey,totalDieCount,totalFlat, cover) {
		const internal=this.items.get(uuid);
		const defenceKey=HLMActor.isTargetedRoll(attackKey);
		const rollOutput=await this.rollTargeted(attackKey,defenceKey,totalDieCount,totalFlat, cover);
		const displayString=await renderTemplate(
			"systems/fathomlessgears/templates/messages/internal.html",
			{
				internal: internal,
				minor_text: internal.getInternalDescriptionText(),
				major_text: rollOutput.text,
				showDamage: rollOutput.result!=HIT_TYPE.miss,
				damageText: game.i18n.localize("INTERNALS.damage"),
				marbleText: game.i18n.localize("INTERNALS.marbles")
			}
		);
		await ChatMessage.create({
			speaker: {actor: this},
			content: displayString,
		});
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
		console.log("Toggling internal to broken state "+isBroken)
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
		this.update({"system": this.system});
		ChatMessage.create({
			whisper: await this.getObservers(),
			content: `${this.name}'s ${internal.name} ${isBroken ? "breaks!" : "is repaired"}`
		})
		
		Hooks.callAll("internalBrokenToggled",internal,this)
	}

	/**
	 * Deletes an internal from this actor
	 * @param {string} uuid The UUID of the internal to delete
	 */
	async removeInternal(uuid) {
		const internal=this.items.get(uuid);
		Object.keys(internal.system.attributes).forEach((key) => {
			if(internal.system.attributes[key]!=0) {
				console.log(`Removing attr ${key}`)
				this.removeAttributeModifier(key,uuid);
			}
		});
		this.calculateBallast();
		if(this.system.resources) this.modifyResourceValue("repair",-1*internal.system.repair_kits);
		await this.update({"system": this.system});
		await internal.delete();
		
		Hooks.callAll("internalDeleted",this)
	}

	/**
	 * Remove all internals on this actor (pre import)
	 */
	async removeInternals() {
		const internals=this.itemTypes.internal_pc.concat(this.itemTypes.internal_npc);
		internals.forEach((internal) => {
			this.removeInternal(internal.id);
		});
	}

	/**
	 * Switch this actor from interactive to image grid
	 */
	async removeInteractiveGrid() {
		this.grid=null;
		let targetGridString="systems/fathomlessgears/assets/blank-grid-fish.jpg"
		if(this.type==ACTOR_TYPES.fisher) {
			targetGridString="systems/fathomlessgears/assets/blank-grid.jpg"
		}
		this.setFlag("fathomlessgears","interactiveGrid",false)
		await this.update({"system.grid": targetGridString});
	}

	/**
	 * Remove this actor's interactive grid, then add a new internal
	 * @param {bool} proceed Take the action or no?
	 * @param {Object} args {internal: HLMInternal, actor: HLMActor}
	 */
	async applyInternalDeactivateGrid(proceed,args) {
		if(proceed) {
			await args.actor.removeInteractiveGrid();
			args.actor.applyInternal(args.internal);
		}
	}

	/**
	 * Remove this actor's interactive grid, then remove an internal
	 * @param {bool} proceed Take the action or no?
	 * @param {Object} args {uuid: str, actor: HLMActor}
	 */
	async removeInternalDeactivateGrid(proceed,args) {
		if(proceed) {
			await args.actor.removeInteractiveGrid();
			args.actor.removeInternal(args.uuid);
		}
	}

	/**
	 * Assigns an initialised grid to this actor
	 * @param {Grid} gridObject The initialised grid for this actor
	 */
	async assignInteractiveGrid(gridObject) {
		this.grid=gridObject;
		await this.update({"system.grid": gridObject.toJson()});
		await this.setFlag("fathomlessgears","interactiveGrid",true);
	}

	/**
	 * Get a list of users that have Observer or Owner permissions on this actor
	 * @returns a list of users
	 */
	async getObservers() {
		const observers = await game.users.filter((user) => {
			const isOwner=this.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
			const isObserver=this.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
			return isOwner || isObserver
		});
		return observers;
	}

	/**
	 * Toggle the scan state for this actor
	 * Written by VoidPhoenix, used with permission (thanks!)
	 */
	async toggleScan() {
		if(this.type!=ACTOR_TYPES.fish) {return false;}
		const scanned=!await this.getFlag("fathomlessgears","scanned");
		this.setFlag("fathomlessgears","scanned",scanned);
		let ownership = foundry.utils.deepClone(this.ownership);
		ownership["default"] = scanned ? 2 : 0;
		await this.update({ownership});

		// Print the result to chat.
		let message =
		`<div style="display: flex; flex-direction: column; align-items: center;">
			<img src="${this.img}" style="border:none; max-height: 150px;"/>
			<div style="font-size: 16px;">Scan data available!</div>
		</div>`;
		if(!scanned) {
			message=
			`<div style="display: flex; flex-direction: column; align-items: center;">
				<div style="font-size: 16px; font-style: italic;">Scan revoked</div>
			</div>`;
		}

		// Send to chat

		ChatMessage.create({
			speaker: ChatMessage.getSpeaker(),
			content: message
		});
	}

	/**
	 * Get a string reflecting whether this actor is scanned or not
	 * @returns str
	 */
	async getScanText() {
		if(await this.getFlag("fathomlessgears","scanned")) {
			return game.i18n.localize("SHEET.scantrue");
		} else {
			return game.i18n.localize("SHEET.scanfalse");
		}
	}

	/**
	 * Declare a scan action
	 * @returns False if this action is invalid (this actor is a fish or there are no targeted actors)
	 */
	async scanTarget() {
		if(this.type==ACTOR_TYPES.fish) return false;
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			//TODO allow choosing target afterwards
			ui.notifications.info(game.i18n.localize("MESSAGE.scannotarget"));
			return false;
		} else {
			const target = targetSet.values().next().value;
			const content = `<p class="message-text-only">${game.i18n.localize("MESSAGE.scantarget").replace("_ACTOR_NAME_", this.name).replace("_TARGET_NAME_", target.name)}</p>`;
			await ChatMessage.create({
				speaker: {actor: this},
				content: content,
			})
		}
	}
}
