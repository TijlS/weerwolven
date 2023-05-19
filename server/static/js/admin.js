
//#region GAME VARIABLES
let isDay = true;
let isVoting = false;
let cupdioHasChosen = false;
let werewolvesActive = false;
let players = [];
//#endregion

//#region PRE-GAME CONTROLS
document.querySelector('.clear_cache').addEventListener('click', () => {
    socket.emit('reset-game')
})
document.querySelector('.show_roles').addEventListener('click', () => {
    socket.emit('start-game');
    document.querySelector('.show_roles').style.display = "none";
    document.querySelector('.game').style.display = "block";
});
document.querySelector('.game').addEventListener('click', () => {
    socket.emit('show-gamescreen');
    document.querySelector('.game').style.display = "none";
    document.querySelector('.start_game').style.display = "block";
});
document.querySelector('.start_game').addEventListener('click', () => {
    socket.emit('start-playing');
    isDay = false;
    document.querySelector('.start_game').style.display = "none";
    document.querySelector('.starting-controls').style.display = "none";
    document.querySelector('.game-controls').style.display = "block";
});
//#endregion

//#region GAME CONTROLS
document.querySelector('.time').addEventListener('click', () => {
    isDay = !isDay;
    changeButtons(isDay);
    socket.emit('!a-send-deaths');
    setTimeout(() => {
        socket.emit('!a-change-time', isDay);
        if(!isDay){
            isVoting = false;
            socket.emit('!a-game-update', { name: 'toggle_voting', toggle: false });
        }
    }, 2000)
});
document.querySelector('.voting').addEventListener('click', () => {
    isVoting = !isVoting;
    document.querySelector('.voting').textContent = isVoting ? 'Stemscherm verbergen' : 'Stemscherm tonen';
    socket.emit('!a-game-update', { name: 'toggle_voting', toggle: isVoting });
});
document.querySelector('.cupido').addEventListener('click', () => {
    cupdioHasChosen = true;
    socket.emit('!a-game-update', { name: 'call_person', person: 'cupido' });
});
document.querySelector('.werewolves').addEventListener('click', () => {
    werewolvesActive = !werewolvesActive;
    if(werewolvesActive == false){
        socket.emit('!g-werewolves-dead');
    }
    socket.emit('!a-game-update', { name: 'call_person', person: 'werewolf' });
});
document.querySelector('.seer').addEventListener('click', () => {
    socket.emit('!a-game-update', { name: 'call_person', person: 'seer' });
});
//#endregion

const changeButtons = (time) => {
    const btnWithDay = document.querySelectorAll('.--day')
    const btnWithNight = document.querySelectorAll('.--night')
    const cupidoBtn = document.querySelector('.cupido')

    if (time) {
        btnWithNight.forEach(btn => {
            btn.style.display = "none";
        })
        btnWithDay.forEach(btn => {
            btn.style.display = "block";
        })
    } else {
        btnWithNight.forEach(btn => {
            btn.style.display = "block";
        })
        btnWithDay.forEach(btn => {
            btn.style.display = "none";
        })
        if (cupdioHasChosen) {
            cupidoBtn.style.display = "none";
        }
    }
}

socket.on('!a-update-users', data => {
    document.querySelector('.players').innerHTML = ""
    data.users.forEach(user => {
        let li = document.createElement('li')
        li.textContent = user.name
        document.querySelector('.players').append(li)
    });
})

socket.on('!a-get-users', data => {
    players = data;
})