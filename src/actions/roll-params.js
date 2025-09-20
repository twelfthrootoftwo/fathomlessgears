import {ACTOR_TYPES, ATTRIBUTES} from "../constants.js";

export class RollParameters {
	constructor(
		actor,
		attribute,
		dieTotal,
		flatTotal,
		modifierStack,
		cover,
		internalId,
		actionCode,
		hideHitLocation
	) {
		this.actor = actor;
		this.attribute = attribute;
		this.dieTotal = dieTotal;
		this.flatTotal = flatTotal;
		this.modifierStack = modifierStack;
		if (this.attribute == ATTRIBUTES.far) {
			if (cover == undefined) {
				console.log("Cover not set on Far roll!");
			} else {
				this.cover = cover;
			}
		}
		if (internalId) this.internalId = internalId;
		if (actionCode) this.actionCode = actionCode;
		if (hideHitLocation) this.hideHitLocation = true;
		this.defenceKey = this.setDefenceKey();
	}

	setDefenceKey() {
		if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(this.attribute))
			return ATTRIBUTES.evasion;
		if (this.attribute === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
		if (this.attribute === ATTRIBUTES.power) return ATTRIBUTES.power;
		return false;
	}

	getDisplayModifierStack() {
		if (
			this.actor.type == ACTOR_TYPES.fish &&
			!this.actor.getFlag("fathomlessgears", "scanned")
		)
			return [];
		else return this.modifierStack;
	}
}

export class LabelRollParameters {
	constructor(actor, dieTotal, modifierStack, difficulty) {
		this.actor = actor;
		this.dieTotal = dieTotal;
		this.modifierStack = modifierStack;
		this.difficulty = difficulty;
	}
}
