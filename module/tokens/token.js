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

	// /** @inheritdoc */
	// _onHoverIn(event,options) {
	// 	super._onHoverIn(event,options);
	// 	if(this.actor.getFlag("fathomlessgears","interactiveGrid")) {
	// 		canvas.hud.tokenGrid.showGrid(this);
	// 	}
	// }

	// /** @inheritdoc */
	// _onHoverOut(event,options) {
	// 	super._onHoverIn(event,options);
	// 	canvas.hud.tokenGrid.removeGrid()
	// }
}

// export class TokenGridHUD extends BasePlaceableHUD {
// 	//Ref: https://github.com/Eriku33/Foundry-VTT-Image-Hover/blob/main/image-hover.js
// 	/**
// 	 * Retrieve and override default options for BasePlaceableHUD
// 	 */
// 	static get defaultOptions() {
// 		return foundry.utils.mergeObject(super.defaultOptions, {
// 			id: "token-grid-hud",
// 			classes: [...super.defaultOptions.classes, "token-grid-hud"],
// 			minimizable: false,
// 			resizable: true,
// 			template: "systems/fathomlessgears/templates/grid-hover-template.html", // HTML template
// 		});
// 	}

// 	getData(options) {
// 		const context=super.getData(options);
// 		if(this.actor) {
// 			context.grid=this.actor.grid;
// 		}
// 		return context;
// 	}

// 	showGrid(token) {
// 		if (event && event.buttons > 0) return;

// 		canvas.hud.tokenGrid.applyCss();

// 		if (canvas.activeLayer.name == "TokenLayer" ||
// 			canvas.activeLayer.name == "TokenLayerPF2e") {
// 			// Show token image if hovered, otherwise don't
// 			if (
// 				token == canvas.tokens.hover
// 			) {
// 				canvas.hud.tokenGrid.bind(token);
// 			} else {
// 				canvas.hud.tokenGrid.clear();
// 			}
// 		} else {
// 			this.clear();
// 		}
// 	}

// 	removeGrid() {
// 		this.clear();
// 	}

// 	applyCss() {
// 		const [xAxis,yAxis]=this.setPosition(400,400);
// 		console.log(`Setting position to ${xAxis}, ${yAxis}`)
// 		const css={
// 			width: "400px",
// 			left: xAxis,
// 			top: yAxis
// 		}
// 		this.element.css(css);
// 	}

// 	setPosition(targetWidth, targetHeight) {
// 		const imagePositionSetting="Bottom left"
// 		const centre = canvas.scene._viewPosition; // Middle of the screen
// 		const windowWidthScaled = window.innerWidth / centre.scale;
// 		const windowHeightScaled = window.innerHeight / centre.scale;
// 		let xAxis = 0;
// 		let yAxis = 0;
	
// 		if (imagePositionSetting.includes("Bottom")) {
// 		// move image to bottom of canvas
// 			yAxis = centre.y + windowHeightScaled / 2 - targetHeight;
// 		} else {
// 			yAxis = centre.y - windowHeightScaled / 2;
// 		}
	
// 		const sidebar = document.getElementById("sidebar");
// 		const sidebarCollapsed = sidebar.classList.contains("collapsed"); // take into account if sidebar is collapsed
	
// 		if (imagePositionSetting == "Centre") {
// 		if (sidebarCollapsed) {
// 			return [
// 				centre.x - targetWidth / 2,
// 				centre.y - targetHeight / 2,
// 				targetWidth,
// 			];
// 		} else {
// 			return [
// 				centre.x -
// 					targetWidth / 2 -
// 					sidebar.offsetWidth / centre.scale / 3,
// 				centre.y - targetHeight / 2,
// 				targetWidth,
// 			];
// 		}
// 		}
	
// 		if (imagePositionSetting.includes("right")) {
// 			// move image to right of canvas
// 			if (imagePositionSetting.includes("Bottom") && sidebarCollapsed) {
// 				xAxis = centre.x + windowWidthScaled / 2 - targetWidth;
// 			} else {
// 				const sidebarWidthScaled =
// 				sidebar.offsetWidth / centre.scale +
// 				parseFloat(
// 					window
// 					.getComputedStyle(sidebar, null)
// 					.getPropertyValue("margin-right")
// 				) /
// 					centre.scale;
// 				xAxis =
// 				centre.x +
// 				windowWidthScaled / 2 -
// 				targetWidth -
// 				sidebarWidthScaled;
// 			}
// 		} else {
// 			xAxis = centre.x - windowWidthScaled / 2;
// 		}
// 		return [xAxis, yAxis, targetWidth];
// 	}
// }
