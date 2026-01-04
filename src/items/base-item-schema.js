import {ATTRIBUTES} from "../constants.js";

const fields = foundry.data.fields;
const requiredInteger = {
	required: true,
	nullable: false,
	integer: true
};
function getSourceSchema() {
	return new fields.ObjectField();
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
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
		schema.turnEnd = new fields.StringField({
			required: true,
			blank: true
		});
		schema.alternateName = new fields.StringField({
			required: false,
			blank: false
		});
		return schema;
	}
}

export class HLMInternalNPCModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.source = getSourceSchema();
		schema.attributes = getAttributeSchema();
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
		schema.attack = new fields.ObjectField({
			nullable: true,
			required: false
		});
		schema.repair_kits = new fields.NumberField({
			...requiredInteger,
			initial: 0
		});
		schema.tags = new fields.ArrayField(new fields.ObjectField());
		schema.type = new fields.StringField({
			required: true,
			blank: true
		});
		schema.grid_coords = new fields.ArrayField(new fields.ObjectField());
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
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
		return schema;
	}
}

export class HLMGridModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
		return schema;
	}
}

export class HLMHistoryModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};
		schema.attributes = getAttributeSchema();
		schema.string_id = new fields.StringField({
			required: true,
			initial: "-"
		});
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
