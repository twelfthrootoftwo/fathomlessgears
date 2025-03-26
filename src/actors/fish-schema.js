import HLMActorModel from "./base-actor-schema.js";

export default class HLMFishModel extends HLMActorModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		schema.size = new fields.StringField({required: true, blank: true});
		schema.template = new fields.StringField({
			required: true,
			initial: "Common"
		});
		schema.grid = new fields.StringField({
			required: true,
			initial: "systems/fathomlessgears/assets/blank-grid.jpg"
		});

		return schema;
	}
}
