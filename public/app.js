const socket = io("ws://localhost:3500")//sends request to connect to server
//changed here the port is port of the server

const activity=document.querySelector(".activity")
const userList=document.querySelector(".user-list")
const roomList=document.querySelector(".room-list")
const messageList=document.querySelector("#message-list")
const msgInput=document.querySelector("#messageBox")
const nameInput=document.querySelector("#name")
const chatRoomInput=document.querySelector("#room")


function sendMessage(e){
    e.preventDefault()
    if(nameInput.value && chatRoomInput.value && msgInput.value){
        //changed here
        try{
            socket.emit('message',{
                text:msgInput.value,
                name:nameInput.value
            })   // sendding an object {}
        }
        catch(e){
            console.log(e);
        }// as we are emitting or broadcating the message
        msgInput.value="";
        msgInput.focus()
    }
}

function enterRoom(e){
    e.preventDefault()
    if(nameInput.value && chatRoomInput.value){
        socket.emit('enterRoom',{
            name:nameInput.value,
            room:chatRoomInput.value
        })//sending an object to enter the room
    }
}

document.querySelector("#input-container").addEventListener('submit',sendMessage);

document.querySelector(".form-join").addEventListener('submit',enterRoom);

// listening for messages
//changed here
//{data} means destructuring the data
socket.on('message',(data)=>{
    console.log(data)
    // e.preventDefault()
    activity.textContent=''
    const {name,text,time}=data //destructuring data
    const li=document.createElement('li');
    li.className='post'//for admin messages
    if(name===nameInput.value) li.className='post--right'//if the message received is by the user itself display message at left
    if(name!==nameInput.value && name!=='Admin') li.className='post--left'//if the message recived by other users and not by admin then display at right
    if(name!=='Admin'){
        li.innerHTML=`<div class="post__header${name==nameInput.value?'__user':'__reply'}">
        
        <span class="post__header__name">${name}</span>
        <span class="post__header__time">${time}</span>
        </div>
        <div class="post__test">${text}</div> `
    }
    else{
        li.innerHTML=`<div class="post__text">${text}</div>`
    }
    messageList.appendChild(li)
    messageList.scrollTop=messageList.scrollHeight
})

//whenever any key is pressed we are sending a part of the id to the server so that server can tell every one that that id is typing
//here we send to the sever when the user is typing
msgInput.addEventListener('keypress', ()=>{
    socket.emit('activity',nameInput.value) 
})

//here we listen from the server if any other user is typing then we will display it

// when the one user is typing the other user will continuously get this activity message and it will continuously set the activity textcontent to typing... 
// so when the server stops sending the activity message to other user we have to stop displaying the typing message
//here we use timer, we reset the timer every time the typing is done and after 2 seconds of timer we clear the typing...
let activityTimer
socket.on('activity',(userName)=>{
    activity.textContent=`${userName} is typing ...`
    clearTimeout(activityTimer)
    activityTimer=setTimeout(()=>{
        activity.textContent=""
    },2000)
})

socket.on('userList',({users})=>{
    showUsers(users)
})
socket.on('roomList',({rooms})=>{
    showRooms(rooms)
})

function showUsers(users){
    userList.textContent=""
    if(users){
        userList.innerHTML=`<em> Users in ${chatRoomInput.value}:</em>`
        users.forEach((user,i) => {
            userList.textContent+=` ${user.name}`
            if(users.length>1 && i!==users.length-1){
                userList.textContent+=','
            }
        });

    }
}

function showRooms(rooms){
    roomList.textContent=""
    if(rooms){
        roomList.innerHTML=`<em>Active rooms:</em>`
        rooms.forEach((room,i) => {
            roomList.textContent+=` ${room}`
            if(rooms.length>1 && i!==rooms.length-1){
                roomList.textContent+=','
            }
        });

    }
}