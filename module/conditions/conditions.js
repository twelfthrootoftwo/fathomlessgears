import { AttributeElement } from "../actors/items-manager.js";
import { ATTRIBUTES } from "../constants.js";

export const CONDITIONS={
    blind: "blind",
    burdened: "burdened",
    concealed: "concealed",
    dazed: "dazed",
    doomed: "doomed",
    drained: "drained",
    evasive: "evasive",
    fatigued: "fatigued",
    focused: "focused",
    hover: "hover",
    ironclad: "ironclad",
    jammed: "jammed",
    quickened: "quickened",
    restrained: "restrained",
    slowed: "slowed",
    tranq: "tranq",
    wired: "wired"
}

export const conditions=[
    {
        id: CONDITIONS.blind,
        name: "CONDITIONS.blind",
        icon: "systems/fathomlessgears/assets/icons/Blind.png",
        statuses: ["blind"]
    },
    {
        id: CONDITIONS.burdened,
        name: "CONDITIONS.burdened",
        icon: "systems/fathomlessgears/assets/icons/Burdened.png",
        statuses: ["burdened"]
    },
    {
        id: CONDITIONS.concealed,
        name: "CONDITIONS.concealed",
        icon: "systems/fathomlessgears/assets/icons/Concealed.png",
        statuses: ["concealed"]
    },
    {
        id: CONDITIONS.dazed,
        name: "CONDITIONS.dazed",
        icon: "systems/fathomlessgears/assets/icons/Dazed.png",
        statuses: ["dazed"]
    },
    {
        id: CONDITIONS.doomed,
        name: "CONDITIONS.doomed",
        icon: "systems/fathomlessgears/assets/icons/Doomed.png",
        statuses: ["doomed"]
    },
    {
        id: CONDITIONS.drained,
        name: "CONDITIONS.drained",
        icon: "systems/fathomlessgears/assets/icons/Drained.png",
        statuses: ["drained"]
    },
    {
        id: CONDITIONS.evasive,
        name: "CONDITIONS.evasive",
        icon: "systems/fathomlessgears/assets/icons/Evasive.png",
        statuses: ["evasive"]
    },
    {
        id: CONDITIONS.fatigued,
        name: "CONDITIONS.fatigued",
        icon: "systems/fathomlessgears/assets/icons/Fatigued.png",
        statuses: ["fatigued"]
    },
    {
        id: CONDITIONS.focused,
        name: "CONDITIONS.focused",
        icon: "systems/fathomlessgears/assets/icons/Focused.png",
        statuses: ["focused"]
    },
    {
        id: CONDITIONS.hover,
        name: "CONDITIONS.hover",
        icon: "systems/fathomlessgears/assets/icons/Hover.png",
        statuses: ["hover"]
    },
    {
        id: CONDITIONS.ironclad,
        name: "CONDITIONS.ironclad",
        icon: "systems/fathomlessgears/assets/icons/Ironclad.png",
        statuses: ["ironclad"]
    },
    {
        id: CONDITIONS.jammed,
        name: "CONDITIONS.jammed",
        icon: "systems/fathomlessgears/assets/icons/Jammed.png",
        statuses: ["jammed"]
    },
    {
        id: CONDITIONS.quickened,
        name: "CONDITIONS.quickened",
        icon: "systems/fathomlessgears/assets/icons/Quickened.png",
        statuses: ["quickened"]
    },
    {
        id: CONDITIONS.restrained,
        name: "CONDITIONS.restrained",
        icon: "systems/fathomlessgears/assets/icons/Restrained.png",
        statuses: ["restrained"]
    },
    {
        id: CONDITIONS.slowed,
        name: "CONDITIONS.slowed",
        icon: "systems/fathomlessgears/assets/icons/Snared.png",
        statuses: ["slowed"]
    },
    {
        id: CONDITIONS.stalwart,
        name: "CONDITIONS.stalwart",
        icon: "systems/fathomlessgears/assets/icons/Stalwart.png",
        statuses: ["stalwart"]
    },
    {
        id: CONDITIONS.tranq,
        name: "CONDITIONS.tranq",
        icon: "systems/fathomlessgears/assets/icons/Tranq.png",
        statuses: ["tranq"]
    },
    {
        id: CONDITIONS.wired,
        name: "CONDITIONS.wired",
        icon: "systems/fathomlessgears/assets/icons/Wired.png",
        statuses: ["wired"]
    },
    {
        id: "hook1",
        name: "CONDITIONS.hook1",
        icon: "systems/fathomlessgears/assets/icons/Blue Hook.png",
        statuses: ["hook1"]
    },
    {
        id: "hook2",
        name: "CONDITIONS.hook2",
        icon: "systems/fathomlessgears/assets/icons/Green Hook.png",
        statuses: ["hook2"]
    },
    {
        id: "hook3",
        name: "CONDITIONS.hook3",
        icon: "systems/fathomlessgears/assets/icons/Orange Hook.png",
        statuses: ["hook3"]
    },
    {
        id: "hook4",
        name: "CONDITIONS.hook4",
        icon: "systems/fathomlessgears/assets/icons/Pink Hook.png",
        statuses: ["hook4"]
    },
    {
        id: "hook5",
        name: "CONDITIONS.hook5",
        icon: "systems/fathomlessgears/assets/icons/Purple Hook.png",
        statuses: ["hook5"]
    },
    {
        id: "hook6",
        name: "CONDITIONS.hook6",
        icon: "systems/fathomlessgears/assets/icons/Red Hook.png",
        statuses: ["hook6"]
    },
    {
        id: "hook7",
        name: "CONDITIONS.hook7",
        icon: "systems/fathomlessgears/assets/icons/Yellow Hook.png",
        statuses: ["hook7"]
    },
]

