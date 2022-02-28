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