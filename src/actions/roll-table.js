import {Utils} from "../utilities/utils.js";
import {constructCollapsibleRollMessage} from "./collapsible-roll.js";

export class RollTableHandler {
	constructor() {
		//TODO
	}

	async createRollTableResult(actor, table, compendiumName, label) {
		const roll = await table.roll();
		const result = roll.results[0];

		const item = await Utils.findCompendiumItemFromName(
			compendiumName,
			result.text
		);

		const message = await this.getRenderedHistory(
			roll,
			result,
			item,
			label
		);

		game.tagHandler.createChatMessage(message, actor);
	}

	async rollInjury(actor) {
		const table = await Utils.findCompendiumItemFromName(
			"fg_roll_tables",
			"Injuries"
		);

		this.createRollTableResult(actor, table, "injuries", "Injury table");
	}

	async rollTouch(actor) {
		let backlash = 0;

		if (!actor) {
			const targetSet = canvas.tokens.controlled;
			if (targetSet.size < 1) {
				ui.notifications.warn(
					"Select an actor to roll Touch of the Deep"
				);
				return;
			} else {
				const target = targetSet.values().next().value;
				backlash = target.actor.system.resources.backlash.value;
			}
		} else {
			backlash = actor.system.resources.backlash.value;
		}

		const table = await Utils.findCompendiumItemFromName(
			"fg_roll_tables",
			"Touch of the Deep"
		);
		table.formula = `2d6+${backlash.toString()}`;

		this.createRollTableResult(
			actor,
			table,
			"touch_of_the_deep",
			"Touch of the Deep"
		);
	}

	async rollMeltdown(actor) {
		const table = await Utils.findCompendiumItemFromName(
			"fg_roll_tables",
			"Meltdown"
		);

		const roll = await table.roll();
		const result = roll.results[0];

		const message = await this.getRenderedMeltdown(roll, result);

		game.tagHandler.createChatMessage(message, actor);
	}

	async getRenderedHistory(roll, result, item, label) {
		const rollString = await constructCollapsibleRollMessage(roll.roll);
		const itemReference = `@UUID[Compendium.${result.documentCollection}.Item.${item._id}]{${item.name}}`;

		const message = await renderTemplate(
			"systems/fathomlessgears/templates/messages/history-table-roll-message.html",
			{
				rollTitle: label,
				rollString: rollString,
				history: item,
				reference: itemReference
			}
		);

		return message;
	}

	async getRenderedMeltdown(roll, result) {
		const rollString = await constructCollapsibleRollMessage(roll.roll);

		const message = await renderTemplate(
			"systems/fathomlessgears/templates/messages/meltdown-table-roll-message.html",
			{
				title: "Meltdown",
				rollString: rollString,
				result: result
			}
		);

		return message;
	}
}

export function addRollableTables() {
	game.rollTables = new RollTableHandler();
}
