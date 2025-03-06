import {BALLAST_TOKEN_CONDITIONS} from "../conditions/conditions.js";
import {drawEffectCounters} from "./counter-rendering.js";

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
	_onHoverIn(...args) {
		super._onHoverIn(...args);
		game.hoveredToken = this;
	}

	_onHoverOut(...args) {
		super._onHoverOut(...args);
		game.hoveredToken = null;
	}
	/**
	 * A copy of a core function with a small modification to filter non-aplicable effects
	 * @override
	 */
	async drawEffects() {
		const wasVisible = this.effects.visible;
		this.effects.visible = false;
		this.effects.removeChildren().forEach((c) => c.destroy());
		this.effects.bg = this.effects.addChild(new PIXI.Graphics());
		this.effects.bg.visible = false;
		this.effects.overlay = null;

		// Categorize new effects
		const tokenEffects = this.document.effects;
		let actorEffects = this.actor?.temporaryEffects || [];
		actorEffects = this.filterEffectList(actorEffects);
		let overlay = {
			src: this.document.overlayEffect,
			tint: null
		};

		// Draw status effects
		if (tokenEffects.length || actorEffects.length) {
			const promises = [];

			// Draw actor effects first
			for (let f of actorEffects) {
				if (!f.icon) continue;
				const tint = Color.from(f.tint ?? null);
				if (f.getFlag("core", "overlay")) {
					if (overlay)
						promises.push(
							this._drawEffect(overlay.src, overlay.tint)
						);
					overlay = {src: f.icon, tint};
					continue;
				}
				promises.push(this._drawEffect(f.icon, tint));
			}

			// Next draw token effects
			for (let f of tokenEffects) {
				promises.push(this._drawEffect(f, null));
			}
			await Promise.all(promises);
		}

		// Draw overlay effect
		this.effects.overlay = await this._drawOverlay(
			overlay.src,
			overlay.tint
		);
		this.effects.bg.visible = true;
		this.effects.visible = wasVisible;
		this._refreshEffects();
	}

	filterEffectList(actorEffects) {
		return actorEffects.filter((effect) => {
			const statusName = effect.statuses.values().next().value;
			let result = false;
			if (this.document.flags.fathomlessgears?.ballastToken) {
				result = BALLAST_TOKEN_CONDITIONS.includes(statusName);
			} else {
				result = !BALLAST_TOKEN_CONDITIONS.includes(statusName);
			}
			return result;
		});
	}

	_refreshEffects() {
		super._refreshEffects();
		drawEffectCounters(this);
	}

	async _drawEffect(src, tint) {
		const icon = await super._drawEffect(src, tint);
		if (icon) icon.name = src;
		return icon;
	}
}

export class TokenDropHandler {
	static addTokenDropHandler() {
		game.tokenDrop = new TokenDropHandler();
		game.tokenDrop.initialiseHooks();
	}

	initialiseHooks() {
		Hooks.on("dropCanvasData", (_canvas, data) => {
			if (data.type == "Item") {
				game.tokenDrop.onCanvasDrop(data);
			}
		});
	}

	async onCanvasDrop(data) {
		const token = getTokenAtPosition(data);
		if (!token) return;
		const item = await fromUuid(data.uuid);
		const actor = token.actor;

		if (actor.itemsManager.canDropItem(item)) {
			actor.itemsManager.receiveDrop(item, data);
		}
	}
}

function getTokenAtPosition(position) {
	let tokenList = canvas.tokens.placeables.map((token) => token.document);

	return tokenList.find((token) => withinBoundaries(token, position));
}

function withinBoundaries(token, position) {
	let xWidth = token.width * token.parent.dimensions.size;
	let yWidth = token.height * token.parent.dimensions.size;
	let tokenCentre = {x: token.x + xWidth / 2, y: token.y + yWidth / 2};

	let difference = [tokenCentre.x - position.x, tokenCentre.y - position.y];

	return (
		Math.abs(difference[0]) <= xWidth / 2 &&
		Math.abs(difference[1]) <= yWidth / 2
	);
}
