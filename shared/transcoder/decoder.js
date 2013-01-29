(function() {
  var isNode = typeof(exports) !== 'undefined';
  var Transcoder;
  if(isNode) {
    Transcoder = require('../transcoder');
  } else {
    Transcoder = window.Transcoder;
  }

  var Decoder = {
    decode: function(buffer) {
      var message = {};

      var view = new DataView(buffer);
      var typeCode = view.getUint8(0);

      message.type = Transcoder.types[typeCode];
      message.state = {
        positionX: view.getUint16(1),
        positionY: view.getUint16(3)
      };
      message.lastAcknowledgedCommandId = view.getUint16(5);
      return message;
    }
  };

  var isNode = typeof(exports) !== 'undefined';
  if(isNode) module.exports = Decoder;
  else window.Transcoder.Decoder = Decoder;
})();
