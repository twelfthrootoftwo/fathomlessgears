import {CONDITIONS, findConditionFromStatus} from "../conditions/conditions.js";
import {Utils} from "../utilities/utils.js";
import {HLMApplication} from "../sheets/application.js";

export class ReserveApDialog extends HLMApplication {
	constructor(actor) {
		super();
		this.actor = actor;
		this.ap = 1;
		this.quickened = true;
		this.render(true);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template:
				"systems/fathomlessgears/templates/reserve-ap-dialog.html",
			title: game.i18n.localize("RESERVEDIALOG.name"),
			width: 200
		});
	}

	async getData(options) {
		const context = await super.getData(options);
		context.ap = this.ap;
		context.quickened = this.quickened;
		return context;
	}

	activateListeners(html) {
		super.activateListeners(html);
		Utils.activateButtons(html);
		html.find(".btn").click(this.triggerAction.bind(this));
		html.find(`[data-selector="quickened"]`).click();
		html.find('[data-selector="quickened"]').change(async (evt) => {
			this.quickened = evt.target.checked;
		});
		html.find('[data-selector="ap"]').change(async (evt) => {
			this.ap = evt.target.valueAsNumber;
		});
	}

	async triggerAction() {
		console.log(this.ap);
		const quickened = await findConditionFromStatus(CONDITIONS.quickened);
		const evasive = await findConditionFromStatus(CONDITIONS.evasive);

		this.actor.itemsManager
			.dropCondition(evasive, {value: this.ap})
			.then(() => {
				if (this.quickened) {
					setTimeout(() => {
						this.actor.itemsManager.dropCondition(quickened, {
							value: this.ap
						});
					}, 300);
				}
			});
		this.close();
	}
}
