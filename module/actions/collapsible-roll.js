import {Utils} from "../utilities/utils.js"

export async function constructCollapsibleRollMessage(roll) {
    let html=await roll.render();
    const collapseString=`<section class="tooltip-part">`;

    //eslint-disable-next-line no-useless-escape
    const formulaRegex = new RegExp(`<div class="dice-formula">[0-9,d,+, ]*<\/div>`);
    const collapseRegex =new RegExp(collapseString);

    const result=html.match(formulaRegex)[0];  
    html=html.replace(formulaRegex,"");

    const location=html.match(collapseRegex);
    html=Utils.insertIntoString(html, result, location["index"]+collapseString.length);
    return html;
}