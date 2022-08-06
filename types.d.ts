import type { ChatInputCommandInteraction, Client, Collection, SlashCommandBuilder } from "discord.js"
import Enmap from "enmap"
import RE2 from "re2"

export type Level = {
    id: string,
    xp: number
}

export type LevelRole = {
    id: string,
    level: number
}

export type Warn = {
    user: string,
    mod: string,
    reason: string,
    date: number
}

export type Settings = {
    prefix: string,
    logChannel: string,
    verifyRole: string,
    jailRole: string,
    modRoles: string[],
    logFlags: number,
    badWords: string[],
    badNames: string[][],
    antiSpam: boolean,
    jailedUsers: string[],
    levelSystem: boolean,
    levelRoles: LevelRole[],
    levels: Level[],
    warns: Warn[]
};

export type Command = {
    commands: SlashCommandBuilder[],
    run: (client: ClientExt, intr: ChatInputCommandInteraction, guildSettings: Settings) => void
    buttonPress: (client: ClientExt, intr: ChatInputCommandInteraction, guildSettings: Settings) => void
};

export interface ClientExt extends Client {
    guildSettings: Enmap<string, Settings>,
    badWords: Collection<string, RE2[]>,
    badNames: Collection<string, [RE2, string][]>,
    commands: { [key: string]: Command },
    loadCommands: () => void,
    loadEvents: () => void,
    regenWordRegex: (guildID: string) => void,
    regenNameRegex: (guildID: string) => void
};