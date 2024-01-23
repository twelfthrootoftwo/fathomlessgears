/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class HLMActor extends Actor {
	/** @inheritdoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.system.weightClass = WeightClass.evaluateWeightClass(
			this.system.attributes.flat.weight.value,
			0
		);
	}

	/* -------------------------------------------- */

	/**
	 * Is this Actor used as a template for other Actors?
	 * @type {boolean}
	 */
	get isTemplate() {
		return !!this.getFlag("hooklineandmecha", "isTemplate");
	}

	/**
	 *	Roll an attribute (or a flat roll)
	 * @param {*} attributeKey: The string key of the attribute
	 * @param {*} dieCount: The number of dice to roll
	 * @param {*} dieSize : The size of dice to roll
	 */
	async rollAttribute(attributeKey, dieCount, dieSize) {
		var formula = new Roll();
		var label = "";
		if (attributeKey) {
			const rollAttribute = this.system.attributes.rolled[attributeKey];
			formula =
				dieCount + "d" + dieSize + "+" + rollAttribute.value.toString();
			label = "Rolling " + rollAttribute.label + ":";
		} else {
			formula = dieCount + "d" + dieSize;
			label = "Rolling " + formula + ":";
		}

		let roll = new Roll(formula);
		await roll.evaluate();
		roll.toMessage({
			speaker: ChatMessage.getSpeaker({actor: this.actor}),
			flavor: label,
		});
	}

	/**
	 * Send this actor's flat attributes to the chat log
	 */
	shareFlatAttributes() {
		ChatMessage.create({
			speaker: {actor: this},
			content: this.getFlatAttributeString(),
		});
		let message = new ChatMessage();
		console.log(message);
	}

	getFlatAttributeString() {
		const attrStrings = [];
		for (const attribute in this.system.attributes.flat) {
			const attr = this.system.attributes.flat[attribute];
			attrStrings.push(attr.label + ": " + attr.value.toString());
		}
		return attrStrings.join("<br>");
	}
}

export class WeightClass {
	static maxClass = 4;
	static minClass = 0;
	constructor(value) {
		if (value < WeightClass.minClass || value > WeightClass.maxClass) {
			throw new Error(
				`WeightClass value must be between ${WeightClass.minClass.toString()} and ${WeightClass.maxClass.toString()} (received ${value.toString()})`
			);
		}
		this.value = value;
		switch (value) {
			case 4:
				this.label = "Ultra Light";
				break;
			case 3:
				this.label = "Light";
				break;
			case 2:
				this.label = "Medium";
				break;
			case 1:
				this.label = "Heavy";
				break;
			case 0:
				this.label = "Ultra Heavy";
				break;
		}
	}
	static evaluateWeightClass(weight, shift) {
		var baseWeightClass;
		if (weight < 11) {
			baseWeightClass = 3;
		} else if (weight < 21) {
			baseWeightClass = 2;
		} else {
			baseWeightClass = 1;
		}

		var weightClass = baseWeightClass + shift;
		weightClass =
			weightClass < WeightClass.minClass
				? WeightClass.minClass
				: weightClass;
		weightClass =
			weightClass > WeightClass.maxClass
				? WeightClass.maxClass
				: weightClass;
		console.log("Calculated weight: " + weightClass.toString());

		return new WeightClass(weightClass);
	}
}
