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

  game.hooklineandmecha = {
    SimpleActor,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hooklineandmecha", HLMActorSheet, { makeDefault: true });

  CONFIG.Combat.initiative={
    formula: "10*@weightClass.value+@attributes.speed.value",
    decimals: 2
  };
});

