import chalk from "chalk";
import commandLineArgs from "command-line-args";
import { sprintf } from "sprintf-js";
import { terminal } from "terminal-kit";
import { __ } from "i18n";

import SubCommandNotFoundError from "../errors/sub-command-not-found";
import BackgroundViolationError from "../errors/background-violation";
import SessionNotFoundError from "../errors/session-not-found";

import manager from "../manager-instance";

import CliComponents from "../utils/cli/components";
import parseHostname from "../utils/hostname";

import { Client } from "../modules/native/clients";

import { Command } from "./base";

/**
 * Manage / Attach the sessions.
 */
export default class Session extends Command<string> {
    /**
     * Constructor.
     */
    public constructor() {
        super(
            "session",
            "Manage / Attach the sessions.",
            [],
            [ "sessions" ]
        );
    }

    public async execute(options: string): Promise<number> {
        const { logger, sessions } = manager;
        const subCommand = options.trim().split(" ")[0];

        return await {
            "attach": async () => {
                const name = options.trim().split(" ")[1];
                const isID = /\b[\da-f]{8}\b(?:-[\da-f]{4}){3}-\b[\da-f]{12}\b/.test(name);
                const sessionsWithoutAttached = sessions.sessions.filter((session: Client) => sessions.attaching !== session.id);

                if (isID) {
                    if (!sessionsWithoutAttached.map((session: Client) => session.id).some((sessionId: string) => name === sessionId)) {
                        throw new SessionNotFoundError();
                    }

                    sessions.attachSession(name);

                    process.stdout.pause();

                    logger.success(sprintf(__("Successfully attached to session %s %s."), chalk.cyanBright(sessionsWithoutAttached.find((session: Client) => name === session.id).name), chalk`{dim (${name})}`));
                } else {
                    if (!sessionsWithoutAttached.map((session: Client) => session.name).some((sessionName: string) => name === sessionName)) {
                        throw new SessionNotFoundError();
                    }

                    const session = sessionsWithoutAttached.map((session: Client) => session.name).filter((sessionName: string) => name === sessionName).length > 1
                        ? (await terminal.brightWhite("Similar sessions found, which do you attach?")
                            .singleColumnMenu(sessionsWithoutAttached.filter((session: Client) => name === session.name)
                                .map((session: Client) => `${session.id} - ${session.hostname}`)).promise).selectedText.split(" ")[0]
                        : sessionsWithoutAttached.find((session: Client) => name === session.name).id;

                    console.log(session);

                    sessions.attachSession(session);
                    process.stdout.pause();
                    logger.success(sprintf(__("Successfully attached to session %s %s."), chalk.cyanBright(name), chalk`{dim (${session})}`));
                }

                return Promise.resolve(0);
            },
            "close": () => Promise.resolve(0),
            "create": () => {
                const parsed = commandLineArgs([{
                    alias: "b",
                    defaultValue: false,
                    name: "background",
                    type: Boolean
                }, {
                    alias: "n",
                    name: "name",
                    type: String
                }, {
                    alias: "r",
                    defaultValue: false,
                    name: "raw",
                    type: Boolean
                }, {
                    alias: "i",
                    defaultValue: false,
                    name: "ignore-test",
                    type: Boolean
                }, {
                    alias: "t",
                    defaultValue: false,
                    name: "token",
                    type: Boolean
                }, {
                    alias: "h",
                    defaultOption: true,
                    name: "host",
                    type: String
                }], { argv: options.trim().split(" ").slice(1) }) as {
                    background: boolean,
                    name: string,
                    raw: boolean,
                    "ignore-test": boolean,
                    token: boolean,
                    host: string
                };

                const sessionName = !("name" in parsed) ? `session${sessions.sessions.filter((session: Client) => /session\d*$/.test(session.name)).length}` : parsed.name;

                (async (parsed) => {
                    if (!parsed) {
                        throw new BackgroundViolationError();
                    }

                    await sessions.createSession(sessionName, parseHostname(parsed.host), parsed.token, parsed.raw, parsed["ignore-test"], !parsed.background);

                    logger.success(sprintf(__("Successfully created session %s."), chalk.cyanBright(sessionName)));
                })(parsed).then(r => r)["catch"]((error) => {
                    throw error;
                });

                return Promise.resolve(0);
            },
            "list": () => {
                console.log(CliComponents.heading(__("Sessions")));
                console.log(CliComponents.keyValueContent(sessions.sessions.map((session: Client) => ({ [chalk.blueBright(session.name)]: chalk.dim(session.id + (session.id === sessions.attaching ? __(" (attached)") : "")) })), 0, true));

                return Promise.resolve(0);
            }
        }[!subCommand || subCommand === "list"
            ? "list"
            : (subCommand
                ? subCommand as "create" | "list" | "attach" | "close"
                : (() => {
                    throw new SubCommandNotFoundError();
                })())]();
    }
}
