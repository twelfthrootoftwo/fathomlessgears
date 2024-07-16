// Import Modules
import {HLMActor} from "./actors/actor.js";
import {HLMItem} from "./items/item.js";
import {HLMActorSheet} from "./sheets/actor-sheet.js";
import {HLMToken, HLMTokenDocument} from "./tokens/token.js";
import {preloadHandlebarsTemplates} from "./utilities/templates.js";
import {initialiseHelpers} from "./utilities/handlebars.js";
import {FshManager, addFshManager} from "./data-files/fsh-manager.js";
import {HLMItemSheet} from "./sheets/item-sheet.js";
import {conditions} from "./conditions/conditions.js";
import {GridHoverHUD} from "./tokens/grid-hover.js";

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

	game.keybindings.register("fathomlessgears", "pinGrid", {
		name: "Lock HUD Grid Display",
		hint: "Locks or unlocks the grid currently displayed on the HUD",
		editable: [
			{
				key: "G",
			},
		],
		onDown: () => {
			canvas.hud.gridHover.toggleLock();
		},
		onUp: () => {},
		restricted: false, // Restrict this Keybinding to gamemaster only?
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});

	console.log("Initialising helpers");
	initialiseHelpers();

	GridHoverHUD.initialiseHooks();
});

export const system_ready = new Promise((success) => {
	Hooks.once("ready", async function () {
		//Post-init stuff goes here
		const gridCollection = await game.packs.get(
			"fathomlessgears.grid_type"
		);
		gridCollection.configure({ownership: {PLAYER: "NONE"}});

		game.settings.register("fathomlessgears", "datafiles", {
			name: "Source data files",
			hint: "Stores the datafile sources for frames, internals, sizes, etc",
			scope: "world",
			config: false,
			type: Array,
			default: [],
			requiresReload: false,
		});
		const dataFiles = game.settings.get("fathomlessgears", "datafiles");

		if (dataFiles.length == 0) {
			new Dialog({
				title: game.i18n.localize("INTRO.title"),
				content: "<p>" + game.i18n.localize("INTRO.main") + "</p>",
				buttons: {
					cancel: {
						label: "Skip for now",
					},
					confirm: {
						label: "Open .FSH Manager",
						callback: async () => {
							if (!FshManager.isOpen) {
								new FshManager();
							}
						},
					},
				},
				default: "confirm",
			}).render(true);
		}

		CONFIG.statusEffects = foundry.utils.duplicate(conditions);

		console.log("Ready!");
		success();
	});
});
