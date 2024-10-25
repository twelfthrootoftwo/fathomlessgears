import { HLMApplication } from "../sheets/application.js";
import { ATTRIBUTES, COVER_STATES, ROLL_MODIFIER_TYPE, ATTRIBUTE_MIN, ATTRIBUTE_MAX_ROLLED } from "../constants.js";
import { Utils } from "../utilities/utils.js";
import { CONDITIONS } from "../conditions/conditions.js"

export class RollElement {
    value
    type
    description
    classification

    /**
     * Represents a modifier to a die roll
     * @param {integer} value The value of the modifier
     * @param {string} type "die" or "flat"
     * @param {string} description The description to show to the player
     * @param {string} classification "modifier" or "bonus"
     */
    constructor(value, type, description, classification) {
        this.value=value;
        this.type=type;
        this.description=description;
        this.classification=classification;
        this.active=true;
        this.id="id"+foundry.utils.randomID();
        this.comment="";
    }

    static attributeElementToRollElement(term, actor, modifierType) {
        let elementType=ROLL_MODIFIER_TYPE.flat;
        switch(term.type) {
            case "internal":
                const internal=actor.items.get(term.source);
                if(internal.isOptics()) {
                    elementType=ROLL_MODIFIER_TYPE.optics;
                } else {
                    elementType=ROLL_MODIFIER_TYPE.flat;
                }
                break;
            case "condition":
                elementType=ROLL_MODIFIER_TYPE.condition;
                break;
        }
        return new RollElement(
            term.value,
            elementType,
            term.label,
            modifierType,
        )
    }
}

export class RollDialog extends HLMApplication {
    flatModifiers
    dieModifiers
    actor
    attribute
    additionalFlat
    additionalDie
    focused
    internal
    cover

    constructor(modifiers, actor, attribute,internal) {
        super();
        this.flatModifiers=[];
        this.flatBonuses=[];
        modifiers.forEach((modifier) => {
            modifier.active=this.activateModifier(modifier,actor);
            if(modifier.classification==ROLL_MODIFIER_TYPE.modifier) {
                this.flatModifiers.push(modifier);
            } else if(modifier.classification==ROLL_MODIFIER_TYPE.bonus) {
                this.flatBonuses.push(modifier);
            }
        });
        this.actor=actor;
        this.attribute=attribute;
        this.internal=internal;
        this.additionalFlat=0;
        this.additionalDie=0;
        this.focused=actor.statuses.has(CONDITIONS.focused);
        this.cover=COVER_STATES.none;
        this.render(true);
    }

    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/roll-dialog.html",
			title: "Roll Inputs",
			width: 300,
		});
	}

    async getData(options) {
        const context=await super.getData(options);
        context.flatModifiers=this.flatModifiers;
        context.flatBonuses=this.flatBonuses;
        context.die=this.dieModifiers;
        context.additionalDie=this.additionalDie;
        context.additionalFlat=this.additionalFlat;
        context.ranged=this.attribute==ATTRIBUTES.far;
        context.totalString=this.calculateDieTotal().toString()+"d6 + "+(this.calculateFlatTotal()+parseInt(this.additionalFlat)).toString()
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        Utils.activateButtons(html);
		html.find(".btn").click(this.triggerRoll.bind(this));
        html.find('[data-selector="additionalFlat"]').change(async (_evt) => {
            this.additionalFlat=_evt.target.value;
            this.updateTotalString();
        })
        html.find('[data-selector="focused"]').change(async (_evt) => {
            this.focused=_evt.target.checked;
            this.updateTotalString();
        })
        html.find('[name="cover"]').change(async (_evt) => {
            this.cover=_evt.target.value;
        })
        html.find('.element-checkbox').change(async (_evt) => {
            this.toggleModifier(_evt);
        })
        this.flatModifiers.forEach((modifier) => {
            if(modifier.active) {
                html.find(`[data-id=${modifier.id}]`).click()
            }
        })
        this.flatBonuses.forEach((modifier) => {
            if(modifier.active) {
                html.find(`[data-id=${modifier.id}]`).click()
            }
        })
        if(this.focused) {
            html.find(`[data-selector="focused"]`).click();
        }
    }
    

    calculateDieTotal() {
        if(this.focused) return 3;
        return 2;
    }

    calculateFlatTotal() {
        let totalAttr=0;
        let totalBonus=0;

        [...this.flatModifiers,...this.flatBonuses].forEach((modifier) => {
            if(modifier.classification == ROLL_MODIFIER_TYPE.modifier && modifier.active) {
                totalAttr+=parseInt(modifier.value);
            } else if(modifier.classification == ROLL_MODIFIER_TYPE.bonus && modifier.active) {
                totalBonus+=parseInt(modifier.value);
            }
        });
        if(totalAttr<ATTRIBUTE_MIN) totalAttr=ATTRIBUTE_MIN;
        if(totalAttr>ATTRIBUTE_MAX_ROLLED) totalAttr=ATTRIBUTE_MAX_ROLLED;
        return totalAttr+totalBonus
    }

    async triggerRoll() {
        if(parseInt(this.additionalFlat)) {
            this.flatBonuses.push(new RollElement(
                parseInt(this.additionalFlat),
                ROLL_MODIFIER_TYPE.flat,
                game.i18n.localize("ROLLDIALOG.other"),
                ROLL_MODIFIER_TYPE.bonus
            ))
        }
        const modifierStack = [...this.flatModifiers,...this.flatBonuses]
        if(this.focused) {
            modifierStack.push(this.focused);
        }
        if(this.internal) {
            await this.actor.triggerRolledItem(this.internal,this.attribute,this.calculateDieTotal(),this.calculateFlatTotal(),this.cover,[...this.flatModifiers,...this.flatBonuses,this.focused]);
        } else {
            await game.rollHandler.rollAttribute(this.actor, this.attribute,this.calculateDieTotal(),this.calculateFlatTotal(), this.cover,modifierStack);
        }
        this.close();
    }

    activateModifier(modifier, actor) {
        if(actor.statuses.has(CONDITIONS.blind) && modifier.type==ROLL_MODIFIER_TYPE.optics){
            modifier.comment="Blinded"
            return false;
        }
        return true;
    }

    findMatchingModifier(id) {
        let foundModifier=null;
        this.flatModifiers.forEach((modifier) => {
            if(modifier.id==id) foundModifier=modifier;
        });
        this.flatBonuses.forEach((modifier) => {
            if(modifier.id==id) foundModifier=modifier;
        });
        return foundModifier
    }

    updateTotalString() {
        const totalString=this.calculateDieTotal().toString()+"d6 + "+this.calculateFlatTotal().toString();
        const totalElement = document.getElementById("total-string");
        totalElement.innerHTML = totalString;
    }

    toggleModifier(evt) {
        const modifier=this.findMatchingModifier(evt.currentTarget.dataset.id);
        if(modifier) { modifier.active=evt.currentTarget.checked;} 
        this.updateTotalString();
    }
}