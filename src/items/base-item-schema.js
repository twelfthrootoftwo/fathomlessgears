import {ATTRIBUTES} from "../constants.js";

const fields = foundry.data.fields;
const requiredInteger = {
	required: true,
	nullable: false,
	integer: true
};
function getSourceSchema() {
	return new fields.SchemaField({
		filename: new fields.StringField({
			required: true,
			blank: true
		}),
		version: new fields.StringField({
			required: true,
			blank: true
		})
	});
}

function getAttributeSchema() {
	return new fields.SchemaField(
		Object.values(ATTRIBUTES).reduce((obj, attrName) => {
			obj[attrName] = new fields.NumberField({
				...requiredInteger,
				initial: 0
			});
			return obj;
		}, {})
	);
}

export class HLMTagModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.source = getSourceSchema();
		schema.value = new fields.NumberField({
			required: true,
			nullable: true
		});
		schema.roll = new fields.SchemaField(
			{
				formula: new fields.StringField(),
				success: new fields.NumberField({
					required: true,
					nullable: true
				})
			},
			{nullable: true}
		);
		schema.text = new fields.StringField({
			required: true,
			blank: true
		});
		return schema;
	}
}

export class HLMConditionModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.attributes = getAttributeSchema();
		schema.value = new fields.NumberField({
			required: true,
			nullable: true
		});
		schema.text = new fields.StringField({
			required: true,
			blank: true
		});
		schema.limit = new fields.BooleanField();
		schema.effectName = new fields.StringField({
			required: true,
			blank: true
		});
		return schema;
	}
}

export class HLMInternalNPCModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.source = getSourceSchema();
		schema.attributes = getAttributeSchema();
		schema.action_text = new fields.StringField({
			required: true,
			blank: true
		});
		schema.ap_cost = new fields.NumberField({
			required: true,
			nullable: true,
			integer: true,
			initial: 0
		});
		schema.attack = new fields.SchemaField(
			{
				type: new fields.StringField(),
				attribute: new fields.StringField({
					choices: Object.values(ATTRIBUTES)
				}),
				damage: new fields.NumberField({
					...requiredInteger,
					initial: 0
				}),
				marbles: new fields.NumberField({
					...requiredInteger,
					initial: 0
				}),
				range: new fields.NumberField({
					...requiredInteger,
					initial: 0
				})
			},
			{nullable: true}
		);
		schema.repair_kits = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.tags = new fields.ArrayField(
			new fields.SchemaField({
				name: new fields.StringField({
					required: true,
					blank: true
				}),
				value: new fields.NumberField({
					required: true,
					integer: true,
					nullable: true,
					initial: 0
				})
			})
		);
		schema.type = new fields.StringField({
			required: true,
			blank: true
		});
		schema.grid_coords = new fields.ArrayField(
			new fields.SchemaField({
				x: new fields.NumberField({
					...requiredInteger,
					initial: 0
				}),
				y: new fields.NumberField({
					...requiredInteger,
					initial: 0
				})
			})
		);
		return schema;
	}
}

export class HLMInternalPCModel extends HLMInternalNPCModel {
	static defineSchema() {
		const schema = super.defineSchema();
		schema.section = new fields.StringField({
			required: true,
			blank: true
		});
		return schema;
	}
}

export class HLMFrameModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.source = getSourceSchema();
		schema.attributes = getAttributeSchema();
		schema.core_integrity = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.repair_kits = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.weight_cap = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.gear_ability = new fields.StringField({
			required: true,
			blank: true
		});
		schema.gear_ability_name = new fields.StringField({
			required: true,
			blank: true
		});
		schema.default_unlocks = new fields.ArrayField(
			new fields.NumberField({nullable: false})
		);
		return schema;
	}
}

export class HLMSizeModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.source = getSourceSchema();
		schema.attributes = getAttributeSchema();
		return schema;
	}
}

export class HLMGridModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.hitLocationRoll = new fields.StringField({
			required: true,
			blank: true
		});
		schema.hitRegions = new fields.ArrayField(
			new fields.SchemaField({
				location: new fields.StringField({
					required: true,
					blank: true
				}),
				range: new fields.ArrayField(
					new fields.NumberField({
						...requiredInteger,
						initial: 0
					})
				),
				columns: new fields.NumberField({
					...requiredInteger,
					initial: 0
				}),
				rows: new fields.NumberField({
					...requiredInteger,
					initial: 0
				})
			})
		);
		schema.type = new fields.StringField({
			required: true,
			blank: true
		});
		schema.bashDamage = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.threatDisplayMarbles = new fields.NumberField({
			required: false,
			nullable: false,
			integer: true,
			initial: 0
		});
		return schema;
	}
}

export class HLMFishTemplateModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.attributes = getAttributeSchema();
		return schema;
	}
}

export class HLMHistoryModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.attributes = getAttributeSchema();
		schema.type = new fields.StringField({
			required: true,
			blank: true
		});
		schema.description = new fields.StringField({
			required: true,
			blank: true
		});
		schema.mechanics = new fields.StringField({
			required: true,
			blank: true
		});
		return schema;
	}
}
