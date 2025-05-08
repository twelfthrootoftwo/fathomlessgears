// import { conditions, CONDITIONS } from "../conditions/conditions";
import {ACTOR_TYPES} from "../constants.js";
import {actionText} from "./basic-action-data.js";
import {ReserveApDialog} from "../dialogs/reserve-ap-dialog.js";

export class HUDActionCollection {
	static addHUDActions() {
		game.hudActions = new HUDActionCollection();
	}

	weightTotal() {
		//Originally written by VoidPhoenix, adapted with permission (thanks!)
		// For each selected token, add up its weight
		const selectedFish = canvas.tokens.controlled.filter((token) => {
			return token.actor.type == "fish";
		});
		let totalWeight = selectedFish.reduce((total, token) => {
			return (
				Number(total) +
				Number(token?.actor?.system?.attributes.weight.total ?? 0) +
				Number(
					token?.actor?.system?.attributes.weight.values.custom ?? 0
				)
			);
		}, 0);

		let images_html = selectedFish
			.map((token) => {
				return `<img src="${token.actor.img}" style="border:none; max-height: 30px; max-weight: 30px;"/>`;
			})
			.join("");

		// Print the result to chat.

		let message = `<div class="flex-col" style="align-items: center;">
                <div class="flex-row" style="align-items: center;">
                    ${images_html}
                </div>
            </div>
            <div style="font-size: 16px; font-weight: bold;">${game.i18n.localize("MESSAGE.totalweight")}: ${totalWeight}</div>
        </div>`;

		// Send to chat

		game.tagHandler.createChatMessage(message, false);
	}

	createBallastTokens() {
		const tokens = canvas.tokens.controlled;

		const newDocuments = [];
		tokens.forEach(async (token) => {
			const newDocument = await token.actor.getTokenDocument({
				x: token.document.x + canvas.grid.size * 8,
				y: token.document.y,
				flags: {fathomlessgears: {originalActor: token.actor.uuid}}
			});
			newDocuments.push(newDocument);
		});

		const ballastConditionId = {
			id: "ballast",
			name: "CONDITIONS.ballast",
			icon: "systems/fathomlessgears/assets/icons/Ballast.png",
			statuses: []
		};

		canvas.scene
			.createEmbeddedDocuments("Token", newDocuments)
			.then((createdTokenList) => {
				createdTokenList.forEach(async (createdToken) => {
					createdToken.update({height: 1, width: 1});
					await createdToken.setFlag(
						"fathomlessgears",
						"ballastToken",
						true
					);
					let originalToken = tokens.filter(
						(token) =>
							token.document.actor.uuid ==
							createdToken.flags.fathomlessgears.originalActor
					)[0].document;

					//Check if ballast condition already exists (eg for a linked actor that already had a token made)
					let ballastEffectList =
						createdToken.actor.appliedEffects.filter((effect) => {
							return effect.statuses.has("ballast");
						});
					if (ballastEffectList.length == 0) {
						await createdToken.toggleActiveEffect(
							ballastConditionId
						);
					}
					const effect = createdToken.actor.appliedEffects.filter(
						(effect) => {
							return effect.statuses.has("ballast");
						}
					)[0];
					await effect.setCounterValue(
						createdToken.actor.system.attributes.ballast.total
					);

					if (!originalToken.isLinked) {
						createdToken.actor.setFlag(
							"fathomlessgears",
							"originalActorReference",
							originalToken.actor.uuid
						);
						originalToken.actor.setFlag(
							"fathomlessgears",
							"ballastActorReference",
							createdToken.actor.uuid
						);
					}
					let createdTokenDrawn = canvas.tokens.placeables.filter(
						(token) => token.document.id == createdToken.id
					)[0];
					setTimeout(() => {
						createdTokenDrawn.drawEffects();
					}, 500);
				});
			});
	}

	scanTarget(speaker) {
		if (speaker.type == ACTOR_TYPES.fish) return false;
		const targetSet = game.user.targets;
		if (targetSet.size < 1) {
			//TODO allow choosing target afterwards
			ui.notifications.info(game.i18n.localize("MESSAGE.scannotarget"));
			return false;
		} else {
			const target = targetSet.values().next().value;
			const content = game.i18n
				.localize("MESSAGE.scantarget")
				.replace("_ACTOR_NAME_", speaker.name)
				.replace("_TARGET_NAME_", target.name);
			renderTemplate(
				"systems/fathomlessgears/templates/messages/message-outline.html",
				{
					heading: "Scan",
					body: content,
					ap: 1
				}
			).then((messageText) => {
				game.tagHandler.createChatMessage(messageText, speaker);
			});
		}
	}

	textAction(speaker, actionCode) {
		const actionRecord = actionText[actionCode];
		renderTemplate(
			"systems/fathomlessgears/templates/messages/message-outline.html",
			{
				heading: actionRecord.name,
				body: actionRecord.text,
				ap: actionRecord.ap
			}
		).then((messageText) => {
			game.tagHandler.createChatMessage(messageText, speaker);
		});
	}

	calculateRepairCost(speaker) {
		if (speaker.type == ACTOR_TYPES.fish) return false;
		const requirements = speaker.getRepairRequirements();
		const spacesCost = Math.round(requirements.damagedSpaces / 2);
		const repairCost = requirements.missingRepairKits * 2;
		const resupply = 10;
		const total = spacesCost + repairCost + resupply;

		renderTemplate(
			"systems/fathomlessgears/templates/messages/repair-costs.html",
			{
				heading: game.i18n
					.localize("MESSAGE.repairCost")
					.replace("_ACTOR_NAME_", speaker.name),
				spacesCost: spacesCost,
				repairKitsCost: repairCost,
				resupplyCost: resupply,
				total: total
			}
		).then((messageText) => {
			game.tagHandler.createChatMessage(messageText, speaker);
		});
	}

	holdAp(actor) {
		new ReserveApDialog(actor);
	}
}
