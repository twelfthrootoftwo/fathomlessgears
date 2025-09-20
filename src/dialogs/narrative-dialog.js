import {HLMApplication} from "../sheets/application.js";
import {_NARRATIVE_DIFFICULTY} from "../constants.js";
import {Utils} from "../utilities/utils.js";
import {LabelRollParameters} from "../actions/roll-params.js";

export class LabelRollElement {
	/**
	 * Represents a modifier to a die roll
	 * @param {integer} value The value of the modifier
	 */
	constructor(name) {
		this.name = name;
		this.active = false;
		this.id = "id" + foundry.utils.randomID();
	}
}

export class NarrativeRollDialog extends HLMApplication {
	modifiers;
	actor;
	additionalLabels;
	difficulty;

	constructor(labels, actor) {
		super();
		this.modifiers = [];
		labels.forEach((label) => {
			let modifier = new LabelRollElement(label.name);
			this.modifiers.push(modifier);
		});
		this.actor = actor;
		this.additionalLabels = 0;
		this.difficulty = null;
		this.render(true);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/narrative-dialog.html",
			title: "Roll Inputs",
			width: 300
		});
	}

	async getData(options) {
		const context = await super.getData(options);
		context.modifiers = this.modifiers;
		context.additional = this.additional;
		context.totalString = this.calculateDieTotal().toString() + "d6";
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);
		Utils.activateButtons(html);
		html.find(".btn").click(this.triggerRoll.bind(this));
		html.find('[data-selector="additional"]').change(async (_evt) => {
			this.additional = _evt.target.value;
			this.updateTotalString();
		});
		html.find(".element-checkbox").change(async (_evt) => {
			this.toggleModifier(_evt);
		});
		this.modifiers.forEach((modifier) => {
			if (modifier.active) {
				html.find(`[data-id=${modifier.id}]`).click();
			}
		});
	}

	calculateDieTotal() {
		if (this.focused) return 3;
		return 2;
	}

	async triggerRoll() {
		const modifierStack = this.modifiers.filter((element) =>
			Boolean(element.active)
		);
		const rollParams = new LabelRollParameters(
			this.actor,
			this.calculateDieTotal(),
			modifierStack,
			this.difficulty
		);

		if (parseInt(this.additionalLabels)) {
			rollParams.modifierStack.push(
				new LabelRollElement(
					parseInt(this.additionalLabels),
					game.i18n.localize("ROLLDIALOG.other")
				)
			);
		}

		await game.rollHandler.rollNarrative(rollParams);
		this.close();
	}

	findMatchingModifier(id) {
		let foundModifier = null;
		this.modifiers.forEach((modifier) => {
			if (modifier.id == id) foundModifier = modifier;
		});
		return foundModifier;
	}

	updateTotalString() {
		const totalString = this.calculateDieTotal().toString() + "d6";
		const totalElement = document.getElementById("total-string");
		totalElement.innerHTML = totalString;
	}

	toggleModifier(evt) {
		const modifier = this.findMatchingModifier(
			evt.currentTarget.dataset.id
		);
		if (modifier) {
			modifier.active = evt.currentTarget.checked;
		}
		this.updateTotalString();
	}
}
