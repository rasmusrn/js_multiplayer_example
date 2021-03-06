var SharedCollection = require('./shared/collection');
var EventEmitter = require('events').EventEmitter;

function Collection(options) {
  EventEmitter.call(this);
  SharedCollection.call(this, options);
  this.idCount = 1;
}

Collection.prototype = Object.create(SharedCollection.prototype);

Collection.prototype.add = function(entity) {
  entity.id = this.idCount++;
  SharedCollection.prototype.add.call(this, entity);
  this.emit('add', entity);
  entity.on('change', function(attribute) {
    this.emit('change', entity, attribute);
  }.bind(this));

};

Collection.prototype.remove = function(entity) {
  SharedCollection.prototype.remove.call(this, entity);
  this.emit('remove', entity);
};

// Mixing in EventEmitter
for(var propertyName in EventEmitter.prototype)
  Collection.prototype[propertyName] = EventEmitter.prototype[propertyName];

module.exports = Collection;
