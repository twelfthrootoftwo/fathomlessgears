import {NUMBERED_CONDITIONS} from "./conditions.js";

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

	hasCounterFlag() {
		return this.flags.statuscounter;
	}

	getCounterValue() {
		let effectCounter = foundry.utils.getProperty(
			this,
			"flags.statuscounter.value"
		);
		return effectCounter;
	}

	async setCounterValue(value) {
		await this.setFlag("statuscounter", "value", value);
	}

	async setCounterVisibility() {
		const visible = NUMBERED_CONDITIONS.includes(
			this.statuses.values().next().value
		);
		await this.setFlag("statuscounter", "visible", visible);
	}
}
