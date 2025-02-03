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
}

export class TokenDropHandler {
	static addTokenDropHandler() {
		game.tokenDrop = new TokenDropHandler();
		game.tokenDrop.initialiseHooks();
	}

	initialiseHooks() {
		Hooks.on("dropCanvasData", (canvas, data) => {
			console.log(canvas);
			console.log(data);
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
