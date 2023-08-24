let isDay = true;
let wwActive = false;
const picker = new UserPicker(document.querySelector('.overlay'), userArray, currentUserRole, socket, currentUserUuid)

let uuid = document.cookie.split('; ').map(c => c.split('=')).find(c => c[0] == "uuid")[1]

socket.on('game_update', (data) => {
    switch (data.name) {
        case 'toggle_voting':
            if (data.toggle) {
                picker.show()
            } else {
                picker.hide()
            }
            break;
        case 'call_person':
            switch (data.person) {
                case 'cupido':
                    if (currentUserRole == "cupido") {
                        picker.show();
                        currentUserRole = "farmer";
                    }
                    break;
                case 'werewolf':
                    wwActive = !wwActive;
                    if (currentUserRole == "werewolf") {
                        if(wwActive == true){
                            picker.show();
                        }else{
                            picker.hide();
                        }
                    }
                    break;
                case 'seer':
                    if (currentUserRole == "seer") {
                        picker.show();
                    }
                    break;
                case 'witch': 
                    if (currentUserRole == "witch") {
                        picker.witchActionBar.classList.remove('hidden')
                        picker.show()
                    }
                    break;
            }
    }
})
socket.on('game_time_update', (data) => {
    isDay = data;
    picker.toggleTime(data);
    if (isDay) {
        document.body.classList.remove('night')
    } else {
        document.body.classList.add('night')
    }
})
socket.on('death_msg', uuidDead => {
    if(uuidDead == uuid){
        if(currentUserRole == "hunter"){
            picker.hunterPick()
        } else {
            document.querySelector('.overlay-dead').classList.add('show', 'day')
            picker.die()
        }
    }
})

socket.on('!g-update-picker', users => {
    picker.updateUsers(users);
})

socket.on('!g-vote-list', votes => {
    picker.updateVotes(votes)
})

socket.on('end_game', data => {
    window.location.href = "/game/end?who=" + data.winnerGroup
})