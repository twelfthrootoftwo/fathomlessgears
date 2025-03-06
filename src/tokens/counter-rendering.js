import {findEffectByImage} from "../conditions/conditions.js";

/**
 * These functions are taken from Status Icon Counters by WoodenTavern.
 * While Status Icon Counters is set as a system requirement, the override to Token.drawEffects prevents the counters from being drawn.
 * So the draw function is duplicated and called here
 */

const fontCache = new Map();

/**
 * Creates rendering objects for every effect sprite that matches any of the active status icons. The text is added as
 *  an additional effect on top of
 *  the original sprite.
 * @param {Token} token The token to draw the effect counters for.
 */
export function drawEffectCounters(token) {
	console.log("Draw effect counters");
	// Clean up old counters.
	if (token.effectCounters) {
		token.effectCounters.removeChildren().forEach((c) => c.destroy());
	}

	// The child may have been removed due to redrawing the token entirely.
	if (!token.children.find((c) => c.name === "effectCounters")) {
		const counterContainer = new PIXI.Container();
		counterContainer.name = "effectCounters";
		token.effectCounters = token.addChild(counterContainer);
	}

	// Track effects per image to resolve duplicates correctly.
	const imgCount = new Map();

	// Create new counters for each effect.
	for (let sprite of token.effects.children.filter(
		(effect) => effect.isSprite && effect.name
	)) {
		if (sprite === token.effects.overlay) {
			console.log("End");
			continue;
		}

		const duplicates = imgCount.get(sprite.name) ?? 0;
		const counter = findEffectByImage(token.actor, sprite.name, duplicates)
			?.flags.statuscounter?.counter;
		imgCount.set(sprite.name, duplicates + 1);
		if (!counter) {
			console.log("No counter");
			continue;
		}

		const {visible, displayDuration} = counter;
		const hasDuration = displayDuration != null;
		if (visible)
			token.effectCounters.addChild(
				createCounterValue(counter, sprite, hasDuration)
			);
		if (hasDuration)
			token.effectCounters.addChild(
				createCounterDuration(counter, sprite, visible)
			);
	}
}

/**
 * Creates a rendering object for a single counter displaying its value. The text is placed on top of the bottom right
 *  corner of the given sprite.
 * @param {StatusCounter} counter The counter to create the value text for.
 * @param {PIXI.Graphics} effectIcon The sprite on top of which to place the text.
 * @param {boolean} double Indicates whether the height needs to fit two counters.
 * @returns {PIXI.Text} The PIXI object representing the value.
 */
function createCounterValue(counter, effectIcon, double) {
	console.log("Creating value");
	const valueText = new PIXI.Text(
		counter.value,
		getScaledFont(counter, effectIcon.height, double)
	);
	valueText.anchor.set(1); // Align to bottom right

	const sizeRatio = effectIcon.height / 20;
	valueText.x = effectIcon.x + effectIcon.width + 1 * sizeRatio;
	valueText.y = effectIcon.y + effectIcon.height + 4 * sizeRatio;
	valueText.resolution = Math.max(1, (1 / sizeRatio) * 1.5);
	console.log(valueText);
	return valueText;
}

/**
 * Creates a rendering object for a single counter displaying its duration. The text is placed on the top right corner
 *  of the given sprite.
 * @param {StatusCounter} counter The counter to create the duration text for.
 * @param {PIXI.Graphics} effectIcon The sprite on top of which to place the text.
 * @param {boolean} double Indicates whether the height needs to fit two counters.
 * @returns {PIXI.Text} The PIXI object representing the duration.
 */
function createCounterDuration(counter, effectIcon, double) {
	const durationText = new PIXI.Text(
		counter.displayDuration,
		getScaledFont(counter, effectIcon.height, double, true)
	);
	durationText.anchor.set(0, 0);

	const sizeRatio = effectIcon.height / 20;
	durationText.x = effectIcon.x - sizeRatio;
	durationText.y = effectIcon.y - 5.5 * sizeRatio; // Aligning to top requires an extra 1.5px offset.
	durationText.resolution = Math.max(1, (1 / sizeRatio) * 1.5);
	return durationText;
}

/**
 * Creates a copy of the font associated with the type of this counter or the default, scaled relative to the given
 *  icon size.
 * @param {StatusCounter} counter The counter to create the font for.
 * @param {number} iconHeight The height of the effect icon in pixels.
 * @param {boolean} double Indicates whether the height needs to fit two counters.
 * @param {boolean=} duration Indicates whether the font is used for the duration or the value. Defaults to false.
 * @returns {PIXI.TextStyle} The scaled font to use for this counter and icon size.
 */
function getScaledFont(counter, iconHeight, double, duration = false) {
	iconHeight = Math.round(iconHeight);
	let cacheKey = `${counter.type}${duration ? "-duration" : ""}-${iconHeight}`;
	if (double) cacheKey += "-double";

	let font = fontCache.get(cacheKey);
	if (!font) {
		font = CONFIG.canvasTextStyle.clone();
		font.fontSize = calculateFontSize(iconHeight, double);
		font.fill = duration
			? `#${game.settings.get("statuscounter", "counterColor").replace("#", "")}`
			: `#${game.settings.get("statuscounter", "countdownColor").replace("#", "")}`;
		fontCache.set(cacheKey, font);
	}

	return font;
}

/**
 * Calculates the size for newly created fonts.
 * @param {number=} iconHeight The height of the effect icon in pixels.
 * @param {boolean=} double Indicates whether the height needs to fit two counters.
 * @returns {number} The target size for new fonts.
 */
function calculateFontSize(iconHeight, double) {
	let size = game.settings.get("statuscounter", "counterFontSize");
	if (iconHeight !== 20) size = (iconHeight / 20) * size;
	if (double) size = Math.min(size, (iconHeight + 8) / 2);
	return size;
}

/**
 * Resets the cached fonts, allowing them to be recreated on the next render.
 */
export function resetFontCache() {
	fontCache.clear();
}
