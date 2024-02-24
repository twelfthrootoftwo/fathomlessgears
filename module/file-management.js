import { FILE_CONTENTS } from "./constants.js";

/**
 * Looks at a file name to determine what type of info it contains
 * @param {str} fileName : Name of file to identify
 */
export function identifyType(fileName) {
	let result=null
    Object.values(FILE_CONTENTS).forEach((content_type) => {
        if(fileName.includes(content_type)) {
            result=FILE_CONTENTS[content_type];
        }
    })
    return result;
}

export async function readDataFiles() {
	console.log("Reading files")
	const storageDir="systems/hooklineandmecha/storage/";
	const files=await FilePicker.browse("data",storageDir,{extensions: [".json"]})
	console.log(files.files)
	files.files.forEach((file) => {
		//ideally this would read each file and then categorise data based on the contents, but there's nothing in the file to indicate what it contains
		const fileType=identifyType(file)
		switch(fileType) {
			case FILE_CONTENTS.fish:
				game.fishHandler.loadNPCData(file);
				break;
			case FILE_CONTENTS.item_data:
				console.log("Reading internals");
				break;
			case FILE_CONTENTS.frame_data:
				console.log("Reading frames");
				break;
			default:
				console.log("File type not recognised")
				break;
		}
	})
}