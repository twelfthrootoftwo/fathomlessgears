import {ITEM_TYPES} from "../constants.js";

export const FormatterContext = {
	message: "message",
	sheet: "sheet"
};

export class MessageHandler {
	static addMessageHandler() {
		game.tagHandler = new MessageHandler();
	}

	constructor() {
		this.loadItemTypes();
		this.loadTags();
		this.addListeners();
		this.addConditionItemListener();
		Hooks.on("addTagListeners", () => this.addListeners());
	}

	addListeners() {
		//Nothing to do here - this function is used in subclasses
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
		let formattedMessage = this.formatText(
			messageBody,
			FormatterContext.message
		);

		await ChatMessage.create({
			speaker: {actor: speaker},
			content: formattedMessage
		});
	}

	/**
	 * Gather the items that are referenced during formatting
	 */
	loadTags() {
		let itemPacks = game.packs.filter((p) => p.metadata.type === "Item");
		if (game.sensitiveDataAvailable) {
			itemPacks = itemPacks.filter(
				(p) => p.metadata.name !== "conditions_base"
			);
		}
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

	formatText(text, context) {
		this.tagItems.forEach((tag) => {
			if (tag.system.value) {
				const re = new RegExp(` ${tag.name} (\\d\\+?)`);
				const result = re.exec(text);
				if (result) {
					text = text.replace(
						re,
						this.formatTagItem(tag, result[1], context)
					);
				}
			} else {
				text = text.replace(
					` ${tag.name}`,
					this.formatTagItem(tag, false, context)
				);
			}
		});

		return text;
	}

	formatTagItem(tag, value, context) {
		switch (tag.type) {
			case ITEM_TYPES.condition:
				return this.conditionToDisplay(tag, value, context);
			default:
				return tag.name;
		}
	}

	conditionToDisplay(condition, value, context) {
		let valueText = "";
		let valueHTMLTag = "";
		if (value) {
			valueText = ` ${value}`;
			valueHTMLTag = ` data-value=${value}`;
		}
		let itemText = "";
		let withCode = "";
		if (context == FormatterContext.message) {
			itemText = `@UUID[${condition.uuid}]{${condition.name}${valueText}}`;
			withCode = " with-item-code";
		} else {
			itemText = `${condition.name}${valueText}`;
		}

		return `<div class="tag-display${withCode} inline-block no-listener"${valueHTMLTag} data-tagItemId="${condition.uuid}">${itemText}</div>`;
	}

	addConditionItemListener() {
		document.body.addEventListener("dragstart", (event) => {
			if (
				event.target.parentElement.classList.contains("with-item-code")
			) {
				const value = event.target.parentElement.dataset.value;
				event.stopPropagation();
				let dataTransfer = {
					type: "Item",
					uuid: event.target.dataset.uuid
				};
				if (value) {
					dataTransfer.value = value;
				}
				event.dataTransfer.setData(
					"text/plain",
					JSON.stringify(dataTransfer)
				);
			}
		});
	}
}
