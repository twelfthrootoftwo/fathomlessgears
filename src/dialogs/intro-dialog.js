import {Utils} from "../utilities/utils.js";
import {HLMApplication} from "../sheets/application.js";
import {FshManager} from "../data-files/fsh-manager.js";

export class IntroDialog extends HLMApplication {
	constructor() {
		super();
		this.dontshow = false;
		this.render(true);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["fathomlessgears"],
			template: "systems/fathomlessgears/templates/intro-dialog.html",
			title: game.i18n.localize("INTRO.title"),
			width: 300
		});
	}

	activateListeners(html) {
		super.activateListeners(html);
		Utils.activateButtons(html);
		html.find("#skip").click(this.skip.bind(this));
		html.find("#manager").click(this.openManager.bind(this));
		html.find('[data-selector="dontshow"]').change(async (evt) => {
			this.dontshow = evt.target.checked;
		});
	}

	skip() {
		if (this.dontshow) {
			this.saveDontShow();
		}
		this.close();
	}

	openManager() {
		if (this.dontshow) {
			this.saveDontShow();
		}
		if (!FshManager.isOpen) {
			new FshManager();
		}
		this.close();
	}

	saveDontShow() {
		game.settings.set("fathomlessgears", "introComplete", true);
	}
}
