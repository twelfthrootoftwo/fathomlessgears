// Import Modules
import {HLMActor} from "./actor.js";
import {HLMItem} from "./item.js";
import {HLMActorSheet} from "./actor-sheet.js";
import {HLMToken, HLMTokenDocument} from "./token.js";
import {preloadHandlebarsTemplates} from "./templates.js";
import {FishDataHandler} from "./npcType.js";
import { initialiseHelpers } from "./handlebars.js";
import { addFshManager } from "./fsh-manager.js";


/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

let fishHandler = null;

/**
 * Init hook.
 */
Hooks.once("init", async function () {
	console.log(`Initializing Hook, Line & Mecha System`);

	game.hooklineandmecha = {
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
	Actors.registerSheet("hooklineandmecha", HLMActorSheet, {
		makeDefault: true,
	});

	//Load templates
	await preloadHandlebarsTemplates();
	CONFIG.Combat.initiative = {
		formula: "20-@ballast.total.value + 0.1*@attributes.flat.speed.value",
		decimals: 1,
	};

	const fishDataFile = "systems/hooklineandmecha/data/fish.json";
	game.fishHandler = new FishDataHandler();
	game.fishHandler.loadNPCData(fishDataFile);

	initialiseHelpers();
});

export const system_ready = new Promise((success) => {
	Hooks.once("ready", async function () {
		//Post-init stuff goes here
		Hooks.on("renderSidebarTab", async (app, html) => {
			addFshManager(app, html);
		});
		success();
	});
});
