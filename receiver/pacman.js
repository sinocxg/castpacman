/**
 * Copyright (C) 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Tic Tac Toe Gameplay with Chromecast
 * This file exposes cast.pacman as an object containing a ChannelHandler
 * and capable of receiving and sending messages to the sender application.
 */
 
 

// External namespace for cast specific javascript library
var cast = window.cast || {};

// Anonymous namespace
(function() {
  'use strict';
  
  pacman.PROTOCOL = 'urn:x-cast:com.marvell.cast.pacman';

  pacman.PLAYER = {
    O: 'O',
    X: 'X'
  };
  
  pacman.coinInserted = 0;

  /**
   * Creates a pacman object with an optional board and attaches a
   * cast.receiver.ChannelHandler, which receives messages from the
   * channel between the sender and receiver.
   * @constructor
   */
  function pacman() {
    this.mPlayer1 = -1;
    this.mPlayer2 = -1;
    this.mCurrentPlayer;
	this.mGameState = "onload";
	
    console.log('********Pacman********');
    this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();
    this.castMessageBus_ =
        this.castReceiverManager_.getCastMessageBus(pacman.PROTOCOL,
        cast.receiver.CastMessageBus.MessageType.JSON);
    this.castMessageBus_.onMessage = this.onMessage.bind(this);
    this.castReceiverManager_.onSenderConnected =
        this.onSenderConnected.bind(this);
    this.castReceiverManager_.onSenderDisconnected =
        this.onSenderDisconnected.bind(this);
    this.castReceiverManager_.start();
  }

  // Adds event listening functions to pacman.prototype.
  pacman.prototype = {
	
	/**
     * Sender Connected event
     * @param {event} event the sender connected event.
     */
    onSenderConnected: function(event) {
      console.log('onSenderConnected. Total number of senders: ' +
          this.castReceiverManager_.getSenders().length);
    },

    /**
     * Sender disconnected event; if all senders are disconnected,
     * closes the application.
     * @param {event} event the sender disconnected event.
     */
    onSenderDisconnected: function(event) {
      console.log('onSenderDisconnected. Total number of senders: ' +
          this.castReceiverManager_.getSenders().length);

      if (this.castReceiverManager_.getSenders().length == 0) {
        window.close();
      }
    },

    /**
     * Message received event; determines event message and command, and
     * choose function to call based on them.
     * @param {event} event the event to be processed.
     */
    onMessage: function(event) {
	  var message = event.data;
      var senderId = event.senderId;
      //console.log('********onMessage********' + JSON.stringify(event.data));
      //console.log('mPlayer1: ' + this.mPlayer1);
      //console.log('mPlayer2: ' + this.mPlayer2);

      if (message.command == 'join') {
        this.onJoin(senderId, message);
      } else if (message.command == 'leave') {
        this.onLeave(senderId);
      } else if (message.command == 'move') {
        this.onMove(senderId, message);
      } else {
        console.log('Invalid message command: ' + message.command);
      }
    },

    /**
     * Player joined event: registers a new player who joined the game, or
     * prevents player from joining if invalid.
     * @param {string} senderId the sender the message came from.
     * @param {Object|string} message the name of the player who just joined.
     */
    onJoin: function(senderId, message) {
      console.log('****onJoin****');

      if ((this.mPlayer1 != -1) &&
          (this.mPlayer1.senderId == senderId)) {
        this.sendError(senderId, 'You are already ' +
                       this.mPlayer1.player +
                       ' You aren\'t allowed to play against yourself.');
        return;
      }
      if ((this.mPlayer2 != -1) &&
          (this.mPlayer2.senderId == senderId)) {
        this.sendError(senderId, 'You are already ' +
                       this.mPlayer2.player +
                       ' You aren\'t allowed to play against yourself.');
        return;
      }

      if (this.mPlayer1 == -1) {
        this.mPlayer1 = new Object();
        this.mPlayer1.name = message.name;
        this.mPlayer1.senderId = senderId;
      } else if (this.mPlayer2 == -1) {
        this.mPlayer2 = new Object();
        this.mPlayer2.name = message.name;
        this.mPlayer2.senderId = senderId;
      } else {
        console.log('Unable to join a full game.');
        this.sendError(senderId, 'Game is full.');
        return;
      }

      console.log('mPlayer1: ' + this.mPlayer1);
      console.log('mPlayer2: ' + this.mPlayer2);

      if (this.mPlayer1 != -1 || this.mPlayer2 != -1) {
        this.startGame_();
      }
    },

    /**
     * Player leave event: determines which player left and unregisters that
     * player, and ends the game if all players are absent.
     * @param {string} senderId the sender ID of the leaving player.
     */
    onLeave: function(senderId) {

	  console.log('****OnLeave****');

      if (this.mPlayer1 != -1 && this.mPlayer1.senderId == senderId) {
        this.mPlayer1 = -1;
      } else if (this.mPlayer2 != -1 && this.mPlayer2.senderId == senderId) {
        this.mPlayer2 = -1;
      } else {
        console.log('Neither player left the game');
        return;
      }

      //this.broadcastEndGame();
    },

    /**
     * Move event: checks whether a valid move was made and updates the board
     * as necessary.
     * @param {string} senderId the sender that made the move.
     * @param {Object|string} message contains the row and column of the move.
     */
    onMove: function(senderId, message) {
      //console.log("****onMove****");
	  
      if ((this.mPlayer1 == -1) && (this.mPlayer2 == -1) ) {
        console.log('Looks like no player is there');
        console.log('mPlayer1: ' + this.mPlayer1);
        console.log('mPlayer2: ' + this.mPlayer2);
        return;
      }

      if (this.mPlayer1.senderId == senderId) {
        //console.log('mPlayer1: ' + message.direct);
		if(message.direct == "left"){
			try{google.pacman.keyPressed(37);}catch(e){};
		}else if(message.direct == "up"){
			try{google.pacman.keyPressed(38)}catch(e){};
		}else if(message.direct == "down"){
			try{google.pacman.keyPressed(40)}catch(e){};
		}else if(message.direct == "right"){
			try{google.pacman.keyPressed(39)}catch(e){};
		}
      } else if (this.mPlayer2.senderId == senderId) {
        //console.log('mPlayer2: ' + message.direct);
		if(message.direct == "left"){
			try{google.pacman.keyPressed(65)}catch(e){};
		}else if(message.direct == "up"){
			try{google.pacman.keyPressed(87)}catch(e){};
		}else if(message.direct == "down"){
			try{google.pacman.keyPressed(83)}catch(e){};
		}else if(message.direct == "right"){
			try{google.pacman.keyPressed(68)}catch(e){};
		}
      } else {
        console.log('Ignorning message. Someone other than the current' +
            'players sent a move.');
        this.sendError(channel, 'You are not playing the game');
        return;
      }
    },

    sendError: function(senderId, errorMessage) {
        this.castMessageBus_.send(senderId, {
			'event': 'error',
			'message': errorMessage });
    },
	
	broadcastGameReady: function(){
		console.log('****GameReady');
		this.broadcast({ event: 'gameready' });
	},

    broadcastEndGame: function(endState) {
		console.log('****endGame');
		this.mPlayer1 = -1;
		this.mPlayer2 = -1;
		this.broadcast({ event: 'endgame',
                       end_state: endState});
    },

    /**
     * @private
     */
    startGame_: function() {
      console.log('****startGame****');
      if(this.mPlayer1 != -1)
		this.mPlayer1.player = pacman.PLAYER.X;
      if(this.mPlayer2 != -1)
		this.mPlayer2.player = pacman.PLAYER.O;

	if(this.mPlayer1 != -1){
		try{
			if(google.pacman.ready)this.mGameState = "ready";
		}catch(e){
		}
	  this.castMessageBus_.send(
          this.mPlayer1.senderId, {
            event: 'joined',
            player: this.mPlayer1.player,
			gamestate: this.mGameState
          });
		 }
	if(this.mPlayer2 != -1){
		try{
			if(google.pacman.ready)
				this.mGameState = "ready";
		}catch(e){
		}
      this.castMessageBus_.send(
          this.mPlayer2.senderId, {
            event: 'joined',
            player: this.mPlayer2.player,
			gamestate: this.mGameState
          });
		  }
		
      //console.log("pacman.coinInserted " + pacman.coinInserted);
      if(pacman.coinInserted++){
		google.pacman.insertCoin();
		pacman.coinInserted--;
      }
    },

    /**
     * Broadcasts a message to all of this object's known channels.
     * @param {Object|string} message the message to broadcast.
     */
    broadcast: function(message) {
		this.castMessageBus_.broadcast(message);
    }
  };

  // Exposes public functions and APIs
  cast.pacman = pacman;
})();

