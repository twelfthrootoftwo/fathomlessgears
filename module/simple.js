/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { HLMActorSheet } from "./actor-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Hook, Line & Mecha System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  game.hooklineandmecha = {
    SimpleActor,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hooklineandmecha", HLMActorSheet, { makeDefault: true });

  // Register initiative setting.
  game.settings.register("hooklineandmecha", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });
});

/**
 * Adds the actor template context menu.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {

  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return !actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("hooklineandmecha", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("hooklineandmecha", "isTemplate", false);
    }
  });
});

