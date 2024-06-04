// Import Modules
import {HLMActor} from "./actors/actor.js";
import {HLMItem} from "./items/item.js";
import {HLMActorSheet} from "./sheets/actor-sheet.js";
import {HLMToken, HLMTokenDocument} from "./tokens/token.js";
import {preloadHandlebarsTemplates} from "./utilities/templates.js";
import { initialiseHelpers } from "./utilities/handlebars.js";
import { addFshManager } from "./data-files/fsh-manager.js";
import { HLMItemSheet } from "./sheets/item-sheet.js";


/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function () {
	console.log(`Initializing Hook, Line & Mecha System`);

	game.fathomlessgears = {
		HLMActor,
		HLMItem,
	};

	// Define custom Document classes
	CONFIG.Actor.documentClass = HLMActor;
	CONFIG.Item.documentClass = HLMItem;
	CONFIG.Token.documentClass = HLMTokenDocument;
	CONFIG.Token.objectClass = HLMToken;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("fathomlessgears", HLMActorSheet, {
		makeDefault: true,
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("fathomlessgears", HLMItemSheet, {
		makeDefault: true,
	});

	//Load templates
	await preloadHandlebarsTemplates();
	CONFIG.Combat.initiative = {
		formula: "20-@ballast.total.value + 0.1*@attributes.speed.value",
		decimals: 1,
	};
	Hooks.on("renderSidebarTab", async (app, html) => {
		addFshManager(app, html);
	});

	console.log("Initialising helpers")
	initialiseHelpers();
});

export const system_ready = new Promise((success) => {
	Hooks.once("ready", async function () {
		const gridCollection=await game.packs.get("fathomlessgears.grid_type");
		gridCollection.configure({ownership:{PLAYER:"NONE"}})
		//Post-init stuff goes here
		console.log("Ready!")
		success();
	});
});