import { FILE_CONTENTS } from "./constants";

/**
 * Looks at a file name to determine what type of info it contains
 * @param {str} fileName : Name of file to identify
 */
export function identifyType(fileName) {
    FILE_CONTENTS.values().foreach((content_type) => {
        if(fileName.contains(content_type)) {
            return FILE_CONTENTS[content_type];
        }
    })
    return null;
}