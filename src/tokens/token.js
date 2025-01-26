/**
 * Extend the base TokenDocument to support resource type attributes.
 * @extends {TokenDocument}
 */
export class HLMTokenDocument extends TokenDocument {}

/**
 * Extend the base Token class to implement additional system-specific logic.
 * @extends {Token}
 */
export class HLMToken extends Token {}

export class TokenDropHandler {
	static addTokenDropHandler() {
		game.tokenDrop = new TokenDropHandler();
		game.tokenDrop.initialiseHooks();
	}

	initialiseHooks() {
		Hooks.on("dropCanvasData", (_canvas, data) => {
			if (data.type == "Item") {
				setTimeout(() => {
					game.tokenDrop.onCanvasDrop(data);
				}, 20);
			}
		});
		Hooks.on("hoverToken", (token, hovered) => {
			if (hovered) {
				console.log("Hover token on");
				game.tokenDrop.hoveredToken = token;
			} else {
				console.log("Hover token off");
				game.tokenDrop.hoveredToken = null;
			}
		});
	}

	async onCanvasDrop(data) {
		console.log(game.tokenDrop.hoveredToken);
		if (!game.tokenDrop.hoveredToken) return;
		const item = await fromUuid(data.uuid);
		const actor = game.tokenDrop.hoveredToken.actor;

		if (actor.itemsManager.canDropItem(item)) {
			actor.itemsManager.receiveDrop(item, data);
		}
	}
}
