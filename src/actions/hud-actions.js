// import { conditions, CONDITIONS } from "../conditions/conditions";

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
				y: token.document.y
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
					let originalToken = tokens.filter(
						(token) =>
							token.document.baseActor._id ==
							createdToken.baseActor._id
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

					console.log(
						createdToken.actor.appliedEffects.filter((effect) => {
							console.log(effect.statuses);
							return effect.statuses.has("ballast");
						})
					);
					const effect = createdToken.actor.appliedEffects.filter(
						(effect) => {
							return effect.statuses.has("ballast");
						}
					)[0];
					let effectCounter = foundry.utils.getProperty(
						effect,
						"flags.statuscounter.counter"
					);
					if (!effectCounter) {
						effectCounter = new ActiveEffectCounter(
							createdToken.actor.system.attributes.ballast.total,
							effect.icon,
							effect
						);
					} else {
						effectCounter.value =
							createdToken.actor.system.attributes.ballast.total;
					}
					effect.setFlag("statuscounter", "counter", effectCounter);
					createdToken.setFlag(
						"fathomlessgears",
						"ballastToken",
						true
					);
					createdToken.setFlag(
						"fathomlessgears",
						"originalTokenReference",
						originalToken._id
					);
					originalToken.setFlag(
						"fathomlessgears",
						"ballastTokenReference",
						createdToken._id
					);
				});
			});
	}
}
