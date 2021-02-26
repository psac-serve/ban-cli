import Context from "../../../lang/interpreter/context";

import Position from "../../../lang/position";

import RuntimeError from "./base";

export default class ReferenceError extends RuntimeError {
    public constructor(public name: string, public context: Context, public startPosition: Position, public endPosition: Position) {
        super(`${name} is not defined`, context, startPosition, endPosition);
    }
}
