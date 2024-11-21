import express from 'express'
import { Server } from "socket.io"
import path from 'path'//added this
import { fileURLToPath } from "url"
// import { emit } from 'process'

const __filename=fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)

const PORT = process.env.Port || 3500 //if it is not defined in the env file the port will be 3500

const ADMIN = "Admin" //+ means added this

const app=express()

app.use(express.static(path.join(__dirname,"public")))

const expressServer=app.listen(PORT,()=>{
    // console.log(`listening on port ${PORT}`)
})

const UsersState={ //+
    users:[],
    setUsers:function(newUsersArray){
        this.users=newUsersArray
    }
}

const io = new Server(expressServer,{
    cors:{
        origin: process.env.NODE_ENV ==="production"? false : ["http://localhost:5500","http://127.0.0.1:5500"]
    }
})

io.on("connection", socket =>{
    // console.log(`user ${socket.id} connected`)
    //these below two happens when user enters or when user first enters the server
    //socket.emit goes to the user that is connected, ex when we open whatsapp we are the user that is connected to the server
    // console.log("hello")
    // console.log("bye")
    // console.log(buildMessage(ADMIN,"Welcome to chat app!"))
    // console.log()
    socket.emit('message', buildMessage(ADMIN,"Welcome to chat app!"))
   //we are sending a message back wehn user is connected


    //in the enter room, we have to delete the user from previous room and enter into new room specified
    socket.on('enterRoom',({name,room})=>{
        const prevRoom=getUser(socket.id)?.room
        // console.log("room 1")
        if(prevRoom){
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message',buildMessage(ADMIN,`${name} has left the room`))//send message to the prev room stating the they have left the room
            //this is for when u joined one room and going to other room without leaving the prev room
        }
        const user=activateUser(socket.id,name,room)
        //we cannot update users in previos rooms until we activte the user in the new room, as when we call the activate function, it removes the user in prevroom if present
        if(prevRoom){
            io.to(prevRoom).emit('userList',{
                users:getUsersInroom(prevRoom)
            })
        }
        //joining the room
        socket.join(user.room)
        //to user who joined the room
        socket.emit('message',buildMessage(ADMIN,`You have joined the ${user.room} chat room`))
        //to everyone in the room
        socket.broadcast.to(user.room).emit('message',buildMessage(ADMIN, `${user.name} has joined the room`))
        io.to(user.room).emit('userList',{
            users:getUsersInroom(user.room)
        })
        
        io.emit('roomList',{
            rooms:getAllActiveRooms()
        })
    })
    //socket.broadcast.emit goes to everyone else except the user that is connected
    // socket.broadcast.emit('message',`User ${socket.id.substring(0,5)} is connected`)

    //when user disconnects, it would go to all others
    socket.on('disconnect', ()=>{
        const user=getUser(socket.id)
        userLeavesApp(socket.id)//removing user from the state

        if(user){
            //this is when leaving the room
            io.to(user.room).emit('message',buildMessage(ADMIN,`${user.name} has left the room`))

            io.to(user.room).emit('userList',{
                users:getUsersInroom(user.room)
            })
            io.emit('roomList',{
                rooms:getAllActiveRooms()
                //when last user leaves room, all other users in other rooms should be able to see the available rooms
            })
        }
        // console.log(`user' ${socket.id} disconnected`)
    })

    
    //listening for an event
    socket.on('message', ({name,text})=>{
        const room =getUser(socket.id)?.room
        if(room){
            io.to(room).emit('message',buildMessage(name,text))
        }
    })

    

    //listening for any activity by the user
    socket.on('activity',(name)=>{
        const room =getUser(socket.id)?.room
        if(room){
            socket.broadcast.to(room).emit('activity',name)
        }
    })
})


function buildMessage(name,text){
    return {
        name,
        text,
        time:new Date().toLocaleTimeString()
    }
}
//user functions
function activateUser(id,name,room){
    const user={id,name,room}//object
    UsersState.setUsers([
        ...UsersState.users.filter(user=>user.id!==id),
        user
    ])
    //basically  we are storing the users in the server, so in the userstate we have users array and we are filtering the users . when user enters a new room the user should be removed from the array and new user should be entered with different room
    //when user exits a room and enters a new room we have to remove that user from server and enter the new user with the new room
    return user
}

function userLeavesApp(id){
    UsersState.setUsers(
        UsersState.users.filter(user=>user.id!==id)//this returns an array
    )
}

function getUser(id){
    return UsersState.users.find(user=>user.id===id);
    //it return the user object for the specified it
}

function getUsersInroom(room){
    return UsersState.users.filter(user=>user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(UsersState.users.map(user=>user.room)))
    //we are taking each user and getting the room into an array, as the array may contain duplicates so we are converting into set then again set to array
}