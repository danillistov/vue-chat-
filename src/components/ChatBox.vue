<template>
  <v-container fluid fill-height>
    <v-layout >
      <v-flex xs12 sm2 md2>
        <v-card class="mr-2" >
          <v-list>
            <v-list-tile
              value="true"
              v-for="(room, index) in rooms"
              :key="index"
              @click="changeRoom(index)"
            >
              <v-list-tile-action>
                <v-icon v-html="room.icon" :class="room.colr" ></v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title v-text="room.title" :class="room.colr" ></v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
          <v-spacer></v-spacer>
      <v-flex xs12 sm8 md8>
        <v-layout column>
          <v-card class="mb-1">
            <v-form @submit="sendMessage" action="/" method="post">
              <v-layout row wrap>
                <v-flex >
                  <v-text-field md12
                    v-model="newMessage"
                    solo
                    label="Enter your message here"
                    clearable
                  ></v-text-field>
                </v-flex>
              </v-layout>
            </v-form>
          </v-card >
          <v-card id="ChatBox" >
            <chat-message
              v-for="(message,i) in rooms[0].messages"
              :key=i
              :data="message">
            </chat-message>
          </v-card>
          <v-spacer></v-spacer>
        </v-layout >
      </v-flex>
          <v-spacer></v-spacer>
      <v-flex xs12 sm2 md2>
        <v-card class="ml-2" >
          <v-list subheader>
            <v-subheader inset>Online Users</v-subheader>
            <v-list-tile
              v-for="(user,j) in onlineUsers"
              :key=j
              :data="user"
            >
              <v-list-tile-content>
                <v-list-tile-title>{{ user }}
                  <a href="#" :data-username="user" @click="kickUser" v-if="isAdmin">[ kick ]</a>
                </v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-btn icon ripple>
                  <v-icon color="grey lighten-1">info</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
</v-container>
</template>
<script>
/* eslint-disable */
import ChatMessage from './ChatMessage.vue'
//import colors from 'vuetify/es5/util/colors'

export default {
  components: { ChatMessage },

  data () {
    return {
      newMessage: '',
      messages: [],
      rooms: [{
        id: '1a',
        messages: [],
        colr: 'red--text',
        icon: 'bubble_chart',
        title: 'Room 1'
      },
      {
        id: '2b',
        messages: [],
        colr: 'blue--text',
        icon: 'email',
        title: 'Room 2'
      },
      {
        id: '3c',
        messages: [],
        colr: 'green--text',
        icon: 'bubble_chart',
        title: 'Room 3'
      },
      {
        id: '4d',
        messages: [],
        colr: 'black--text',        
        icon: 'bubble_chart',
        title: 'Room 4'
      }        
      ],
      tr: 1,
      onlineUsers: []
    }
  },

  created: function () {
    let chatbox = this

    this.$parent.socket.on ('message received', function(rm, message) {
      for (let i = 0; i < chatbox.rooms.length; i++) {
        if(chatbox.rooms[i].id == rm){
        chatbox.rooms[i].messages.unshift(message)
          
          break;
        }
      }
    })

    this.$parent.socket.on ('user joined', function(message) {
      chatbox.rooms[0].messages.unshift(message);
      chatbox.onlineUsers.push(message.username);
    });

    this.$parent.socket.on ('user left', function(message) {
      chatbox.rooms[0].messages.unshift(message);
      let idx=chatbox.onlineUsers.indexOf(message.username);
      if(idx != -1) chatbox.onlineUser.splice(idx,1);
    });

    this.$parent.socket.on ('room changed', function(message) {
      chatbox.rooms[0].messages.unshift(message);
    });
  },

  methods: {
    sendMessage (event) {
      event.preventDefault();

      this.$parent.socket.emit ('send message',this.rooms[0].id, this.newMessage);

      this.newMessage = '';
    },

    kickUser (event) {
      event.preventDefault();

      // Get the username of the user we're kicking
      let usernameToKick = event.target.getAttribute('data-username');

      // Tell the server to kick them from the chat
      this.$parent.socket.emit('kick user', usernameToKick);
    },

    exitRoom (event) {
      event.preventDefault();

      // Get the username of the user we're kicking
      let roomToExit = event.target.getAttribute('data-room');

      // Tell the server to kick them from the chat
      this.$parent.socket.emit('exit room', roomToExit);
    },

    changeRoom (room_index) {
      event.preventDefault();
      let  chatbox=this;
      let t_room=chatbox.rooms[room_index];
      this.$parent.socket.emit('change room',chatbox.rooms[0].id,chatbox.rooms[room_index].id);
      chatbox.rooms.splice(room_index,1);
      chatbox.rooms.unshift(t_room);
      chatbox.tr=t_room.id;

      // Get the username of the user we're kicking
      //let roomToEnter = event.target.getAttribute('data-room');
      //if(roomToEnter==null) roomToEnter = event.target.parent.getAttribute('data-room') 
      // Tell the server to kick them from the chat
    }

  },

  computed: {
    // Surely there must be a better way to do this? @TODO
    isAdmin() {
      return this.$parent.isAdmin;
    },
    isCurRoom(rm) {
      return rm==croom;
    }
  }
};
</script>

<style>


</style>