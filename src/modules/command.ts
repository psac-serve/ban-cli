import { Command as AnotherCommand } from "../commands/base";
import Exit from "../commands/exit";
import Modules from "../commands/modules";
import Help from "../commands/help";

import CommandNotFoundError from "../errors/command-not-found";

import Module from "./base";

export default class Command extends Module {
    constructor(private _commands: AnotherCommand<string | undefined>[] = [], public execute: { [command: string]: (options: string) => number }[] = [{}]) {
        super("Command", "Parse / Run the commands.");
    }

    get commands(): string[] {
        return this._commands.map(command => command.name);
    }

    init(): Promise<void> {
        this.enabled = true;
        this._commands = [ new Exit(), new Modules(), new Help() ];

        return Promise.resolve();
    }

    use(): { commands: (command: string) => number, list: { [command: string]: (options: string) => number }[] } {
        return {
            commands: (command: string): number => (command.split(" ")[0] in this.execute[0]
                ? this.execute[0][command.split(" ")[0]](command.split(" ").slice(1).join(" "))
                : (() => {
                    throw new CommandNotFoundError();
                })()),
            list: this.execute
        };
    }

    close(): Promise<void> {
        this._commands = [];
        this.enabled = false;

        return Promise.resolve();
    }
}
