const events = require('events');
const util = require('util');

const characteristics = require('./characteristics.json');

function Characteristic (noble, peripheralId, serviceUuid, uuid, properties, valueHandle, startHandle, endHandle) {
  this._noble = noble;
  this._peripheralId = peripheralId;
  this._serviceUuid = serviceUuid;

  this.uuid = uuid;
  this.name = null;
  this.type = null;
  this.properties = properties;
  this.descriptors = null;
  this.valueHandle = valueHandle;
  this.startHandle = startHandle;
  this.endHandle = endHandle;

  const characteristic = characteristics[uuid];
  if (characteristic) {
    this.name = characteristic.name;
    this.type = characteristic.type;
  }
}

util.inherits(Characteristic, events.EventEmitter);

Characteristic.prototype.toString = function () {
  return JSON.stringify({
    uuid: this.uuid,
    name: this.name,
    type: this.type,
    properties: this.properties
  });
};

const read = function (callback) {
  if (callback) {
    const onRead = (data, isNotification, valueHandle) => {
      // only call the callback if 'read' event and non-notification
      // 'read' for non-notifications is only present for backwards compatbility
      if (!isNotification) {
        // remove the listener
        this.removeListener('read', onRead);

        // call the callback
        callback(null, data, valueHandle);
      }
    };

    this.on('read', onRead);
  }

  this._noble.read(
    this._peripheralId,
    this._serviceUuid,
    this.uuid,
    this.valueHandle
  );
};

Characteristic.prototype.read = read;
Characteristic.prototype.readAsync = util.promisify(read);

const write = function (data, withoutResponse, callback) {
  if (process.title !== 'browser') {
    if (!(data instanceof Buffer)) {
      throw new Error('data must be a Buffer');
    }
  }

  if (callback) {
    this.once('write', () => {
      callback(null);
    });
  }
  this._noble.write(
    this._peripheralId,
    this._serviceUuid,
    this.uuid,
    data,
    withoutResponse,
    this.valueHandle
  );
};

Characteristic.prototype.write = write;
Characteristic.prototype.writeAsync = util.promisify(write);

const broadcast = function (broadcast, callback) {
  if (callback) {
    this.once('broadcast', () => {
      callback(null);
    });
  }

  this._noble.broadcast(
    this._peripheralId,
    this._serviceUuid,
    this.uuid,
    broadcast
  );
};

Characteristic.prototype.broadcast = broadcast;
Characteristic.prototype.broadcastAsync = util.promisify(broadcast);

// deprecated in favour of subscribe/unsubscribe
const notify = function (notify, callback) {
  if (callback) {
    this.once('notify', () => {
      callback(null);
    });
  }

  this._noble.notify(
    this._peripheralId,
    this._serviceUuid,
    this.uuid,
    notify,
    this.valueHandle
  );
};

Characteristic.prototype.notify = notify;
Characteristic.prototype.notifyAsync = util.promisify(notify);

const subscribe = function (callback) {
  this.notify(true, callback);
};

Characteristic.prototype.subscribe = subscribe;
Characteristic.prototype.subscribeAsync = util.promisify(subscribe);

const unsubscribe = function (callback) {
  this.notify(false, callback);
};

Characteristic.prototype.unsubscribe = unsubscribe;
Characteristic.prototype.unsubscribeAsync = util.promisify(unsubscribe);

const discoverDescriptors = function (callback) {
  if (callback) {
    this.once('descriptorsDiscover', descriptors => {
      callback(null, descriptors);
    });
  }

  this._noble.discoverDescriptors(
    this._peripheralId,
    this._serviceUuid,
    this.uuid,
    this.valueHandle
  );
};

Characteristic.prototype.discoverDescriptors = discoverDescriptors;
Characteristic.prototype.discoverDescriptorsAsync = util.promisify(discoverDescriptors);

module.exports = Characteristic;
