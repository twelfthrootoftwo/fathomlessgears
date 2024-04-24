import { ITEM_TYPES } from "../constants.js";
import {Frame, FramePC, FrameNPC} from "./frame.js"
import { HLMItem } from "./item.js";

export function createItem(itemData) {
    switch(itemData.type) {
        case ITEM_TYPES.frame_pc: {
            FramePC.createPCFrame(itemData);
        }
        default: {
            console.log(`No item reation for ${itemData.type}`)
        }
    }
}