var express = require('express')
var http = require('http')
var app = express()
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var mongoose = require('mongoose')

var duri = 'mongodb://localhost/vuepaw3'
mongoose.connect(duri)
mongoose.connection.on('connected', function () {
  console.log('Mongoose connected to ' + duri)
})
mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error:' + err)
})

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose disconnected')
})
/**
 * Set up a basic Express server.
 */
app.set('port', 88)
app.use(express.static(__dirname + '/'))

app.get('/', function (request, response) {
  response.render('index.html')
})

server.listen(app.get('port'), function () {
  console.log('Express server listening.')
})

/**
 * Declare some variables for later use.
 */
var onlineUsers = {}
var sentMessages = []

/**
 * Listen for a new connection on the server.
 */
io.on('connection', function (socket) {
  console.log('Socket connected with ID of ' + socket.id)

  /**
     * This will be fired when a user enters a username. The server will
     * associate the username with the socket ID and store it in,
     * $onlineUsers then emit a message to the client which
     * will in turn output a "XYZ has joined" message to
     * all connected users.
     */
  socket.on('user logged in', function (username) {
    console.log('%s has joined the chat!', username)

    onlineUsers[socket.id] = username

    io.emit('user joined', {
      socketId: socket.id,
      username: username,
      timestamp: new Date(),
      type: 'alert',
      message: username + ' has joined the chat!'
    })
    console.log('%s all users the chat!', JSON.stringify(onlineUsers, null, '\t'))
  })

  /**
     * This will get fired whenever a user submits a message to the chat. The
     * server will create a message object to store all of the various
     * metadata and store it in $sentMessages. It will then emit a
     * message to the client to tell it to output the message
     * in the chat to all users.
     */
  socket.on('send message', function (rm, message) {
    var senderUsername = onlineUsers[socket.id]

    var messageObject = {
      socketId: socket.id,
      username: senderUsername,
      timestamp: new Date(),
      room: rm,
      type: 'message',
      message: message
    }

    console.log('%s (%s): %s', senderUsername, rm, message)
    let rooms = Object.keys(socket.rooms)
    console.log('rooms : %s', rooms) // [ <socket.id>, 'room 237' ]

    sentMessages.push(messageObject)

    io.to(rm).emit('message received', rm, messageObject)
  })

  socket.on('change room', function (lv, jn) {
    var senderUsername = onlineUsers[socket.id]
    var socketId = socket.id
    var messageObject = {
      socketId: socket.id,
      username: senderUsername,
      timestamp: new Date(),
      type: 'alert',
      room: jn,
      message: senderUsername + ': change room  ' + jn + ' from ' + lv
    }

    console.log('%s: change room to %s from %s socID %s', senderUsername, jn, lv, socketId)

    sentMessages.push(messageObject)
    let rooms = Object.keys(socket.rooms)
    console.log('leave : %s', rooms) // [ <socket.id>, 'room 237' ]
    socket.leave(lv, () => {
    })
    socket.join(jn, () => {
      let rooms = Object.keys(socket.rooms)
      console.log('join : %s', rooms) // [ <socket.id>, 'room 237' ]
    })
    io.to(jn).emit('room changed', messageObject)
  })

  /**
     * Listens for when an admin clicks the "kick" link on the online users list.
     * The server will try to find the socket associated with the given username
     * and disconnect it if it exists.
     */
  socket.on('kick user', function (username) {
    var socketId = Object.keys(onlineUsers).filter(function (key) {
      return onlineUsers[key] == username
    })[0]

    if (io.sockets.sockets[socketId]) {
      io.sockets.sockets[socketId].disconnect()
    }

    console.log('%s has been kicked from the chat.', JSON.stringify(username, null, '\t'))
  })
  socket.on('leave user', function (username) {
    var socketId = Object.keys(onlineUsers).filter(function (key) {
      return onlineUsers[key] == username
    })[0]

    if (io.sockets.sockets[socketId]) {
      io.sockets.sockets[socketId].disconnect()
    }

    console.log('%s has been leaved from the chat.', JSON.stringify(username, null, '\t'))
  })

  /**
     * Gets fired when a user leaves the page. It will remove their session
     * from $onlineUsers and broadcast a message to the client to alert
     * everyone in the chat that the user has disconnected.
     */
  socket.on('disconnect', function (leaveUser) {
    var username = onlineUsers[socket.id]

    delete onlineUsers[socket.id]

    console.log('%s has disconnected from the chat.', username)

    io.emit('user left', {
      socketId: socket.id,
      username: username,
      timestamp: new Date(),
      type: 'alert',
      message: username + ' has disconnected from the chat!'
    })
  })
})
