import { GridSpace } from "./grid-space.js";

/**
 * Unpack a grid serial json into a Grid object
 * @param {string} gridJson JSON record prepresenting the grid object
 * @returns an unpacked Grid
 */
export async function constructGrid(actor) {
    const gridObject = new Grid(actor);
    const gridType=await actor.items.get(actor.system.gridType);
    let gridLayout=false;
    if(gridType.system.type=="fisher") {
        gridLayout=[[0,1],[1,0],[1,1],[1,2],[2,1]];
    }
    for(let i=0; i<gridType.system.hitRegions.length;i+=1) {
        let regionData=gridType.system.hitRegions[i];
        let regionDisplayPosition=[0,i]
        if(gridLayout) {
            regionDisplayPosition=gridLayout[i];
        }
        let region = new GridRegion(regionData.columns, regionData.rows,regionDisplayPosition,this);
        gridObject.gridRegions.push(region);
    }
    actor.system.grid=gridObject
    return gridObject
    console.log("Success!")
}

export class Grid {
    gridRegions
    actor

    constructor(actor) {
        this.actor=actor;
        this.gridRegions=[];
    }

    /**
     * Serialise this Grid item
     * @returns this Grid as a representative json (for saving to the actor document)
     */
    toJson() {
        return ""
    }

    checkInternal(uuid, intact) {
        const internal=this.actor.getItem(uuid);
        if (internal.isBroken == intact) {
            internal.toggleBroken();
        }
    }    
}

class GridRegion {
    displayPosition
    gridSpaces=[]
    parentGrid

    constructor(width,height,displayPosition,parent) {
        for (let i = 0; i < height; i++) {
            this.gridSpaces.push([])
            for (let j = 0; j < width; j++) {
                this.gridSpaces[i].push(new GridSpace(this));
            }
        }
        this.displayPosition={x: displayPosition[0], y: displayPosition[1]};
        this.parentGrid=parent;
    }

    highlightInternal(uuid,highlight) {
        this.gridSpaces.forEach((space) => {
            if(space.containsInternal(uuid)) {
                space.highlight=highlight;
            }
        });
    }

    checkInternal(uuid) {
        const intact=false;
        this.gridSpaces.forEach((space) => {
            if(space.containsInternal(uuid) && space.isIntact()) {
                intact=true;
            }
        });
        this.parentGrid.checkInternal(uuid,intact);
    }
}