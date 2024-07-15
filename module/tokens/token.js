/**
 * Extend the base TokenDocument to support resource type attributes.
 * @extends {TokenDocument}
 */
export class HLMTokenDocument extends TokenDocument {}

/**
 * Extend the base Token class to implement additional system-specific logic.
 * @extends {Token}
 */
export class HLMToken extends Token {
	gridDisplay

	/** @inheritdoc */
	_onHoverIn(event,options) {
		super._onHoverIn(event,options);
		if(this.actor.getFlag("fathomlessgears","interactiveGrid")) {
			canvas.hud.tokenGrid.showGrid(this);
		}
	}

	/** @inheritdoc */
	_onHoverOut(event,options) {
		super._onHoverIn(event,options);
		canvas.hud.tokenGrid.removeGrid()
	}
}

export class TokenGridHUD extends BasePlaceableHUD {
	//Ref: https://github.com/Eriku33/Foundry-VTT-Image-Hover/blob/main/image-hover.js
	/**
	 * Retrieve and override default options for BasePlaceableHUD
	 */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "token-grid-hud",
			classes: [...super.defaultOptions.classes, "token-grid-hud"],
			minimizable: false,
			resizable: true,
			template: "systems/fathomlessgears/templates/grid-hover-template.html", // HTML template
		});
	}

	getData(options) {
		const context=super.getData(options);
		if(this.actor) {
			context.grid=this.actor.grid;
		}
		return context;
	}

	showGrid(token) {
		if (event && event.buttons > 0) return;
		if (canvas.activeLayer.name == "TokenLayer" ||
			canvas.activeLayer.name == "TokenLayerPF2e") {
			// Show token image if hovered, otherwise don't
			if (
				token == canvas.tokens.hover
			) {
				canvas.hud.tokenGrid.bind(token);
			} else {
				canvas.hud.tokenGrid.clear();
			}
		} else {
			this.clear();
		}
	}

	removeGrid() {
		this.clear();
	}
}
