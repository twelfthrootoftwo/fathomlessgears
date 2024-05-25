import { HLMApplication } from "../sheets/application.js";
import { ATTRIBUTES } from "../constants.js";

export class RollElement {
    value
    type
    description

    /**
     * Represents a modifier to a die roll
     * @param {integer} value The value of the modifier
     * @param {string} type "die" or "flat"
     * @param {string} description The description to show to the player
     */
    constructor(value, type, description) {
        this.value=value;
        this.type=type;
        this.description=description;
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

    constructor(modifiers, actor, attribute) {
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
        this.additionalFlat=0;
        this.additionalDie=0;
        this.focused=false;
        this.render(true);
    }

    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha"],
			template: "systems/hooklineandmecha/templates/roll-dialog.html",
			title: "Roll Inputs",
			width: 300,
			height: 220,
		});
	}

    async getData(options) {
        const context=await super.getData(options);
        context.flat=this.flatModifiers;
        context.die=this.dieModifiers;
        context.additionalDie=this.additionalDie;
        context.additionalFlat=this.additionalFlat;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
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
    }
    

    _getSubmitData(data) {
        let formData=super._getSubmitData(data);
    }

    triggerRoll() {
        this.dieModifiers.push({
            value: this.additionalDie,
            type: "die",
            description: "Additional"
        });
        this.flatModifiers.push({
            value: this.additionalFlat,
            type: "die",
            description: "Additional"
        });

        let totalDieCount=0;
        let totalFlat=0;

        this.dieModifiers.forEach((modifier) => {
            totalDieCount+=parseInt(modifier.value);
        });
        this.flatModifiers.forEach((modifier) => {
            totalFlat+=parseInt(modifier.value);
        });
        if(this.focused) {
            totalDieCount+=1;
        }

        this.actor.rollAttribute(this.attribute,totalDieCount,totalFlat);
        this.close();
    }
}