export class HLMActiveEffect extends ActiveEffect {
	_onCreate(...args) {
		this.parent.transferEffects();
		super._onCreate(...args);
	}

	_onDelete(...args) {
		this.parent.transferEffects();
		super._onDelete(...args);
	}

	_onUpdate(...args) {
		this.parent.transferEffects();
		super._onUpdate(...args);
	}
}
