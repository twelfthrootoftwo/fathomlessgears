import { HLMApplication } from "../sheets/application.js";
import { ATTRIBUTES, COVER_STATES, ROLL_MODIFIER_TYPE, ATTRIBUTE_MIN, ATTRIBUTE_MAX_ROLLED } from "../constants.js";
import { Utils } from "../utilities/utils.js";

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
        this.dieModifiers=[];
        modifiers.forEach((modifier) => {
            if(modifier.type=="die"){
                this.dieModifiers.push(modifier);
            } else if(modifier.type=="flat") {
                this.flatModifiers.push(modifier);
            }
        });
        this.actor=actor;
        this.attribute=attribute;
        this.internal=internal;
        this.additionalFlat=0;
        this.additionalDie=0;
        this.focused=false;
        this.cover=COVER_STATES.none;
        this.render(true);
    }

    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/roll-dialog.html",
			title: "Roll Inputs",
			width: 250,
		});
	}

    async getData(options) {
        const context=await super.getData(options);
        context.flat=this.flatModifiers;
        context.die=this.dieModifiers;
        context.additionalDie=this.additionalDie;
        context.additionalFlat=this.additionalFlat;
        context.ranged=this.attribute==ATTRIBUTES.far;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        Utils.activateButtons(html);
		html.find(".btn").click(this.triggerRoll.bind(this));
        html.find('[data-selector="additionalDie"]').change(async (_evt) => {
            this.additionalDie=_evt.target.value;
        })
        html.find('[data-selector="additionalFlat"]').change(async (_evt) => {
            this.additionalFlat=_evt.target.value;
        })
        html.find('[data-selector="focused"]').change(async (_evt) => {
            this.focused=_evt.target.checked;
        })
        html.find('[name="cover"]').change(async (_evt) => {
            this.cover=_evt.target.value;
        })
    }
    

    _getSubmitData(data) {
        let formData=super._getSubmitData(data);
    }

    totalAttributes() {
        this.dieModifiers.push({
            value: this.additionalDie,
            type: "die",
            description: "Additional",
            classification: "bonus"
        });
        this.flatModifiers.push({
            value: this.additionalFlat,
            type: "flat",
            description: "Additional",
            classification: "bonus"
        });

        let totalDieCount=0;
        let totalAttr=0;
        let totalBonus=0;

        this.dieModifiers.forEach((modifier) => {
            totalDieCount+=parseInt(modifier.value);
        });
        this.flatModifiers.forEach((modifier) => {
            if(modifier.classification == ROLL_MODIFIER_TYPE.modifier) {
                totalAttr+=parseInt(modifier.value);
            } else if(modifier.classification == ROLL_MODIFIER_TYPE.bonus) {
                totalBonus+=parseInt(modifier.value);
            }
        });
        if(totalAttr<ATTRIBUTE_MIN) totalAttr=ATTRIBUTE_MIN;
        if(totalAttr>ATTRIBUTE_MAX_ROLLED) totalAttr=ATTRIBUTE_MAX_ROLLED;
        if(this.focused) {
            totalDieCount+=1;
        }
        return {"dice": totalDieCount, "attribute": totalAttr, "bonus": totalBonus}
    }

    triggerRoll() {
        modifierTotals=this.totalAttributes();
        if(this.internal) {
            this.actor.triggerRolledInternal(this.internal,this.attribute,modifierTotals.dice,modifierTotals.attribute+modifierTotals.bonus,this.cover);
        } else {
            this.actor.rollAttribute(this.attribute,modifierTotals.dice,modifierTotals.attribute+modifierTotals.bonus, this.cover);
        }
        this.close();
    }
}