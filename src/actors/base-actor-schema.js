import {ATTRIBUTES} from "../constants.js";

export default class HLMActorModel extends foundry.abstract.TypeDataModel {
	/**
	 * Actors from a v12 world store each attribute's modifier list
	 * (`values.standard.additions`, and `values.bonus` for non-ballast
	 * attributes) as an array of {value, source, type, label} elements - see
	 * this file's git history around "Use object for modifiers", which changed
	 * both fields from ArrayField to ObjectField, keyed by each element's own
	 * `source` id, without changing the element shape itself.
	 *
	 * Foundry's schema cleaning only accepts a plain object for an ObjectField -
	 * an array fails that check and is silently reset to {} (see
	 * foundry.data.fields.ObjectField#_cast, which only keeps a value when
	 * getType(value) === "Object"). That's why a migrated v12 actor keeps its
	 * correct attribute totals (a plain NumberField, unaffected by this) but
	 * loses its modifier breakdown entirely.
	 *
	 * migrateData runs on the raw source data before that cleaning step (see
	 * DataModel#_initializeSource), so converting the shape here preserves the
	 * original values instead of losing them to the cast. Safe to run on an
	 * already-migrated actor too - only array-shaped lists are touched.
	 * @param {object} source
	 */
	static migrateData(source) {
		const attributes = source?.attributes;
		if (attributes) {
			for (const attr of Object.values(attributes)) {
				HLMActorModel.#migrateModifierList(
					attr?.values?.standard,
					"additions"
				);
				HLMActorModel.#migrateModifierList(attr?.values, "bonus");
			}
		}
		return super.migrateData(source);
	}

	/**
	 * Converts one array-shaped modifier list at parent[key] (if it is one) into
	 * the object-keyed-by-source shape the current schema expects, in place.
	 * @param {object} parent
	 * @param {string} key
	 */
	static #migrateModifierList(parent, key) {
		const list = parent?.[key];
		if (!Array.isArray(list)) return;
		const converted = {};
		for (const element of list) {
			if (!element?.source) continue;
			converted[element.source] = element;
		}
		parent[key] = converted;
	}

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = {
			required: true,
			nullable: false,
			integer: true
		};
		// const attributeElement = new fields.AnyField();
		// const attributeElement = new fields.SchemaField({
		// 	value: new fields.NumberField({
		// 		...requiredInteger
		// 	}),
		// 	source: new fields.StringField({
		// 		required: true,
		// 		blank: false
		// 	}),
		// 	type: new fields.StringField({
		// 		required: true,
		// 		blank: false,
		// 		choices: [
		// 			"internal",
		// 			"development",
		// 			"template",
		// 			"condition",
		// 			"history"
		// 		]
		// 	}),
		// 	label: new fields.StringField({
		// 		required: true,
		// 		blank: false
		// 	})
		// });
		const schema = {};

		// schema.attributes = new fields.AnyField({});
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
								// additions: new fields.ArrayField(
								// 	new fields.ObjectField({})
								// )
								additions: new fields.ObjectField()
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
								additions: new fields.ObjectField()
							}),
							bonus: new fields.ObjectField(),
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
