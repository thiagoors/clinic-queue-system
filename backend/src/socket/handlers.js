export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join specific rooms based on role
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave-room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

// Helper functions to emit events
export const emitNewTicket = (io, ticket) => {
  io.to('reception').emit('new-ticket', ticket);
};

export const emitCallReception = (io, callData) => {
  io.to('display').emit('call-reception', callData);
};

export const emitTicketForwarded = (io, ticket) => {
  io.to(`sector-${ticket.sectorId}`).emit('ticket-forwarded', ticket);
  io.to('reception').emit('ticket-updated', ticket);
};

export const emitCallSector = (io, callData) => {
  io.to('display').emit('call-sector', callData);
};

export const emitTicketCompleted = (io, ticket) => {
  io.emit('ticket-completed', ticket);
};

export const emitTicketUpdated = (io, ticket) => {
  io.emit('ticket-updated', ticket);
};
