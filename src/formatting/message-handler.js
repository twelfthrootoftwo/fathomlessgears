import {ITEM_TYPES} from "../constants.js";

export class MessageHandler {
	static addMessageHandler() {
		game.tagHandler = new MessageHandler();
	}

	constructor() {
		this.loadItemTypes();
		this.loadTags();
	}

	loadItemTypes() {
		this.tagItemTypes = [ITEM_TYPES.condition];
	}

	/**
	 * Parses messages and adds additional formatting
	 * @param {string} messageBody The text/HTML body of the message
	 * @param {User} speaker The player to attach the message to
	 */
	async createChatMessage(messageBody, speaker) {
		let formattedMessage = this.formatText(messageBody);

		await ChatMessage.create({
			speaker: {actor: speaker},
			content: formattedMessage
		});
	}

	/**
	 * Gather the items that are referenced during formatting
	 */
	loadTags() {
		const itemPacks = game.packs.filter((p) => p.metadata.type === "Item");
		this.tagItems = [];

		itemPacks.forEach((pack) => {
			pack.getDocuments().then((allItems) => {
				this.tagItems.push(
					...allItems.filter((item) =>
						this.tagItemTypes.includes(item.type)
					)
				);
			});
		});
	}

	formatText(text) {
		this.tagItems.forEach((tag) => {
			if (tag.system.value) {
				const re = new RegExp(` ${tag.name} (\\d\\+?)`);
				const result = re.exec(text);
				if (result) {
					text = text.replace(re, this.formatTagItem(tag, result[1]));
				}
			} else {
				text = text.replace(` ${tag.name}`, this.formatTagItem(tag));
			}
		});

		return text;
	}

	formatTagItem(tag, value) {
		switch (tag.type) {
			case ITEM_TYPES.condition:
				return this.conditionToDisplay(tag, value);
			default:
				return tag.name;
		}
	}

	conditionToDisplay(condition, value) {
		if (condition.system.value && value) {
			condition.system.value = value;
		}
		let valueText = "";
		if (value) {
			valueText = ` ${value}`;
		}
		const itemText = `@UUID[${condition.uuid}]{${condition.name}${valueText}}`;
		return `<div class="tag-display inline-block no-listener" id="${condition.uuid}">${itemText}</div>`;
	}
}
