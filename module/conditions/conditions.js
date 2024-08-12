import { AttributeElement } from "../actors/actor.js";
import { ATTRIBUTES } from "../constants.js";

export const conditions=[
    {
        id: "blind",
        name: "CONDITIONS.blind",
        icon: "systems/fathomlessgears/assets/icons/Blind.png",
    },
    {
        id: "burdened",
        name: "CONDITIONS.burdened",
        icon: "systems/fathomlessgears/assets/icons/Burdened.png",
    },
    {
        id: "concealed",
        name: "CONDITIONS.concealed",
        icon: "systems/fathomlessgears/assets/icons/Concealed.png",
    },
    {
        id: "dazed",
        name: "CONDITIONS.dazed",
        icon: "systems/fathomlessgears/assets/icons/Dazed.png",
    },
    {
        id: "doomed",
        name: "CONDITIONS.doomed",
        icon: "systems/fathomlessgears/assets/icons/Doomed.png",
    },
    {
        id: "drained",
        name: "CONDITIONS.drained",
        icon: "systems/fathomlessgears/assets/icons/Drained.png",
    },
    {
        id: "evasive",
        name: "CONDITIONS.evasive",
        icon: "systems/fathomlessgears/assets/icons/Evasive.png",
    },
    {
        id: "fatigued",
        name: "CONDITIONS.fatigued",
        icon: "systems/fathomlessgears/assets/icons/Fatigued.png",
    },
    {
        id: "focus",
        name: "CONDITIONS.focus",
        icon: "systems/fathomlessgears/assets/icons/Focused.png",
    },
    {
        id: "hover",
        name: "CONDITIONS.hover",
        icon: "systems/fathomlessgears/assets/icons/Hover.png",
    },
    {
        id: "ironclad",
        name: "CONDITIONS.ironclad",
        icon: "systems/fathomlessgears/assets/icons/Ironclad.png",
    },
    {
        id: "jammed",
        name: "CONDITIONS.jammed",
        icon: "systems/fathomlessgears/assets/icons/Jammed.png",
    },
    {
        id: "quickened",
        name: "CONDITIONS.quickened",
        icon: "systems/fathomlessgears/assets/icons/Quickened.png",
    },
    {
        id: "restrained",
        name: "CONDITIONS.restrained",
        icon: "systems/fathomlessgears/assets/icons/Restrained.png",
    },
    {
        id: "slowed",
        name: "CONDITIONS.slowed",
        icon: "systems/fathomlessgears/assets/icons/Snared.png",
    },
    {
        id: "tranq",
        name: "CONDITIONS.tranq",
        icon: "systems/fathomlessgears/assets/icons/Tranq.png",
    },
    {
        id: "wired",
        name: "CONDITIONS.wired",
        icon: "systems/fathomlessgears/assets/icons/Wired.png",
    },
    {
        id: "hook1",
        name: "CONDITIONS.hook1",
        icon: "systems/fathomlessgears/assets/icons/Blue Hook.png",
    },
    {
        id: "hook2",
        name: "CONDITIONS.hook2",
        icon: "systems/fathomlessgears/assets/icons/Green Hook.png",
    },
    {
        id: "hook3",
        name: "CONDITIONS.hook3",
        icon: "systems/fathomlessgears/assets/icons/Orange Hook.png",
    },
    {
        id: "hook4",
        name: "CONDITIONS.hook4",
        icon: "systems/fathomlessgears/assets/icons/Pink Hook.png",
    },
    {
        id: "hook5",
        name: "CONDITIONS.hook5",
        icon: "systems/fathomlessgears/assets/icons/Purple Hook.png",
    },
    {
        id: "hook6",
        name: "CONDITIONS.hook6",
        icon: "systems/fathomlessgears/assets/icons/Red Hook.png",
    },
    {
        id: "hook7",
        name: "CONDITIONS.hook7",
        icon: "systems/fathomlessgears/assets/icons/Yellow Hook.png",
    },
]

export const COUNTED_CONDITIONS={
    burdened: "burdened",
    dazed: "dazed",
    doomed: "doomed",
    drained: "drained",
    evasive: "evasive",
    fatigued: "fatigued",
    ironclad: "ironclad",
    quickened: "quickened",
    restrained: "restrained",
    tranq: "tranq",
    wired: "wired",
    hook1: "hook1",
    hook2: "hook2",
    hook3: "hook3",
    hook4: "hook4",
    hook5: "hook5",
    hook6: "hook6",
    hook7: "hook7",
}

export const IMPLEMENTED_CONDITIONS={
    dazed: "dazed"
}

export function initialiseEffectHooks() {
    Hooks.on("createActiveEffect",(activeEffect,diffData,userId) => {
        applyEffect(activeEffect.parent, activeEffect);
    });

    Hooks.on("deleteActiveEffect",(activeEffect,diffData,userId) => {
        deleteEffect(activeEffect.parent, activeEffect);
    });
    
    Hooks.on("updateActiveEffect", function(activeEffect, counterData, diffData, options, userId) {
        let effectCounter = foundry.utils.getProperty(counterData, "flags.statuscounter.counter");
        if (effectCounter) {
            updateEffect(activeEffect.parent, activeEffect)
        }
    });
}

export function applyEffect(actor,effect) {
    const statusName=effect.statuses.values().next().value;
    if(Object.values(IMPLEMENTED_CONDITIONS).includes(statusName)) {
        switch(statusName){
            case IMPLEMENTED_CONDITIONS.dazed:
                let effectCounter = foundry.utils.getProperty(effect, "flags.statuscounter.counter");
                applyDazed(actor,effectCounter.value);
                break;
        }
    }
}

export function updateEffect(actor,effect) {
    const statusName=effect.statuses.values().next().value;
    if(Object.values(IMPLEMENTED_CONDITIONS).includes(statusName)) {
        switch(statusName){
            case IMPLEMENTED_CONDITIONS.dazed:
                let effectCounter = foundry.utils.getProperty(effect, "flags.statuscounter.counter");
                applyDazed(actor,effectCounter.value);
                break;
        }
    }
}

export function deleteEffect(actor,effect) {
    const statusName=effect.statuses.values().next().value;
    if(Object.values(IMPLEMENTED_CONDITIONS).includes(statusName)) {
        switch(statusName){
            case IMPLEMENTED_CONDITIONS.dazed:
                applyDazed(actor,0);
                break;
        }
    }    
}

function applyDazed(actor,value) {
    const targetAttributes=[ATTRIBUTES.close,ATTRIBUTES.far,ATTRIBUTES.mental,ATTRIBUTES.power];
    targetAttributes.forEach((attr) => {
        const targetModifierList=actor.system.attributes[attr].values.standard.additions;
        let existingModifier=findModifier(targetModifierList,COUNTED_CONDITIONS.dazed)
        if(existingModifier) {
            if(value==0) {
                actor.removeAttributeModifier(attr,COUNTED_CONDITIONS.dazed);
            } else {
                existingModifier.value=-value;
            }
        } else if(value!=0) {
            const newModifier=new AttributeElement(-value,COUNTED_CONDITIONS.dazed,"condition",game.i18n.localize("CONDITIONS.dazed"));
            targetModifierList.push(newModifier);
        }
    })
    actor.calculateAttributeTotals();
}

function findModifier(modifierList,modifierId) {
    modifierList.forEach((modifier) => {
        if(modifier.source=modifierId) return modifier;
    });
    return false;
}