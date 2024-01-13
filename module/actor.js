/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

  /** @inheritdoc */
  prepareDerivedData() {
    console.log("Preparing derived data");
    super.prepareDerivedData();
    this.system.weightClass=WeightClass.evaluateWeightClass(this.system.attributes.weight.value, 0);
  }

  /* -------------------------------------------- */

  /**
   * Is this Actor used as a template for other Actors?
   * @type {boolean}
   */
  get isTemplate() {
    return !!this.getFlag("hooklineandmecha", "isTemplate");
  }

}

export class WeightClass {
  static maxClass=4;
  static minClass=0;
  constructor(value) {
    if(value<WeightClass.minClass || value > WeightClass.maxClass) {
      throw new Error(`WeightClass value must be between ${WeightClass.minClass.toString()} and ${WeightClass.maxClass.toString()} (received ${value.toString()})`);
    }
    this.value=value;
    switch(value) {
      case 4:
        this.label="Ultra Light";
        break;
      case 3:
        this.label="Light";
        break;
      case 2:
        this.label="Medium";
        break;
      case 1:
        this.label="Heavy";
        break;
      case 0:
        this.label="Ultra Heavy";
        break;
    }
  }
  static evaluateWeightClass(weight, shift) {
    var baseWeightClass;
    if(weight<11) {
      baseWeightClass=3;
    } else if(weight<21) {
      baseWeightClass=2;
    } else {
      baseWeightClass=1;
    }

    var weightClass=baseWeightClass+shift;
    weightClass=weightClass<WeightClass.minClass ? WeightClass.minClass : weightClass;
    weightClass=weightClass>WeightClass.maxClass ? WeightClass.maxClass : weightClass;
    console.log("Calculated weight: "+weightClass.toString());

    return new WeightClass(weightClass);
  }
}
