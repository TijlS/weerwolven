const checkWinConditions = (players) => {
	let alive = players.filter((p) => p.isDead != true);

	// ALL WEREWOLVES ARE DEAD
	if (alive.filter((p) => p.role == "werewolf").length == 0) {
		return { endGame: true, winnerGroup: "good" };
		// LESS FARMERS THAN WEREWOLVES
	} else if (
		alive.filter((p) => {
			if (
				p.role == "farmer" ||
				p.role == "seer" ||
				p.role == "cupido" ||
				p.role == "witch" ||
				p.role == "hunter"
			) {
				return true;
			}
			return false;
		}).length <= alive.filter((p) => p.role == "werewolf").length
	) {
		return { endGame: true, winnerGroup: "bad" };
	} else {
		return { endGame: false };
	}
};

module.exports = {
	checkWinConditions,
};
