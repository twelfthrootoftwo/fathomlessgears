import {BALLAST_TOKEN_CONDITIONS} from "../conditions/conditions.js";

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
	async _drawEffects() {
		this.effects.renderable = false;

		// Clear Effects Container
		this.effects.removeChildren().forEach((c) => c.destroy());
		this.effects.bg = this.effects.addChild(new PIXI.Graphics());
		this.effects.bg.zIndex = -1;
		this.effects.overlay = null;

		// Categorize new effects
		let activeEffects = this.actor?.temporaryEffects || [];
		activeEffects = this.filterEffectList(activeEffects);
		const overlayEffect = activeEffects.findLast(
			(e) => e.img && e.getFlag("core", "overlay")
		);

		// Draw effects
		const promises = [];
		for (const [i, effect] of activeEffects.entries()) {
			if (!effect.img) continue;
			const promise =
				effect === overlayEffect
					? this._drawOverlay(effect.img, effect.tint)
					: this._drawEffect(effect.img, effect.tint);
			promises.push(
				promise.then((e) => {
					if (e) e.zIndex = i;
				})
			);
		}
		await Promise.allSettled(promises);

		this.effects.sortChildren();
		this.effects.renderable = true;
		this.renderFlags.set({refreshEffects: true});
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
