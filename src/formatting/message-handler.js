import {ITEM_TYPES} from "../constants.js";
import {constructCollapsibleRollMessage} from "../actions/collapsible-roll.js";

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
		Hooks.on("renderChatMessage", () => {
			setTimeout(() => {
				this.addListeners();
			}, 50);
		});
	}

	addListeners() {
		//Tags
		const tagItems = document.querySelectorAll(".tag-display.no-listener");
		tagItems.forEach((tagElement) => {
			tagElement.addEventListener("mouseenter", (ev) =>
				this.onTagHover(ev)
			);
			tagElement.addEventListener("mouseleave", (ev) =>
				this.onTagEndHover(ev)
			);
			tagElement.addEventListener(
				"click",
				(ev) => this.onTagClick(ev),
				true
			);

			tagElement.classList.remove("no-listener");
			tagElement.classList.add("btn-active");
		});

		//Rollable tag buttons
		const tagRollButtons = document.querySelectorAll(
			".tag-roll-btn.no-listener"
		);
		tagRollButtons.forEach((button) => {
			button.addEventListener(
				"click",
				(ev) => this.onTagReroll(ev),
				true
			);
			button.classList.remove("no-listener");
			button.classList.add("btn-active");
		});

		//Narrative dice
		const narrativeRollMessages = document.querySelectorAll(
			".narrative-roll-message.no-listeners"
		);
		narrativeRollMessages.forEach((narrativeRollMessage) => {
			this.addNarrativeListeners(narrativeRollMessage);
		});
	}

	loadItemTypes() {
		this.tagItemTypes = [ITEM_TYPES.condition, ITEM_TYPES.tag];
	}

	/**
	 * Parses messages and adds additional formatting
	 * @param {string} messageBody The text/HTML body of the message
	 * @param {User} speaker The player to attach the message to
	 */
	async createChatMessage(messageBody, speaker) {
		const parser = new DOMParser();
		const messageDoc = parser.parseFromString(messageBody, "text/html");

		this.transformTagNameToButton(
			$(messageDoc).get(0),
			FormatterContext.message
		);

		let create = {
			content: messageDoc.body.innerHTML
		};
		if (speaker) {
			create.speaker = ChatMessage.getSpeaker({actor: speaker});
		}

		await ChatMessage.create(create);
	}

	/**
	 * Gather the items that are referenced during formatting
	 */
	loadTags() {
		let itemPacks = game.packs.filter((p) => p.metadata.type === "Item");
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
			let alternateText = tag.system.alternateName || "NULL";
			//Convert plaintext items into tags
			if (tag.system.value != null) {
				const re = new RegExp(
					` (?:${tag.name}|${alternateText}) (\\d\\+?)`,
					"i"
				);
				const result = re.exec(text);
				if (result) {
					text = text.replace(
						re,
						this.formatTagItem(tag, result[1], context)
					);
				}
			} else {
				let re = new RegExp(` (?:${tag.name}|${alternateText})`, "i");
				let result = re.exec(text);

				if (result) {
					text = text.replace(
						re,
						this.formatTagItem(tag, false, context)
					);
				}
			}

			//Convert existing tags to enriched versions
			if (tag.system.value != null) {
				const re = new RegExp(
					`<div class="tag-display no-listener format-me" id="${tag.name}">(?:${tag.name}|${alternateText}) (\\d\\+?)</div>`,
					"i"
				);
				const result = re.exec(text);
				if (result) {
					text = text.replace(
						re,
						this.formatTagItem(tag, result[1], context)
					);
				}
			} else {
				const re = new RegExp(
					`<div class="tag-display no-listener format-me" id="${tag.name}">(?:${tag.name}|${alternateText})</div>`,
					"i"
				);
				const result = re.exec(text);
				if (result) {
					text = text.replace(
						re,
						this.formatTagItem(tag, false, context)
					);
				}
			}
		});

		return text;
	}

	formatTagItem(tag, value, context) {
		switch (tag.type) {
			case ITEM_TYPES.condition:
				return this.conditionToDisplay(tag, value, context);
			case ITEM_TYPES.tag:
				return this.tagTextToDisplay(tag, value, context);
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

	tagTextToDisplay(tag, value, _context) {
		let valueText = "";
		let valueHTMLTag = "";
		if (value) {
			valueText = ` ${value}`;
			valueHTMLTag = ` data-value=${value}`;
		}
		return `<div class="tag-display inline-block no-listener"${valueHTMLTag} data-tagItemId="${tag.uuid}">${tag.name}${valueText}</div>`;
	}

	async getTagRollDisplay(tagRoll) {
		let roll = new Roll(tagRoll.formula);
		await roll.evaluate();

		let success = roll.total >= tagRoll.success;
		let rollSpecs = JSON.stringify(tagRoll);

		let html = await renderTemplate(
			"systems/fathomlessgears/templates/partials/tag-roll.html",
			{
				roll: await constructCollapsibleRollMessage(roll),
				outcome: success
					? game.i18n.localize("TAG.success")
					: game.i18n.localize("TAG.failure"),
				rollspecs: rollSpecs,
				tagName: tagRoll.name
			}
		);
		return html;
	}

	async onTagReroll(ev) {
		let rollSpecs = JSON.parse(ev.target.dataset.rollspecs);
		let rollDisplay = await this.getTagRollDisplay(rollSpecs);
		ChatMessage.create({content: rollDisplay});
	}

	checkNodeShouldBeFormatted(node) {
		let containsText = Boolean(node.innerText?.length > 0);

		let correctLocation = false;
		let targetClasses = ["format-me"];
		targetClasses.forEach((className) => {
			if (node.classList?.contains(className)) {
				correctLocation = true;
			}
		});

		return containsText && correctLocation;
	}

	transformTagNameToButton(node, context) {
		if (this.checkNodeShouldBeFormatted(node)) {
			let newText = this.formatText(
				node.classList?.contains("tag-display")
					? node.outerHTML
					: node.innerText,
				context
			);
			if (node.classList?.contains("tag-display")) {
				node.outerHTML = newText;
			} else {
				node.innerHTML = newText;
			}
		}

		node.childNodes.forEach((node) => {
			this.transformTagNameToButton(node, context);
		});
	}

	onTagHover(event) {
		fromUuid(event.target.dataset.tagitemid).then((tagData) => {
			const popout = document.createElement("div");
			popout.classList.add("tag-popout", "popout", "flex-col");
			renderTemplate(
				"systems/fathomlessgears/templates/partials/tag-tooltip.html",
				{
					tag: tagData
				}
			).then((html) => {
				popout.innerHTML = html;
				game.tooltip.activate(event.target, {
					content: popout
				});
				//game.tooltip.lockTooltip();
			});
		});
	}

	onTagEndHover(_event) {
		game.tooltip.deactivate();
	}

	onTagClick(event) {
		event.stopPropagation();
		const uuid =
			event.target.dataset.tagitemid || event.target.dataset.uuid;
		fromUuid(uuid).then(async (tagData) => {
			let roll = null;
			if (tagData.system.roll) {
				let rollSpecs = foundry.utils.deepClone(tagData.system.roll);
				if (tagData.system.roll.success === null) {
					rollSpecs.success = event.target.dataset.value;
				}
				rollSpecs.name = tagData.name;
				roll = await this.getTagRollDisplay(rollSpecs);
			}
			renderTemplate(
				"systems/fathomlessgears/templates/messages/tag-message.html",
				{
					tag: tagData,
					roll: roll
				}
			).then((html) => {
				ChatMessage.create({
					content: html
				});
			});
		});
	}

	getTags() {
		return foundry.utils.deepClone(this.tagItems);
	}

	addNarrativeListeners(narrativeMessage) {
		const diceElements =
			narrativeMessage.getElementsByClassName("narrative-die");
		for (let dieElement of diceElements) {
			dieElement.addEventListener("mouseenter", (ev) =>
				this.onDieHover(ev)
			);
			dieElement.addEventListener("mouseleave", (ev) =>
				this.onDieEndHover(ev)
			);
			dieElement.addEventListener(
				"click",
				(ev) => this.onDieClick(ev),
				true
			);
		}
		const rerollButtons = narrativeMessage.getElementsByClassName(
			"narrative-reroll-button"
		);
		for (let rerollButton of rerollButtons) {
			rerollButton.addEventListener("click", (ev) =>
				this.onNarrativeRerollClick(ev)
			);
		}
		narrativeMessage.classList.remove("no-listeners");
	}

	onDieHover(event) {
		event.target.closest(".narrative-die").classList.add("show-lock");
	}
	onDieEndHover(event) {
		event.target.closest(".narrative-die").classList.remove("show-lock");
	}
	onDieClick(event) {
		const locking = event.target
			.closest(".narrative-die")
			.classList.contains("unlocked");
		event.target.closest(".narrative-die").classList.toggle("locked");
		event.target.closest(".narrative-die").classList.toggle("unlocked");

		const message = event.target.closest(".narrative-roll-message");
		const marbleCost = message.querySelector(".marble-reroll-cost");
		adjustMarbleCost(marbleCost, locking);
	}
	onNarrativeRerollClick(event) {
		const message = event.target.closest(".narrative-roll-message");
		const dice = extractNarrativeDiceSet(
			message.querySelectorAll(".narrative-dice-row")
		);
		const params = JSON.parse(event.target.dataset.params);
		const rerollFlag = event.target.classList.contains("reroll-1");
		console.log(`Reroll flag: ${rerollFlag}`);
		game.rollHandler.rollNarrative(params, dice, rerollFlag ? 2 : 1);
	}
}

function extractNarrativeDiceSet(diceHolderElements) {
	const rolls = [];
	for (let holder of diceHolderElements) {
		const diceElements = holder.getElementsByClassName("narrative-die");
		for (let dieElement of diceElements) {
			const innerDie = dieElement.querySelector(".die");
			const dieState = {
				locked: dieElement.classList.contains("locked"),
				value: parseInt(innerDie.innerHTML)
			};
			rolls.push(dieState);
		}
	}
	return rolls;
}

function adjustMarbleCost(marbleCostElement, isLocking) {
	let currentVal = parseInt(marbleCostElement.innerHTML);
	currentVal = currentVal + (isLocking ? 1 : -1);
	marbleCostElement.innerHTML = currentVal;
}
