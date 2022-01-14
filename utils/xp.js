exports.xpForNextLevel = level => {
    return 5 * (Math.pow(level, 2)) + 50 * level + 100;
};

exports.levelFromXP = xp => {
    let totalXP = 0;
    let level = 0;
    for (level; totalXP < xp; level++) totalXP += this.xpForNextLevel(level);
    return level - 1;
};

exports.totalXPToLevelXP = xp => {
    let totalXP = 0;
    let level = 0;
    const totalLevel = this.levelFromXP(xp);
    for (level; level < totalLevel; level++) totalXP += this.xpForNextLevel(level);
    return xp - totalXP;
};

/**
 * @param {string} user 
 * @param {string[]} levels 
 */
exports.rank = (user, levels) => {
    const _levels = levels.slice();
    _levels.sort((a, b) => b.xp - a.xp);
    return _levels.findIndex(l => l.id === user) + 1;
};