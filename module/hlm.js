/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { HLMActor } from "./actor.js";
import { HLMActorSheet } from "./actor-sheet.js";
import { HLMToken, HLMTokenDocument } from "./token.js"

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Hook, Line & Mecha System`);

  game.hooklineandmecha = {
    HLMActor,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = HLMActor;
  CONFIG.Token.documentClass = HLMTokenDocument;
  CONFIG.Token.objectClass = HLMToken;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hooklineandmecha", HLMActorSheet, { makeDefault: true });

  CONFIG.Combat.initiative={
    formula: "10*@weightClass.value+@attributes.speed.value",
    decimals: 2
  };
});

