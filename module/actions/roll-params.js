import {ACTOR_TYPES, ATTRIBUTES} from "../constants.js";

export class RollParameters {
    constructor(actor,attribute,dieTotal,flatTotal,modifierStack,cover,internalId) {
        this.actor=actor;
        this.attribute=attribute;
        this.dieTotal=dieTotal;
        this.flatTotal=flatTotal;
        this.modifierStack=modifierStack;
        if(this.attribute==ATTRIBUTES.far) {
            if(cover==undefined) {
                console.log("Cover not set on Far roll!")
            } else {
                this.cover=cover;
            }
        }
        if(internalId) this.internalId=internalId;
        this.defenceKey=this.setDefenceKey()
    }

    setDefenceKey() {
        if ([ATTRIBUTES.close, ATTRIBUTES.far].includes(this.attribute))
            return ATTRIBUTES.evasion;
        if (this.attribute === ATTRIBUTES.mental) return ATTRIBUTES.willpower;
        if (this.attribute===ATTRIBUTES.power) return ATTRIBUTES.power;
        return false;
    }
	
    getDisplayModifierStack() {
        if(this.actor.type==ACTOR_TYPES.fish && !this.actor.getFlag("fathomlessgears","scanned")) return [];
        else return this.modifierStack;
    }
}