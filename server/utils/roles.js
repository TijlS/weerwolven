const ENV = "dev";

const roleConf = require(`../config/roles.${ENV}.json`);

const giveTempRoles = (number) => {
	switch (number) {
		case 0:
			return "farmer";
		case 1:
			return "werewolf";
		case 2:
			return "seer";
		case 3:
			return "hunter";
		case 4:
			return "cupido";
		case 5:
			return "witch";
	}
};

const giveRoles = (players) => {
	console.log("STARTED GIVING ROLES");

	let amountPlayers = players.length;

	console.log("Players: " + amountPlayers);

	if (amountPlayers <= 0) {
		return;
	}
	if (amountPlayers > 10) {
		amountPlayers = "bigger";
	}

	console.log("Players after check: " + amountPlayers);

	let roles = JSON.parse(JSON.stringify(roleConf[amountPlayers]));

	console.log("Role config:");
	console.log(roles);

	i = 0;
	let whileRan = 0;
	for (const player of players) {
		console.log(`Player ${i}:`);
		console.log(player);

		let number = Math.floor(Math.random() * Object.keys(roles).length);
		console.log(`Rolled number: ${number}`);

		let roleTemp;
		roleTemp = giveTempRoles(number);
		console.log(`Temp role: ${roleTemp}`);

		//PREVENT USERS FROM GETTING ROLE THAT IS NOT AVAILIBLE
		while (roles[roleTemp] == 0) {
			whileRan++;

			if (whileRan > 20) {
				throw new Error("ERR WHILE GIVING ROLES");
			}

			console.log("Role can't be chosen, rolling other number");
			//IF PLAYERS >= 10 && ALL OTHER ROLES ARE 0, SET ROLE TO FARMER
			if (amountPlayers == "bigger") {
				if (
					roles.werewolf == 0 &&
					roles.seer == 0 &&
					roles.hunter == 0 &&
					roles.cupido == 0 &&
					roles.witch == 0
				) {
					number = 0;
				} else {
					number = Math.floor(
						Math.random() * Object.keys(roles).length
					);
				}
			} else {
				number = Math.floor(Math.random() * Object.keys(roles).length);
			}
			console.log(`New number: ${number}`);
			roleTemp = giveTempRoles(number);
			console.log(`New temp role: ${roleTemp}`);
		}

		if (amountPlayers == "bigger" && number == 0) {
			//more then 10 players, so increase farmer role
			player.role = "farmer";
		} else {
			switch (number) {
				case 0:
					roles.farmer -= 1;
					player.role = "farmer";
					break;
				case 1:
					roles.werewolf -= 1;
					player.role = "werewolf";
					break;
				case 2:
					roles.seer -= 1;
					player.role = "seer";
					break;
				case 3:
					roles.hunter -= 1;
					player.role = "hunter";
					break;
				case 4:
					roles.cupido -= 1;
					player.role = "cupido";
					break;
				case 5:
					roles.witch -= 1;
					player.role = "witch";
					break;
			}
		}
		console.log(
			`Player ${i} has role of ${player.role}, going to next player`
		);
		i++;
	}

	return players;
};

module.exports = {
	giveRoles,
	roleConf,
};
