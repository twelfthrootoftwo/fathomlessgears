import { GridSpace } from "./grid-space.js";

/**
 * Unpack a grid serial json into a Grid object
 * @param {string} gridJson JSON record prepresenting the grid object
 * @returns an unpacked Grid
 */
export async function constructGrid(actor) {
    const gridObject = new Grid(null);
    gridObject.actor=actor;
    const gridType=await actor.items.get(actor.system.gridType);
    for(let i=0; i<gridType.system.hitRegions.length;i+=1) {
        if((i==0 || i==4) && gridType.system.type=="fisher") {
            gridObject.gridRegions.push(null);
        }
        let regionData=gridType.system.hitRegions[i];
        let region = new GridRegion({width: regionData.columns, height: regionData.rows},this);
        gridObject.gridRegions.push(region);
        if((i==0 || i==4) && gridType.system.type=="fisher") {
            gridObject.gridRegions.push(null);
        }
    }
    actor.system.grid=gridObject.toJson();
    console.log(actor.system.grid);
    return gridObject
}

export class Grid {
    gridRegions
    actor

    constructor(json) {
        if(json == null) {
            this.actor=null;
            this.gridRegions=[];
        } else {
            const baseObj=JSON.parse(json);
            this.actor=game.actors.get(baseObj.actor);
            this.gridRegions=[];
            baseObj.gridRegions.forEach((region) => {
                this.gridRegions.push(new GridRegion(region,this));
            })
        }
    }

    /**
     * Serialise this Grid item
     * @returns this Grid as a representative json (for saving to the actor document)
     */
    toJson() {
        const copyGrid=new Grid(null);
        copyGrid.actor=this.actor._id;
        this.gridRegions.forEach((region) => {
            if(!region) {
                copyGrid.gridRegions.push(null)
            } else {
                copyGrid.gridRegions.push(region?.prepJson())
            }
        })
        return JSON.stringify(copyGrid);
    }

    checkInternal(uuid, intact) {
        const internal=this.actor.getItem(uuid);
        if (internal.isBroken == intact) {
            internal.toggleBroken();
        }
    }    
}

class GridRegion {
    width
    height
    gridSpaces=[]
    parentGrid

    constructor(json,parent) {
        this.width=json.width;
        this.height=json.height;
        for (let i = 0; i < json.height; i++) {
            this.gridSpaces.push([])
            for (let j = 0; j < json.width; j++) {
                if(json.gridSpaces) {
                    this.gridSpaces[i].push(new GridSpace(json.gridSpaces[i][j], this));
                } else {
                    this.gridSpaces[i].push(new GridSpace(null, this));
                }
            }
        }
        this.parentGrid=parent;
    }

    prepJson() {
        const jsonRecord={};
        jsonRecord.width=this.width;
        jsonRecord.height=this.height;
        jsonRecord.gridSpaces=[]
        this.gridSpaces.forEach((row) => {
            let rowRecord=[]
            row.forEach((space) => {
                rowRecord.push(space.prepJson());
            })
            jsonRecord.gridSpaces.push(rowRecord);
        })
        return jsonRecord;
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