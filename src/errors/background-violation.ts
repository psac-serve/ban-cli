import { __ } from "i18n";

/**
 * Use this error when detects and conflicts background commands.
 */
export default class BackgroundViolationError extends Error {
    constructor() {
        super(__("Detected violation on background processing."));
    }
}
