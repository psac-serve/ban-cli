import { Position } from "../../utils/lexing";

import LexingError from "./base";

export default class InvalidIPv4Error extends LexingError {
    constructor(public startPosition: Position, public endPosition: Position) {
        super("Invalid IPv4 address.", startPosition, endPosition);
    }
}