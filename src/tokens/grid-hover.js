//This code draws on from Eriku33's Image Hover: https://github.com/Eriku33/Foundry-VTT-Image-Hover
import {ACTOR_TYPES} from "../constants.js";
import {HLMApplication} from "../sheets/application.js";

/**
 * Copy Placeable HUD template
 */
export class GridHoverHUD extends HLMApplication {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "grid-hover-hud",
			classes: ["grid-hover-hud", "popout"],
			minimizable: false,
			resizable: false,
			popOut: false,
			width: 450,
			height: 380,
			template:
				"systems/fathomlessgears/templates/grid-hover-template.html" // HTML template
		});
	}

	getData() {
		const data = super.getData();
		const tokenObject = this.object;
		let grid = tokenObject?.actor?.grid; // Character art

		data.grid = grid;
		data.lockPrompt = this.getLockPrompt();
		data.interactive = tokenObject?.actor?.testUserPermission(
			game.user,
			CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
		);
		data.position = game.settings.get("fathomlessgears", "gridHUDPosition");

		if (tokenObject?.actor?.type == ACTOR_TYPES.fish) {
			const hp = grid.calculateHP();
			const tranq = Math.min(
				tokenObject.actor.getConditionValue("tranq"),
				3
			);
			const catchCounters =
				tokenObject.actor.getConditionValue("catchcounter");
			const effectiveHP = Math.max(hp - tranq - catchCounters, 0);
			data.hp = `${game.i18n.localize("GRID.remainingHP")}: ${effectiveHP}`;
			data.hpBreakdown = `(${hp} HP`;
			if (tranq) {
				data.hpBreakdown = data.hpBreakdown.concat(
					` - ${tranq} ${game.i18n.localize("CONDITIONS.tranq")}`
				);
			}
			if (catchCounters) {
				data.hpBreakdown = data.hpBreakdown.concat(
					` - ${catchCounters} ${game.i18n.localize("CONDITIONS.catchcounter")}`
				);
			}
			data.hpBreakdown = data.hpBreakdown.concat(")");
		}

		return data;
	}

	/**
	 * check requirements then show character art
	 */
	checkShowGridRequirements() {
		/**
		 * Hide art when dragging a token.
		 */
		if (event && event.buttons > 0) return;

		if (canvas.activeLayer.name == "TokenLayer") {
			const token = game.gridHover.hoveredToken;
			// Show token image if hovered, otherwise don't
			setTimeout(function () {
				if (
					token == canvas.tokens.hover &&
					token.actor.grid == canvas.tokens.hover.actor.grid &&
					token.actor.getFlag("fathomlessgears", "interactiveGrid") &&
					token.actor.testUserPermission(
						game.user,
						CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
					)
				) {
					game.gridHover.assignToken(token);
				} else {
					if (!this.lock) {
						game.gridHover.clear();
					}
				}
			}, 0);
		} else {
			if (!this.lock) {
				this.clear();
			}
		}
	}

	/**
	 * Activates listeners for the grid object
	 * @param {HTML} html The HTML document
	 */
	activateListeners(html) {
		this.object.actor.grid.activateListeners(html);
	}

	/**
	 * Activates a token grid HUD
	 * @param {HLMToken} token The token being hovered
	 */
	assignToken(token) {
		this.object = token;
		if (this.closing) {
			this.awaitingRefresh = true;
		} else {
			this.render(true);
		}
	}

	/**
	 * Removes the token grid HUD
	 */
	clear() {
		this.object = null;
		this.close().then(() => {
			if (this.awaitingRefresh && this.object) {
				this.render(true);
			}
		});
	}

	/**
	 * toggles on/off grid lock
	 */
	toggleLock() {
		const showOnHover = game.settings.get(
			"fathomlessgears",
			"gridHUDOnHover"
		);
		if (this.lock) {
			this.lock = false;
			if (!this.hovering || !showOnHover) {
				this.clear();
			}
		} else {
			if (this.hovering) {
				this.lock = true;
				if (!showOnHover) {
					this.checkShowGridRequirements();
				}
			}
		}
	}

	/**
	 * Create a Grid HUD manager and attach it to the game
	 */
	static addGridHUD() {
		game.gridHover = new GridHoverHUD();
		game.gridHover.initialiseHooks();
	}

	initialiseHooks() {
		/**
		 * Display image when user hovers mouse over a actor
		 * Must be used on the token layer and have relevant actor permissions (configurable settings by the game master)
		 * @param {*} token passed in token
		 * @param {Boolean} hovered if token is mouseovered
		 */
		Hooks.on("hoverToken", (token, hovered) => {
			game.gridHover.hoveredToken = token;
			game.gridHover.hovering = hovered;
			const showOnHover = game.settings.get(
				"fathomlessgears",
				"gridHUDOnHover"
			);
			if (showOnHover) {
				if (game.gridHover.lock) {
					return;
				}
				if (!hovered) {
					game.gridHover.clear();
					return;
				}
				game.gridHover.checkShowGridRequirements();
			}
		});

		/**
		 * Remove character art when deleting/dragging token (Hover hook doesn't trigger while token movement animation is on).
		 */
		Hooks.on("preUpdateToken", () => clearGrid());
		Hooks.on("deleteToken", () => clearGrid());

		/**
		 * Occasions to remove character art from screen due to weird hover hook interaction.
		 */
		Hooks.on("closeActorSheet", () => clearGrid());
		Hooks.on("closeSettingsConfig", () => clearGrid());
		Hooks.on("closeApplication", () => clearGrid());

		Hooks.on("updateActor", (...args) => refreshGrid(...args));
		Hooks.on("updateActiveEffect", (condition) =>
			refreshGrid(condition.parent)
		);
		Hooks.on("deleteActiveEffect", (condition) =>
			refreshGrid(condition.parent)
		);
		Hooks.on("createActiveEffect", (condition) =>
			refreshGrid(condition.parent)
		);
	}

	getLockPrompt() {
		let keyString = game.keybindings.get("fathomlessgears", "pinGrid")[0]
			.key;
		keyString = keyString.replace("Key", "");
		if (!this.lock) {
			return game.i18n
				.localize("GRIDHUD.lockON")
				.replace("_KEY_", keyString);
		} else {
			return game.i18n
				.localize("GRIDHUD.lockOFF")
				.replace("_KEY_", keyString);
		}
	}

	refresh() {
		if (this.rendered) {
			refreshGrid(this.object.actor);
		}
	}
}

/**
 * Clear art unless GM is showing users art.
 */
function clearGrid() {
	if (game.gridHover) {
		if (!game.gridHover.lock) {
			game.gridHover.clear();
		}
	}
}

/**
 * When an actor is modified, check if the current HUD needs to refresh
 * @param {HLMActor} actor The actor that has been updated
 */
function refreshGrid(actor) {
	if (
		game.gridHover?.rendered &&
		game.gridHover.object.actor._id == actor.id
	) {
		setTimeout(() => {
			game.gridHover.render(true);
		}, 20);
	}
}
