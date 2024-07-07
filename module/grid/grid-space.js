import { GRID_SPACE_STATE } from "../constants.js";

export class GridSpace {
    state
    internal
    parentRegion
    highlight
    id

    constructor(json,parent) {
        if(json==null) {
            this.state=GRID_SPACE_STATE.locked;
            this.internal=null;
        } else {
            this.state=json.state;
            this.internal=json.internal;
            this.id=json.id;
        }
        this.parentRegion=parent;
        this.highlight=false;
    }

    prepJson() {
        const jsonRecord={};
        jsonRecord.state=this.state;
        jsonRecord.internal=this.internal;
        jsonRecord.id=this.id;
        return jsonRecord;
    }

    setState(state) {
        this.state=state;
    }

    setInternal(uuid) {
        this.internal=uuid;
    }

    toggleBroken() {
        switch(this.state) {
            case GRID_SPACE_STATE.locked:
                return false;
            case GRID_SPACE_STATE.intact:
                this.setState(GRID_SPACE_STATE.broken);
                if(this.internal) {
                    this.parentRegion.checkInternal(this.internal);
                }
                break;
            case GRID_SPACE_STATE.broken:
                this.setState(GRID_SPACE_STATE.intact);
                if(this.internal) {
                    this.parentRegion.checkInternal(this.internal);
                }
                break;
            default:
                return false
        }
    }
}