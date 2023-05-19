const express = require('express')
const app = express()
const httpServer = require('http').createServer(app)
const { v4: uuidV4 } = require('uuid')
require('dotenv').config();
const { Server } = require('socket.io')
const { instrument } = require("@socket.io/admin-ui");
const io = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
})
const cookieParser = require('cookie-parser')

app.use(express.static('server/static'))
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.set('views', 'server/pages')
app.use(cookieParser())

instrument(io, {
    auth: false,
    namespaceName: "/socket_admin"
});

let players = []
let roleConf = {
    1: {
        farmer: 1
    },
    2: {
        farmer: 1,
        werewolf: 1
    },
    3: {
        farmer: 2,
        werewolf: 1,
    },
    4: {
        farmer: 2,
        werewolf: 1,
        seer: 1
    },
    5: {
        farmer: 3,
        werewolf: 1,
        seer: 1,
    },
    6: {
        farmer: 3,
        werewolf: 2,
        seer: 1
    },
    7: {
        farmer: 4,
        werewolf: 2,
        seer: 1
    },
    8: {
        farmer: 3,
        werewolf: 2,
        seer: 1,
        hunter: 1,
        cupido: 1
    },
    9: {
        farmer: 3,
        werewolf: 2,
        seer: 1,
        hunter: 1,
        cupido: 1,
        witch: 1
    },
    10: {
        farmer: 3,
        werewolf: 3,
        seer: 1,
        hunter: 1,
        cupido: 1,
        witch: 1
    },
    bigger: {
        farmer: 0, //change as needed
        werewolf: 4,
        seer: 1,
        hunter: 1,
        cupido: 1,
        witch: 1
    }
}

const giveRoles = () => {
    // console.log('STARTED GIVING ROLES')
    let amountPlayers = players.length;
    // console.log('Players: ' + amountPlayers);
    if (amountPlayers <= 0) {
        return;
    }
    if (amountPlayers > 10) {
        amountPlayers = "bigger";
    }
    // console.log('Players after check: ' + amountPlayers);
    let roles = roleConf[amountPlayers];
    // console.log('Role config:')
    // console.log(roles)
    
    // i = 0;
    players.forEach(player => {
        // console.log(`Player ${i}:`)
        // console.log(player)
        let number = Math.floor(Math.random() * Object.keys(roles).length);
        // console.log(`Rolled number: ${number}`)
        let roleTemp;
        roleTemp = giveTempRoles(number)
        // console.log(`Temp role: ${roleTemp}`)
        //PREVENT USERS FROM GETTING ROLE THAT IS NOT AVAILIBLE
        while (roles[roleTemp] == 0) {
            // console.log('Role can\'t be chosen, rolling other number')
            //IF PLAYERS >= 10 && ALL OTHER ROLES ARE 0, SET ROLE TO FARMER
            if(amountPlayers == "bigger"){
                if(roles.werewolf == 0 && roles.seer == 0 && roles.hunter == 0 && roles.cupido == 0 && roles.witch == 0){
                    number = 0
                }else{
                    number = Math.floor(Math.random() * Object.keys(roles).length);
                }
            }else{
                number = Math.floor(Math.random() * Object.keys(roles).length);
            }
            // console.log(`New number: ${number}`)
            roleTemp = giveTempRoles(number)
            // console.log(`New temp role: ${roleTemp}`)
        }
        if (amountPlayers == "bigger" && number == 0) { //more then 10 players, so increase farmer role
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
        // console.log(`Player ${i} has role of ${player.role}, going to next player`)
        // i++
    })
};
const giveTempRoles = (number) => {
    switch (number) {
        case 0:
            return "farmer"
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
}

function checkForLovers(user) {
    if (user.isLover) {
        let lover = players.find(player => player.isLover && player.uuid !== user.uuid)
        lover.isDead = true;
    }
}

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/', (req, res) => {
    const uuid = uuidV4()

    let newPlayer = {
        uuid: uuid,
        socketId: "",
        name: req.body['userName'],
        role: "",
        isLover: false,
        isDead: false,
        receivedDeathMsg: false
    }

    players.push(newPlayer)

    res.render('waitRoom', { userId: newPlayer.uuid })
})

app.get('/game', (req, res) => {
    let uuid = req.cookies.uuid
    const player = players.find(el => el.uuid == uuid);

    res.render('game', { players: JSON.stringify(players), currentRole: player.role, currentUserUuid: uuid })
})
app.get('/game/end', (req, res) => {
    let uuid = req.cookies.uuid
    const player = players.find(el => el.uuid == uuid);

    let won = false;

    if(req.query.who == "bad"){
        if(player.role == "werewolf"){
            won = true
        }
    }else if(req.query.who == "good"){
        if(player.role != "werewolf"){
            won = true
        }
    }

    res.render('game_end', {
        won
    })
})
app.get('/role', (req, res) => {
    //get user role

    let uuid = req.cookies.uuid
    const player = players.find(el => el.uuid == uuid);

    res.render('role', { role: player.role })
})

