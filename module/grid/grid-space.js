import { GRID_SPACE_STATE } from "../constants.js";

export class GridSpace {
    state
    internal
    parentRegion
    highlight
    id

    /**
     * Construct a space from an optional json record object
     * @param {Object} json The parsed json object for this grid space
     * @param {GridRegion} parent The region this space sits in
     */
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

    /**
     * Construct a JSON-ready encoding object
     * @returns the object encoding this space as a JSON
     */
    prepJson() {
        const jsonRecord={};
        jsonRecord.state=this.state;
        jsonRecord.internal=this.internal;
        jsonRecord.id=this.id;
        return jsonRecord;
    }

    /**
     * Assigns a state to this space
     * @param {GRID_SPACE_STATE} state 
     */
    setState(state) {
        this.state=state;
    }

    /**
     * Assigns an internal to this space
     * @param {str} uuid The uuid of the internal
     */
    setInternal(uuid) {
        this.internal=uuid;
    }

    /**
     * Toggle whether this space is intact/broken
     * @returns True if a state was switched, False otherwise (eg if this space is locked)
     */
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

    /**
     * Performs any on-click actions
     */
    triggerClick() {
        this.toggleBroken();
        console.log(`State of ${this.id} set to ${this.state}`)
    }
}