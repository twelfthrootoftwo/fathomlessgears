import { ACTOR_TYPES } from "../constants.js";
import { Utils } from "../utilities/utils.js";

export class ReelHandler {
    static async reel(
        initiator,
        target,
        dieCount,
        flatModifier
    ) {
        const powerRoll = Utils.getRoller(
			dieCount,
			flatModifier
		);
		await powerRoll.evaluate();
        const reelMessageText=initiator.type==ACTOR_TYPES.fisher ? "MESSAGE.reelPC" : "MESSAGE.reelNPC"
        const reelMessage=game.i18n.localize(reelMessageText);
        const rollString=await renderTemplate(
            "systems/fathomlessgears/templates/partials/labelled-roll-partial.html",
            {
                label_left: game.i18n.localize("ROLLTEXT.reel").replace("_TARGET_NAME_", target.name),
                tooltip: `${powerRoll.formula}:  ${powerRoll.result}`,
                total: powerRoll.total,
                outcome: ""
            }
        )
        const displayString=
        `<div class="flex-col" style="align-items: center;">
            <img src="${initiator.img}" style="border:none; max-height: 150px;"/>
            <div style="font-size: 16px; font-weight: bold;">${reelMessage}</div>
            ${rollString}
        </div>`
        return displayString;
    }
}