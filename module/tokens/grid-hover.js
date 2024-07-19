//This code draws on from Eriku33's Image Hover: https://github.com/Eriku33/Foundry-VTT-Image-Hover
import { HLMApplication } from "../sheets/application.js";


/**
 * Copy Placeable HUD template
 */
export class GridHoverHUD extends HLMApplication{
	/**
	 * Retrieve and override default options for BasePlaceableHUD
	 */
	static get defaultOptions() {
		console.log("Getting default options")
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "grid-hover-hud",
			classes: ["grid-hover-hud", "popout"],
			minimizable: false,
			resizable: false,
			popOut: false,
			width: 400,
			height: 400,
			template:
				"systems/fathomlessgears/templates/grid-hover-template.html", // HTML template
		});
	}

	/**
	 * Get image data for html template
	 */
	getData() {
		console.log("Getting data");
		const data = super.getData();
		const tokenObject = this.object;
		let grid = tokenObject?.actor?.grid; // Character art

		data.grid = grid;
		return data;
	}

	/**
	 * check requirements then show character art
	 * @param {*} token token passed in
	 * @param {Boolean} hovered if token is mouseovered
	 * @param {Number} delay hover time requirement (milliseconds) to show art.
	 */
	showGridRequirements(token, hovered, delay) {
		/**
		 * Hide art when dragging a token.
		 */
		if (event && event.buttons > 0) return;

		if (
			hovered &&
			(canvas.activeLayer.name == "TokenLayer" ||
				canvas.activeLayer.name == "TokenLayerPF2e")
		) {
			// Show token image if hovered, otherwise don't
			setTimeout(function () {
				if (
					token == canvas.tokens.hover &&
					token.actor.grid == canvas.tokens.hover.actor.grid
				) {
					game.gridHover.assignToken(token);
				} else {
					if(!this.lock) {
						game.gridHover.clear();
					}
				}
			}, delay);
		} else {
			if(!this.lock) {
				this.clear();
			}
		}
	}

	activateListeners(html) {
		this.object.actor.grid.activateListeners(html);
	}

	/**
	 * Activates a token grid HUD
	 * @param {HLMToken} token The token being hovered
	 */
	assignToken(token) {
		this.object=token;
		this.render(true);
	}

	/**
	 * Removes the token grid HUD
	 */
	clear() {
		this.object=null;
		this.close();
	}

	/**
	 * toggles on/off grid lock
	 */
	toggleLock() {
		if(this.lock) {
			this.lock=false;
			if(!this.hovering) {
				this.clear();
			}
		} else {
			if(this.hovering) {
				this.lock=true;
			}
		}
		console.log(`Toggling lock to ${this.lock}`);
	}

	/**
		 * Add Image Hover display to html on load.
		 */
	static addGridHUD() {
		game.gridHover = new GridHoverHUD();
		game.gridHover.initialiseHooks();
	};

	initialiseHooks() {
		/**
		 * Display image when user hovers mouse over a actor
		 * Must be used on the token layer and have relevant actor permissions (configurable settings by the game master)
		 * @param {*} token passed in token
		 * @param {Boolean} hovered if token is mouseovered
		 */
		Hooks.on("hoverToken", (token, hovered) => {
			console.log("hoverToken");
			game.gridHover.hovering=hovered
			if(game.gridHover.lock) {
				return;
			}
			if (!hovered) {
				console.log("Clearing in hoverToken")
				game.gridHover.clear();
				return;
			}
			game.gridHover.showGridRequirements(token, hovered, 0);
		});

		/**
		 * Remove character art when deleting/dragging token (Hover hook doesn't trigger while token movement animation is on).
		 */
		Hooks.on("preUpdateToken", (...args) => clearArt());
		Hooks.on("deleteToken", (...args) => clearArt());

		/**
		 * Occasions to remove character art from screen due to weird hover hook interaction.
		 */
		Hooks.on("closeActorSheet", (...args) => clearArt());
		Hooks.on("closeSettingsConfig", (...args) => clearArt());
		Hooks.on("closeApplication", (...args) => clearArt());

		Hooks.on("gridSpaceClick",(space,actor) => refreshGrid(actor));
		Hooks.on("internalDeleted",(actor) => refreshGrid(actor));
	}
}

/**
 * Clear art unless GM is showing users art.
 */
function clearArt() {
	if (game.gridHover) {
		if(!game.gridHover.lock) {
			game.gridHover.clear();
		}
	}
}

function refreshGrid(actor) {
	if(game.gridHover?.rendered && game.gridHover.object.actor==actor) {
		game.gridHover.render(true);
	}
}
