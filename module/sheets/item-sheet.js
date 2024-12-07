/**
 * @extends {ItemSheet}
 */
export class HLMItemSheet extends ItemSheet {
    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fathomlessgears", "sheet", "item"],
            template: "systems/fathomlessgears/templates/item-sheet.html",
            width: 400,
            height: 200,
            tabs: [],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
        });
    }
}