import {RESOURCES} from "../constants.js";
import HLMActorModel from "./base-actor-schema.js";

export default class HLMFisherModel extends HLMActorModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = {
			required: true,
			nullable: false,
			integer: true
		};
		const labelSchema = new fields.SchemaField({
			name: new fields.StringField({
				required: true,
				initial: "New Label"
			}),
			description: new fields.StringField({
				required: true,
				initial: ""
			})
		});
		const schema = super.defineSchema();

		schema.resources = new fields.SchemaField(
			Object.values(RESOURCES).reduce((obj, resourceName) => {
				obj[resourceName] = new fields.SchemaField({
					key: new fields.StringField({
						required: true,
						initial: resourceName
					}),
					value: new fields.NumberField({
						...requiredInteger,
						initial: 0
					}),
					min: new fields.NumberField({
						...requiredInteger,
						initial: 0
					}),
					max: new fields.NumberField({
						...requiredInteger,
						initial: 0
					})
				});
				return obj;
			}, {})
		);

		schema.fisher_history = new fields.SchemaField({
			character_name: new fields.StringField({
				required: true,
				blank: true
			}),
			callsign: new fields.StringField({
				required: true,
				blank: true
			}),
			background: new fields.StringField({
				required: true,
				blank: true
			}),
			el: new fields.NumberField({
				...requiredInteger,
				initial: 0
			})
		});

		schema.downtime = new fields.SchemaField({
			novok: new fields.NumberField({
				...requiredInteger,
				initial: 0
			}),
			labels: new fields.ArrayField(labelSchema)
		});

		schema.biography = new fields.StringField({
			required: true,
			initial: "Good at catching fish"
		});
		schema.frame = new fields.StringField({
			required: true,
			blank: true
		});
		schema.gear_name = new fields.StringField({
			required: true,
			blank: true
		});
		schema.pilot_portrait = new fields.StringField({
			required: true,
			initial: "icons/svg/mystery-man.svg"
		});
		schema.grid = new fields.StringField({
			required: true,
			initial: "systems/fathomlessgears/assets/blank-grid.jpg"
		});

		return schema;
	}
}