export const ATTRIBUTE_ONLY_CONDITIONS=[
    CONDITIONS.burdened,
    CONDITIONS.dazed,
    CONDITIONS.drained,
    CONDITIONS.evasive,
    CONDITIONS.fatigued,
    CONDITIONS.quickened,
    CONDITIONS.restrained,
    CONDITIONS.slowed,
    CONDITIONS.wired
]

export const IMPLEMENTED_CONDITIONS={
    burdened: {
        id: CONDITIONS.burdened,
        positive: [ATTRIBUTES.ballast],
        negative: [],
    },
    dazed: {
        id: CONDITIONS.dazed,
        positive: [],
        negative: [ATTRIBUTES.close,ATTRIBUTES.far,ATTRIBUTES.mental,ATTRIBUTES.power],
    },
    drained: {
        id: CONDITIONS.drained,
        positive: [],
        negative: [ATTRIBUTES.baseAP],
    },
    evasive: {
        id: CONDITIONS.evasive,
        positive: [ATTRIBUTES.evasion],
        negative: [],
    },
    fatigued: {
        id: CONDITIONS.fatigued,
        positive: [],
        negative: [ATTRIBUTES.willpower],
    },
    quickened: {
        id: CONDITIONS.quickened,
        positive: [],
        negative: [ATTRIBUTES.ballast],
    },
    restrained: {
        id: CONDITIONS.restrained,
        positive: [],
        negative: [ATTRIBUTES.evasion],
    },
    slowed: {
        id: CONDITIONS.slowed,
        positive: [],
        negative: [ATTRIBUTES.speed],
    },
    wired: {
        id: CONDITIONS.wired,
        positive: [ATTRIBUTES.baseAP],
        negative: [],
    }
}

export function applyAttributeModifyingEffect(actor,effect) {
    const statusName=effect.statuses.values().next().value;
    if(ATTRIBUTE_ONLY_CONDITIONS.includes(statusName)) {
        const thisEffect=findImplementedCondition(statusName);
        let effectCounter = foundry.utils.getProperty(effect, "flags.statuscounter.counter");
        if(!effectCounter) {
            effectCounter = new ActiveEffectCounter(1,effect.icon,effect);
        }
        applyConditionModifier(actor,thisEffect,Math.max(Math.min(effectCounter.value,3),-3));
    }
}

function findModifier(modifierList,modifierId) {
    let targetModifier=false;
    modifierList.forEach((modifier) => {
        if(modifier.source==modifierId) targetModifier=modifier;
    });
    return targetModifier;
}

function findImplementedCondition(statusName) {
    let targetCondition=null;
    Object.values(IMPLEMENTED_CONDITIONS).forEach((condition) => {
        if(condition.id==statusName) targetCondition=condition;
    })
    return targetCondition;
}

function applyConditionModifier(actor,condition,value) {
    condition.positive.forEach((attr) => {
        const targetModifierList=actor.system.attributes[attr].values.standard.additions;
        let existingModifier=findModifier(targetModifierList,condition.id)
        if(existingModifier) {
            if(value==0) {
                actor.removeAttributeModifier(attr,condition.id);
            } else if(value<=3) {
                existingModifier.value=value;
            }
        } else if(value!=0) {
            const newModifier=new AttributeElement(value,condition.id,"condition",game.i18n.localize(`CONDITIONS.${condition.id}`));
            targetModifierList.push(newModifier);
        }
    })
    condition.negative.forEach((attr) => {
        const targetModifierList=actor.system.attributes[attr].values.standard.additions;
        let existingModifier=findModifier(targetModifierList,condition.id)
        if(existingModifier) {
            if(value==0) {
                actor.removeAttributeModifier(attr,condition.id);
            } else if(value<=3) {
                existingModifier.value=-value;
            }
        } else if(value!=0) {
            const newModifier=new AttributeElement(-value,condition.id,"condition",game.i18n.localize(`CONDITIONS.${condition.id}`));
            targetModifierList.push(newModifier);
        }
    })
    actor.calculateAttributeTotals(false);
}