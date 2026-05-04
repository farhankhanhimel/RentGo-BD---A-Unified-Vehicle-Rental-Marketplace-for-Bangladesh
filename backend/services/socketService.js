let ioInstance = null;

const registerSocketServer = (io) => {
  ioInstance = io;
};

const getSocketServer = () => ioInstance;

const emitToRoom = (room, eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(room).emit(eventName, payload);
};

const emitToVendor = (vendorId, eventName, payload) => {
  if (!vendorId) {
    return;
  }

  emitToRoom(`vendor:${vendorId}`, eventName, payload);
};

const emitToCustomer = (customerId, eventName, payload) => {
  if (!customerId) {
    return;
  }

  emitToRoom(`customer:${customerId}`, eventName, payload);
};

const emitToAdmins = (eventName, payload) => {
  emitToRoom('role:admin', eventName, payload);
};

module.exports = {
  registerSocketServer,
  getSocketServer,
  emitToRoom,
  emitToVendor,
  emitToCustomer,
  emitToAdmins,
};