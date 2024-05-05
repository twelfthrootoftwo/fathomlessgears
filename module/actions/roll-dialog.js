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
        this.render(true);
    }

    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hooklineandmecha"],
			template: "systems/hooklineandmecha/templates/roll-dialog.html",
			title: "Roll Inputs",
			width: 300,
			height: 300,
		});
	}

    async getData(options) {
        const context=await super.getData(options);
        context.flat=this.flatModifiers;
        context.die=this.dieModifiers;
        console.log(context);
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
		html.find(".button").click(this.triggerRoll.bind(this));
    }

    triggerRoll() {
        let totalDieCount=0;
        let totalFlat=0;

        this.dieModifiers.forEach((modifier) => {
            totalDieCount+=modifier.value;
        });
        this.flatModifiers.forEach((modifier) => {
            totalFlat+=modifier.value;
        });

        this.actor.rollAttribute(this.attribute,totalDieCount,totalFlat);
        this.close();
    }
}