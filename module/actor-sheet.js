/**
 * @extends {ActorSheet}
 */
export class HLMActorSheet extends ActorSheet {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["hooklineandmecha", "sheet", "actor"],
        template: "systems/hooklineandmecha/templates/fisher-sheet.html",
        width: 600,
        height: 600,
        tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}],
        scrollY: [".biography", ".attributes"],
        dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

      /** @inheritdoc */
    async getData(options) {
        const context = await super.getData(options);
        console.log("Getting context data")
        console.log(context);
        context.biographyHTML = await TextEditor.enrichHTML(context.actor.system.biography, {
            secrets: this.document.isOwner,
            async: true
        });
        this.fixedFirstRow=new Object();
        this.fixedSecondRow=new Object();
        this.fixedFirstRow.evade=context.actor.system.attributes.flat.evade;
        this.fixedFirstRow.willpower=context.actor.system.attributes.flat.willpower;
        this.fixedFirstRow.speed=context.actor.system.attributes.flat.speed;
        this.fixedSecondRow.weight=context.actor.system.attributes.flat.weight;
        this.fixedSecondRow.sensors=context.actor.system.attributes.flat.sensors;
        this.fixedSecondRow.baseAP=context.actor.system.attributes.flat.baseAP;
        console.log(this);
        return context;
    }


    /**@inheritdoc */
    /**Not doing anything, just here to provide debug info when saving the sheet*/
    _getSubmitData(updateData) {
        let formData=super._getSubmitData(updateData);
        console.log("Form data:");
        console.log(formData);
        return formData;
    }

        /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.rollable').click(this._onRoll.bind(this));

        // Everything below here is only needed if the sheet is editable
        if ( !this.isEditable ) return;
    }

    async _onRoll(event) {
        event.preventDefault();
        const dieCount=event.target.attributes.diecount.value;
        const dieSize=event.target.attributes.diesize.value;
        const attribute=event.target.attributes.attribute?.value;
        var formula=new Roll;
        var label="";
        if (attribute) {
            const rollAttribute=this.actor.system.attributes.rolled[attribute];
            formula=dieCount+"d"+dieSize+"+"+rollAttribute.value.toString();
            label="Rolling "+rollAttribute.label+":";
        } else {
            formula=dieCount+"d"+dieSize;
            label="Rolling "+formula+":";
        }
        let roll=new Roll(formula);       
        await roll.evaluate()
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            flavor: label
        });
    }

     /** @override */
  get template() {
    return `systems/hooklineandmecha/templates/${this.actor.type}-sheet.html`;
  }
}