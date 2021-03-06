var Player = require('../models/player');
var EventEmitter = require('events').EventEmitter;
var Transcoder = require('../shared/transcoder');

function Connection(wsConnection, world) {
  EventEmitter.call(this);
  console.log((new Date()) + ' Connection accepted.');
  wsConnection.on('message', this.onMessage.bind(this));
  wsConnection.on('close', this.onClose.bind(this));
  this.wsConnection = wsConnection;
  this.world = world;
  this.createPlayer();
}

Connection.prototype = Object.create(EventEmitter.prototype);

Connection.prototype.createPlayer = function() {
  this.player = new Player;
  this.player.on('commandApplication', this.sendCommandAcknowledgementMessage.bind(this));
  this.world.players.add(this.player);
};

Connection.prototype.onMessage = function(messageObject) {
  if(messageObject.type === 'utf8') {
    var messageAsString = messageObject.utf8Data;
    var message = JSON.parse(messageAsString);
    if(message.type === 'commands')
      this.player.commands = this.player.commands.concat(message.commands);
  }
};

Connection.prototype.onUpdate = function(update) {
  if(!this.welcomed) {
    this.sendWelcomeMessage();
  } else {
    this.sendUpdate(update);
  }
}

Connection.prototype.sendUpdate = function(update) {
  if(update.changes) this.sendChanges(update.changes);
  if(update.adds) this.sendAdds(update.adds);
  if(update.removes) this.sendRemoves(update.removes);
};

Connection.prototype.sendChanges = function(changes) {
  var changesCopy = JSON.parse(JSON.stringify(changes));
  if(changesCopy.players && changesCopy.players[this.player.id]) {
    delete changesCopy.players[this.player.id];
    if(Object.keys(changesCopy.players).length == 0 && Object.keys(changesCopy).length == 1) {
      return;
    }
  }
  var message = {
    type: 'changes',
    changes: changesCopy
  };
  this.sendMessage(message);
};

Connection.prototype.sendAdds = function(adds) {
  var message = {
    type: 'adds',
    adds: adds
  };
  this.sendMessage(message);
};

Connection.prototype.sendRemoves = function(removes) {
  var message = {
    type: 'removes',
    removes: removes
  };
  this.sendMessage(message);
};

Connection.prototype.sendWelcomeMessage = function() {
  this.welcomed = true;
  var snapshot = this.world.toHash();
  var message = {
    type: 'welcome',
    snapshot: snapshot,
    playerId: this.player.id
  };
  this.sendMessage(message);
};

Connection.prototype.onClose = function(reasonCode, description) {
  console.log((new Date()) + ' Peer ' + this.wsConnection.remoteAddress + ' disconnected.');
  this.emit('close');
  this.world.players.remove(this.player);
};

Connection.prototype.sendMessage = function(message) {
  var data;
  if(Transcoder.canTranscode(message.type)) {
    var arrayBuffer = Transcoder.encode(message);
    data = convertArrayBufferToNodeBuffer(arrayBuffer);
  } else {
    data = JSON.stringify(message);
  }

  this.wsConnection.send(data);
};

Connection.prototype.sendCommandAcknowledgementMessage = function() {
  var message = {
    type: 'commandAcknowledgement',
    state: {
      positionX: this.player.positionX,
      positionY: this.player.positionY
    },
    lastAcknowledgedCommandId: this.player.lastAppliedCommandId
  };
  this.sendMessage(message);
};

function convertArrayBufferToNodeBuffer(arrayBuffer) {
  var buffer = new Buffer(arrayBuffer.byteLength);
  var view = new Uint8Array(arrayBuffer);
  for(var i=0; buffer.length>i; i++) {
    buffer[i] = view[i];
  }
  return buffer;
}

module.exports = Connection;
