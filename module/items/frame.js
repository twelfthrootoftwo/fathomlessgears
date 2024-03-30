import { HLMItem } from "./item.js";
import {Utils} from "../utilities/utils.js"

export class Frame extends HLMItem {
    attributes
    frame_name
}

export class FrameNPC extends Frame {
    attributes
    frame_name

    /**
     * Create a new NPC Frame item
     * @param {Object} frame_data Readin of frame data file
     * @param {str} name Name of this frame
     */
    static createNPCFrame(frame_data) {
        Item.create(frame_data)
        this.attributes=new FrameAttributes(frame_data);
        this.name=Utils.capitaliseWords(frame_data.name);
    }   
}

export class FramePC extends Frame {
    attributes
    ability
    resources
    frame_name

    /**
     * Create a new PC Frame item
     * @param {Object} frame_data Readin of frame data file
     * @param {str} name Name of this frame
     */
    static createPCFrame(frame_data) {
        Item.create(frame_data)
        this.ability=new Ability(frame_data.gear_ability_name, frame_data.gear_ability)
        this.resources=new FrameResources(frame_data);
        this.frame_name=Utils.capitaliseWords(frame_data.name);
    }    
}

class Ability {
    text
    ability_name
    constructor(name,text) {
        this.ability_name=name;
        this.text=text;
    }
}

class FrameAttributes {
    ap
    ballast
    close
    far
    evade
    mental
    power
    sensor
    speed
    weight_cap
    willpower

    constructor(frame_data) {
        const isPC=frame_data.ap;

        if(isPC) {
            this.ap=frame_data.ap;
            this.evade=frame_data.evade;
            this.ballast=frame_data.ballast;
            this.power=frame_data.power;
            this.weight_cap=frame_data.weight_cap;
        } else {
            this.willpower=frame_data.willpower;
            this.mental=frame_data.mental;
        }
        this.close=frame_data.close;
        this.far=frame_data.far;
        this.sensor=frame_data.sensor;
        this.speed=frame_data.speed;
    }
}

class FrameResources {
    core_integrity
    repair_kits

    constructor(frame_data) {
        this.core_integrity = new Resource(frame_data.core_integrity);
        this.repair_kits = new Resource(frame_data.repair_kits);
    }
}

class Resource {
    current
    max
    min

    constructor(max) {
        this.current = max;
        this.max = max;
        this.min = 0;
    }
}