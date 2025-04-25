// Import Modules
import {HLMActor} from "./actors/actor.js";
import {HLMItem} from "./items/item.js";
import {HLMActorSheet} from "./sheets/actor-sheet.js";
import {HLMActiveEffect} from "./conditions/active-effect.js";
import {HLMToken, HLMTokenDocument, TokenDropHandler} from "./tokens/token.js";
import {preloadHandlebarsTemplates} from "./utilities/templates.js";
import {initialiseHelpers} from "./utilities/handlebars.js";
import {addFshManager} from "./data-files/fsh-manager.js";
import {HLMItemSheet} from "./sheets/item-sheet.js";
import {conditions, discoverConditions} from "./conditions/conditions.js";
import {GridHoverHUD} from "./tokens/grid-hover.js";
import {GRID_HUD_LOCATION} from "./constants.js";
import {RollHandler} from "./actions/roll-handler.js";
import {MessageHandler} from "./formatting/message-handler.js";
import {HUDActionCollection} from "./actions/hud-actions.js";
import {addRollableTables} from "./actions/roll-table.js";
import HLMFishModel from "./actors/fish-schema.js";
import HLMFisherModel from "./actors/fisher-schema.js";
import {
	HLMConditionModel,
	HLMInternalNPCModel,
	HLMInternalPCModel,
	HLMTagModel,
	HLMFrameModel,
	HLMSizeModel,
	HLMGridModel,
	HLMFishTemplateModel,
	HLMHistoryModel
} from "./items/base-item-schema.js";
import {IntroDialog} from "./dialogs/intro-dialog.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function () {
	console.log(`Initializing Fathomless Gears System`);

	game.fathomlessgears = {
		HLMActor,
		HLMItem
	};

	// Define custom Document classes
	CONFIG.Actor.documentClass = HLMActor;
	CONFIG.Actor.dataModels = {
		fisher: HLMFisherModel,
		fish: HLMFishModel
	};
	CONFIG.Item.documentClass = HLMItem;
	CONFIG.Item.dataModels = {
		tag: HLMTagModel,
		condition: HLMConditionModel,
		internal_pc: HLMInternalPCModel,
		internal_npc: HLMInternalNPCModel,
		frame: HLMFrameModel,
		size: HLMSizeModel,
		grid: HLMGridModel,
		template: HLMFishTemplateModel,
		history: HLMHistoryModel
	};
	CONFIG.Token.documentClass = HLMTokenDocument;
	CONFIG.Token.objectClass = HLMToken;
	CONFIG.ActiveEffect.documentClass = HLMActiveEffect;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("fathomlessgears", HLMActorSheet, {
		makeDefault: true
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("fathomlessgears", HLMItemSheet, {
		makeDefault: true
	});

	//Load templates
	await preloadHandlebarsTemplates();
	CONFIG.Combat.initiative = {
		formula: "20-@ballast.total.value + 0.1*@attributes.speed.value",
		decimals: 1
	};
	Hooks.on("renderSidebarTab", async (app, html) => {
		addFshManager(app, html);
	});

	initialiseHelpers();
});

Hooks.on("init", async function () {
	game.keybindings.register("fathomlessgears", "pinGrid", {
		name: "Lock HUD Grid Display",
		hint: "Locks or unlocks the grid currently displayed on the HUD",
		editable: [
			{
				key: "KeyG"
			}
		],
		onDown: () => {
			game.gridHover.toggleLock();
		},
		onUp: () => {},
		restricted: false, // Restrict this Keybinding to gamemaster only?
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});
});

export const system_ready = new Promise((success) => {
	Hooks.once("ready", async function () {
		MessageHandler.addMessageHandler();
		RollHandler.addRollHandler();
		HUDActionCollection.addHUDActions();
		TokenDropHandler.addTokenDropHandler();

		game.keybindings.initialize();
		//Post-init stuff goes here
		const gridCollection = await game.packs.get(
			"fathomlessgears.grid_type"
		);
		gridCollection.configure({ownership: {PLAYER: "NONE"}});

		game.settings.register("fathomlessgears", "gridHUDPosition", {
			name: "Grid HUD Position",
			hint: "The position of the grid HUD display",
			scope: "client",
			config: true,
			type: String,
			choices: {
				[GRID_HUD_LOCATION.bottomLeft]: "Bottom Left",
				[GRID_HUD_LOCATION.bottomRight]: "Bottom Right",
				[GRID_HUD_LOCATION.topLeft]: "Top Left",
				[GRID_HUD_LOCATION.topRight]: "Top Right"
			},
			default: GRID_HUD_LOCATION.topRight,
			onChange: (_value) => {
				game.gridHover.refresh();
			}
		});
		game.settings.register("fathomlessgears", "gridHUDOnHover", {
			name: "Show grid HUD on hover",
			hint: "If disabled, the grid HUD will only be visible via the lock hotkey",
			scope: "client",
			config: true,
			type: Boolean,
			default: true
		});
		GridHoverHUD.addGridHUD();

		game.settings.register("fathomlessgears", "datafiles", {
			name: "Source data files",
			hint: "Stores the datafile sources for frames, internals, sizes, etc",
			scope: "world",
			config: false,
			type: Array,
			default: [],
			requiresReload: false
		});
		const dataFiles = game.settings.get("fathomlessgears", "datafiles");

		game.settings.register("fathomlessgears", "introComplete", {
			name: "Has viewed & checked intro dialog",
			hint: "Stores the datafile sources for frames, internals, sizes, etc",
			scope: "world",
			config: false,
			type: Boolean,
			default: false,
			requiresReload: false
		});
		const introComplete = game.settings.get(
			"fathomlessgears",
			"introComplete"
		);

		if (dataFiles.length == 0 && !introComplete) {
			new IntroDialog();
		}

		CONFIG.statusEffects = foundry.utils.duplicate(conditions);
		game.availableConditionItems = discoverConditions();
		addRollableTables();
		Hooks.callAll("conditionListReady");

		console.log("Ready!");
		success();
	});
});
