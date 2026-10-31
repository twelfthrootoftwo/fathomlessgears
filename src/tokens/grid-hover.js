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
			width: 500,
			height: 380,
			template:
				"systems/fathomlessgears/templates/grid-hover-template.html"
		});
	}

	/**
	 * A render which is still in flight when clear() (or a newer render) runs is
	 * stale by the time it finishes - its own DOM insertion still happens (that
	 * part of the core render pipeline isn't cancellable mid-flight), but nothing
	 * would otherwise remove it afterwards, since the close() that ran earlier has
	 * already resolved and clear()'s original caller is long done. Track a
	 * generation counter so a render can tell, after the fact, whether it's still
	 * the current one; if not, it cleans up after itself immediately.
	 */
	async _render(force, options) {
		const myGeneration = (this.renderGeneration =
			(this.renderGeneration ?? 0) + 1);
		await super._render(force, options);
		if (this.renderGeneration !== myGeneration) {
			this.clear();
		}
	}

	getData() {
		const data = super.getData();
		const actor = this.object;
		if (!actor) return;
		let grid = actor.grid;

		data.grid = grid;
		data.lockPrompt = this.getLockPrompt();
		data.interactive = actor.testUserPermission(
			game.user,
			CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
		);
		data.position = game.settings.get("fathomlessgears", "gridHUDPosition");

		if (actor.type == ACTOR_TYPES.fish) {
			const hp = grid.calculateHP();
			const tranq = Math.min(actor.getConditionValue("tranq"), 3);
			const catchCounters = actor.getConditionValue("catchcounter");
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
	 * check requirements then show grid
	 */
	checkShowGridRequirements(actor) {
		if (!actor) return;
		setTimeout(function () {
			if (
				actor.getFlag("fathomlessgears", "interactiveGrid") &&
				actor.testUserPermission(
					game.user,
					CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
				)
			) {
				game.gridHover.assignActor(actor);
			} else {
				if (!this.lock) {
					game.gridHover.clear();
				}
			}
		}, 0);
	}

	/**
	 * Activates listeners for the grid object
	 * @param {HTML} html The HTML document
	 */
	activateListeners(html) {
		//this.object can go null mid-render if clear() runs while a render triggered
		//by assignActor/refresh is still in flight (e.g. an actor update refreshing
		//the HUD at the same moment the user unlocks it) - without this guard that
		//crashes the render, which leaves the stale HUD stuck on screen since the
		//close() call below runs before the crash and no-ops (see its own comment).
		if (!this.object) return;
		this.object.grid.activateListeners(html);
	}

	/**
	 * Activates a grid HUD
	 * @param {HLMActor} actor The actor being hovered (fom token or sidebar)
	 */
	assignActor(actor) {
		this.object = actor;
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
		//Invalidate any render currently in flight - see the comment on _render above.
		this.renderGeneration = (this.renderGeneration ?? 0) + 1;
		//Guard against reentrancy: close() fires the generic "closeApplication" hook
		//(see initialiseHooks below), which calls clearGrid() -> clear() again while
		//this very call is still inside close(). Without this check that's unbounded
		//synchronous recursion once close() actually runs instead of no-opping (see
		//the force:true comment below) - it was latent but harmless before, since the
		//un-forced close() always returned before ever reaching the hook.
		if (this._state === Application.RENDER_STATES.CLOSING) return;
		//force: true, since close() otherwise silently no-ops unless the app is
		//currently in the RENDERED state - if a render triggered by assignActor/
		//refresh (e.g. an actor update) is still in flight when clear() runs, the
		//app is in the RENDERING state and a non-forced close does nothing, leaving
		//the stale HUD stuck on screen.
		this.close({force: true}).then(() => {
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
		const showOnSidebarHover = game.settings.get(
			"fathomlessgears",
			"gridHUDOnSidebarHover"
		);
		if (this.lock) {
			this.lock = false;
			if (
				(!this.hovering || !showOnHover) &&
				(!this.hoveringSidebar || !showOnSidebarHover)
			) {
				this.clear();
			}
		} else {
			if (this.hovering) {
				this.lock = true;
				if (!showOnHover) {
					this.checkShowGridRequirements(this.hoveredToken.actor);
				}
			} else if (this.hoveringSidebar) {
				this.lock = true;
				if (!showOnSidebarHover) {
					this.checkShowGridRequirements(this.hoveredSidebarActor);
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
		 * Display grid when user hovers mouse over a actor
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
			if (showOnHover && canvas.activeLayer.name == "TokenLayer") {
				if (game.gridHover.lock) {
					return;
				}
				if (!hovered) {
					game.gridHover.clear();
					return;
				}
				game.gridHover.checkShowGridRequirements(token.actor);
			}
		});

		Hooks.on("preUpdateToken", () => clearGrid());
		Hooks.on("deleteToken", () => clearGrid());
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
			refreshGrid(this.object);
		}
	}
}

/**
 * Clear grid
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
	if (game.gridHover?.rendered && game.gridHover.object._id == actor.id) {
		setTimeout(() => {
			game.gridHover.render(true);
		}, 20);
	}
}

export function addGridHudToSidebar(_app, html) {
	const actors = html.getElementsByClassName("directory-item document actor");
	for (let actorEntry of actors) {
		const actorId = actorEntry.dataset.documentId;
		actorEntry.addEventListener("mouseenter", (_ev) => {
			const showOnHover = game.settings.get(
				"fathomlessgears",
				"gridHUDOnSidebarHover"
			);
			const actor = game.actors.get(actorId);
			game.gridHover.hoveredSidebarActor = actor;
			game.gridHover.hoveringSidebar = true;
			if (showOnHover) {
				if (game.gridHover.lock) {
					return;
				}
				game.gridHover.checkShowGridRequirements(actor);
			}
		});
	}
	compendium.addEventListener("mouseleave", (_ev) => {
		game.gridHover.hoveredSidebarActor = null;
		game.gridHover.hoveringSidebar = false;
		clearGrid();
	});
}
