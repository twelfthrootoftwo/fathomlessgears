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

	// /** @inheritdoc */
	// _onHoverIn(event,options) {
	// 	super._onHoverIn(event,options);
	// 	const displayString=game.gridHover.showLockTooltip()
	// 	if(displayString) {
	// 		console.log(this.tooltip);
	// 	}
	// }

	// /** @inheritdoc */
	// _onHoverOut(event,options) {
	// 	super._onHoverIn(event,options);
	// 	//game.gridHover.hideLockTooltip()
	// }
}