app.get('/admin', (req, res) => {
    res.render('admin')
})

let votes = [];

function addVote(user){
    let vote = votes.find(v => v.uuid == user.uuid);
    if(vote){
        vote.amount++;
    }else{
        votes.push({ uuid: user.uuid, amount: 1 });
    }
}
function getBiggestVotedUser(){
    if(votes.length > 0){
        let vote = votes.reduce((a,b)=> a = a.amount > b.amount ? a : b)
        return players.find(el => el.uuid == vote.uuid);   
    }else{
        return false;
    }
}

function checkWinConditions(){
    let alive = players.filter(p => p.isDead != true);

    // ALL WEREWOLVES ARE DEAD
    if(alive.filter(p => p.role == "werewolf").length == 0){
        return { endGame: true, winnerGroup: "good" }
    // LESS FARMERS THAN WEREWOLVES
    }else if (alive.filter(p => {if(p.role == "farmer" || p.role == "seer" || p.role == "cupido" || p.role == "hunter"){return true}return false}).length <= alive.filter(p => p.role == "werewolf").length) {
        return { endGame: true, winnerGroup: "bad" }
    }else {
        return { endGame: false }
    }
}

io.on('connection', (socket) => {
    socket.on('reset-game', () => {
        votes = [];
        io.emit('reset')
        setTimeout(() => { players = [] }, 1000)
    })

    socket.on('start-game', () => {
        giveRoles();
        setTimeout(() => {
            socket.broadcast.emit('game-update', 'start_game')
            socket.emit('!a-get-users', players)
        }, 2000);
    })
    socket.on('show-gamescreen', () => {
        setTimeout(() => {
            socket.broadcast.emit('game-update', 'show_gamescreen')
        }, 2000);
    })
    socket.on('start-playing', () => {
        setTimeout(() => {
            socket.broadcast.emit('game_update', { name: 'start_game' })
            socket.broadcast.emit('game_time_update', false)
        }, 2000);
    })

    socket.on('!a-change-time', (time) => {
        socket.broadcast.emit('game_time_update', time)
        votes = []
        let gameEnded = checkWinConditions()
        if(gameEnded.endGame == true){
            votes = []
            setTimeout(() => { players = [] }, 10000)
            socket.broadcast.emit('end_game', gameEnded)
        }
    })
    socket.on('!a-game-update', (update) => {
        socket.broadcast.emit('game_update', update);
        if(update.name == "toggle_voting" && update.toggle == false){
            let deadUser = getBiggestVotedUser();
            if(deadUser !== false){
                deadUser.isDead = true
                checkForLovers(deadUser);
            }
            votes = []
            socket.broadcast.emit('!g-update-picker', players);
        }
    })
    socket.on('!a-send-deaths', () => {
        players.forEach(player => {
            if (player.isDead && !player.receivedDeathMsg) {
                player.receivedDeathMsg = true;
                socket.broadcast.emit('death_msg', player.uuid);
            }
        })
        socket.broadcast.emit('!g-update-picker', players);
    })
    socket.on('!g-cupido-choose', userIds => {
        userIds.forEach(id => {
            let user = players.find(user => user.uuid == id);
            user.isLover = true;
        })
        socket.broadcast.emit('!g-update-picker', players);
    })
    socket.on('!g-witch-choose', data => {
        if (data.action == 0) { // Kill
            let user = players.find(user => user.uuid == data.id);
            user.isDead = true;
            checkForLovers(user);
        }
        if (data.action == 2) { // Heal
            let user = players.find(user => user.uuid == data.id);
            user.isDead = false;
        }
        socket.broadcast.emit('!g-update-picker', players);
    })
    socket.on('!g-hunter-choose', data => {
        let user = players.find(user => user.uuid == data.id);
        user.isDead = true;
        checkForLovers(user);
        checkWinConditions();
        socket.broadcast.emit('!g-update-picker', players);
    })
    socket.on('!g-user-vote', (user) => {
        addVote(user);
        socket.emit('!g-vote-list', votes);
        socket.broadcast.emit('!g-vote-list', votes);
    })
    socket.on('!g-werewolf-vote', (user) => {
        addVote(user);
    })
    socket.on('!g-werewolves-dead', () => {
        let deadUser = getBiggestVotedUser();
        if(deadUser !== false){
            deadUser.isDead = true;
            checkForLovers(deadUser);
        }
        votes = [];
    })
    
    socket.on('append_socket', data => {
        let player = players.find(player => player.uuid == data.uuid)
        player.socketId = socket.id
        socket.broadcast.emit('!a-update-users', { users: players })
    })
})

httpServer.listen(3000, () => console.log('SERVER STARTED ON PORT 3000'))