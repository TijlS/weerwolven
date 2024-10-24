const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const { v4: uuidV4 } = require("uuid");
require("dotenv").config();
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const io = new Server(httpServer, {
	cors: {
		origin: ["https://admin.socket.io"],
		credentials: true,
	},
});
const cookieParser = require("cookie-parser");

const { giveRoles } = require('./utils/roles.js')
const { checkWinConditions } = require('./utils/winCondition.js')

app.use(express.static("server/static"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", "server/pages");
app.use(cookieParser());

instrument(io, {
	auth: false,
	mode: "development",
});

let players = [];

function checkForLovers(user) {
	if (user.isLover) {
		let lover = players.find(
			(player) => player.isLover && player.uuid !== user.uuid
		);
		lover.isDead = true;
	}
}

app.get("/", (req, res) => {
	res.render("index");
});

app.post("/", (req, res) => {
	const uuid = uuidV4();

	let newPlayer = {
		uuid: uuid,
		socketId: "",
		name: req.body["userName"],
		role: "",
		isLover: false,
		isDead: false,
		receivedDeathMsg: false,
	};

	players.push(newPlayer);

	res.render("waitRoom", { userId: newPlayer.uuid });
});

app.get('/test', (req, res) => {
    res.render('test')
})

app.get("/game", (req, res) => {
	let uuid = req.cookies.uuid;
	const player = players.find((el) => el.uuid == uuid);

	res.render("game", {
		players: JSON.stringify(players),
		currentRole: player.role,
		currentUserUuid: uuid,
	});
});
app.get("/game/end", (req, res) => {
	let uuid = req.cookies.uuid;
	const player = players.find((el) => el.uuid == uuid);

	console.log(uuid, player);

	let won = false;

	if (req.query.who == "bad") {
		if (player.role == "werewolf") {
			won = true;
		}
	} else if (req.query.who == "good") {
		if (player.role != "werewolf") {
			won = true;
		}
	}

	res.render("game_end", {
		won,
	});
});
app.get("/role", (req, res) => {
	//get user role

	let uuid = req.cookies.uuid;
	const player = players.find((el) => el.uuid == uuid);

	res.render("role", { role: player.role });
});

app.get("/admin", (req, res) => {
	res.render("admin");
});

let votes = [];

function addVote(user) {
	let vote = votes.find((v) => v.uuid == user.uuid);
	if (vote) {
		vote.amount++;
	} else {
		votes.push({ uuid: user.uuid, amount: 1 });
	}
}
function getBiggestVotedUser() {
	if (votes.length > 0) {
		let vote = votes.reduce((a, b) => (a = a.amount > b.amount ? a : b));
		return players.find((el) => el.uuid == vote.uuid);
	} else {
		return false;
	}
}


io.on("connection", (socket) => {
	socket.on("reset-game", () => {
		votes = [];
		io.emit("reset");
		setTimeout(() => {
			players = [];
		}, 1000);
	});

	socket.on("start-game", () => {
		players = giveRoles(players);
		setTimeout(() => {
			socket.broadcast.emit("game-update", "start_game");
			socket.emit("!a-get-users", players);
		}, 2000);
	});
	socket.on("show-gamescreen", () => {
		setTimeout(() => {
			socket.broadcast.emit("game-update", "show_gamescreen");
		}, 2000);
	});
	socket.on("start-playing", () => {
		setTimeout(() => {
			socket.broadcast.emit("game_update", { name: "start_game" });
			socket.broadcast.emit("game_time_update", false);
		}, 2000);
	});

	socket.on("!a-change-time", (time) => {
		socket.broadcast.emit("game_time_update", time);
		votes = [];
		let gameEnded = checkWinConditions(players);
		if (gameEnded.endGame == true) {
			votes = [];
			setTimeout(() => {
				players = [];
			}, 10000);
			socket.broadcast.emit("end_game", gameEnded);
		}
	});
	socket.on("!a-game-update", (update) => {
		socket.broadcast.emit("game_update", update);
		if (update.name == "toggle_voting" && update.toggle == false) {
			let deadUser = getBiggestVotedUser();
			if (deadUser !== false && deadUser !== undefined) {
				deadUser.isDead = true;
                checkForLovers(deadUser);
			}
			votes = [];
			socket.broadcast.emit("!g-update-picker", players);
		}
	});
	socket.on("!a-send-deaths", () => {
		players.forEach((player) => {
			if (player.isDead && !player.receivedDeathMsg) {
				player.receivedDeathMsg = true;
				socket.broadcast.emit("death_msg", player.uuid);
			}
		});
		socket.broadcast.emit("!g-update-picker", players);
	});
	socket.on("!g-cupido-choose", (userIds) => {
		userIds.forEach((id) => {
			let user = players.find((user) => user.uuid == id);
			user.isLover = true;
		});
		socket.broadcast.emit("!g-update-picker", players);
	});
	socket.on("!g-witch-choose", (data) => {
		if (data.action == 0) {
			// Kill
			let user = players.find((user) => user.uuid == data.id);
			user.isDead = true;
			checkForLovers(user);
		}
		if (data.action == 2) {
			// Heal
			let user = players.find((user) => user.uuid == data.id);
			user.isDead = false;
            socket.broadcast.to(user.socketId).emit('realive')
		}
		socket.broadcast.emit("!g-update-picker", players);
	});
	socket.on("!g-hunter-choose", (data) => {
		let user = players.find((user) => user.uuid == data.id);
		user.isDead = true;
		checkForLovers(user);
		checkWinConditions(players);
		socket.broadcast.emit("!g-update-picker", players);
	});
	socket.on("!g-user-vote", (user) => {
		addVote(user);
		socket.emit("!g-vote-list", votes);
		socket.broadcast.emit("!g-vote-list", votes);
	});
	socket.on("!g-werewolf-vote", (user) => {
		addVote(user);
	});
	socket.on("!g-werewolves-dead", () => {
		let deadUser = getBiggestVotedUser();
		if (deadUser !== false) {
			deadUser.isDead = true;
			checkForLovers(deadUser);
		}
		votes = [];

		//Cast dead to wich
		socket.broadcast.emit("!g-update-picker", players);
	});

	socket.on("append_socket", (data) => {
		let player = players.find((player) => player.uuid == data.uuid);
		player.socketId = socket.id;
		socket.broadcast.emit("!a-update-users", { users: players });
	});
});

httpServer.listen(3000, () => console.log("SERVER STARTED ON PORT 3000"));
