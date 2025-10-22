import {ATTRIBUTES} from "../constants.js";

const fields = foundry.data.fields;
const requiredInteger = {
	required: true,
	nullable: false,
	integer: true
};

function newAttributeElement() {
	return new fields.SchemaField({
		value: new fields.NumberField({
			...requiredInteger
		}),
		source: new fields.StringField({
			required: true,
			blank: false
		}),
		type: new fields.StringField({
			required: true,
			blank: false,
			choices: [
				"internal",
				"development",
				"template",
				"condition",
				"history"
			]
		}),
		label: new fields.StringField({
			required: true,
			blank: false
		})
	});
}

export default class HLMActorModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const schema = {};

		schema.attributes = new fields.SchemaField(
			Object.values(ATTRIBUTES).reduce((obj, attrName) => {
				if (attrName == ATTRIBUTES.ballast) {
					obj[attrName] = new fields.SchemaField({
						values: new fields.SchemaField({
							standard: new fields.SchemaField({
								base: new fields.NumberField({
									...requiredInteger,
									initial: 0
								}),
								weight: new fields.NumberField({
									...requiredInteger,
									initial: 0
								}),
								additions: new fields.ArrayField(
									newAttributeElement()
								)
							}),
							custom: new fields.NumberField({
								...requiredInteger,
								initial: 0
							})
						}),
						total: new fields.NumberField({
							...requiredInteger,
							initial: 0
						}),
						key: new fields.StringField({
							required: true,
							blank: false,
							initial: attrName
						})
					});
				} else {
					obj[attrName] = new fields.SchemaField({
						values: new fields.SchemaField({
							standard: new fields.SchemaField({
								base: new fields.NumberField({
									...requiredInteger,
									initial: 0
								}),
								additions: new fields.ArrayField(
									newAttributeElement()
								)
							}),
							bonus: new fields.ArrayField(newAttributeElement()),
							custom: new fields.NumberField({
								...requiredInteger,
								initial: 0
							})
						}),
						total: new fields.NumberField({
							...requiredInteger,
							initial: 0
						}),
						key: new fields.StringField({
							required: true,
							blank: false,
							initial: attrName
						})
					});
				}
				return obj;
			}, {})
		);

		schema.internals = new fields.ArrayField(new fields.StringField({}));
		schema.gridType = new fields.StringField({required: true, blank: true});

		return schema;
	}
}
