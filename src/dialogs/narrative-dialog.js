import {HLMApplication} from "../sheets/application.js";
import {NARRATIVE_DIFFICULTY} from "../constants.js";
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

function getGoodEnoughThreshold(difficulty) {
	let value = "-";
	if (game.rollHandler.goodEnoughThreshold(difficulty)) {
		value =
			game.rollHandler.goodEnoughThreshold(difficulty).toString() +
			"&plus;";
	}
	return value;
}

function getFullSuccessThreshold(difficulty) {
	let value = "-";
	if (game.rollHandler.fullSuccessThreshold(difficulty)) {
		value =
			game.rollHandler.fullSuccessThreshold(difficulty).toString() +
			"&plus;";
	}
	return value;
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
		this.difficulty = NARRATIVE_DIFFICULTY.none;
		this.render(true);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/narrative-dialog.html",
			title: "Roll Inputs",
			width: 500
		});
	}

	async getData(options) {
		const context = await super.getData(options);
		context.modifiers = this.modifiers;
		context.additional = this.additional;
		context.totalString = this.calculateDieTotal().toString() + "d6";
		context.checkDifficulties = [];
		Object.keys(NARRATIVE_DIFFICULTY).forEach((difficulty) => {
			let item = {};
			item.id = difficulty;
			item.name = game.i18n.localize("NARRATIVE." + difficulty);
			context.checkDifficulties.push(item);
		});
		context.goodEnoughString = getGoodEnoughThreshold(this.difficulty);
		context.fullSuccessString = getFullSuccessThreshold(this.difficulty);
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
		html.find('[name="difficulty"]').change(async (_evt) => {
			this.updateDifficulty(_evt.target.value);
		});
		html.find(`[id="${this.difficulty}"]`).click();
	}

	calculateDieTotal() {
		let labelCount = 0;
		this.modifiers.forEach((modifier) => {
			if (modifier.active) {
				labelCount += 1;
			}
		});
		if (parseInt(this.additional)) {
			labelCount += parseInt(this.additional);
		}
		let dice = 2;
		if (labelCount >= 7) {
			dice += 4;
		} else if (labelCount >= 4) {
			dice += 3;
		} else if (labelCount >= 2) {
			dice += 2;
		} else if (labelCount >= 1) {
			dice += 1;
		}
		return dice;
	}

	async triggerRoll() {
		const modifierStack = this.modifiers.filter((element) =>
			Boolean(element.active)
		);
		const rollParams = new LabelRollParameters(
			this.actor.uuid,
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

	updateGoodEnoughString() {
		const string = getGoodEnoughThreshold(this.difficulty);
		const goodEnoughElement = document.getElementById("goodenough-string");
		goodEnoughElement.innerHTML = string;
	}

	updateFullSuccessString() {
		const string = getFullSuccessThreshold(this.difficulty);
		const fullSuccessElement =
			document.getElementById("fullsuccess-string");
		fullSuccessElement.innerHTML = string;
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

	updateDifficulty(newDifficulty) {
		this.difficulty = newDifficulty;
		this.updateGoodEnoughString();
		this.updateFullSuccessString();
	}
}
