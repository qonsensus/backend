import { WorkerService } from './worker.service';
import { Logger } from '@nestjs/common';
import { Room } from './interfaces/room.interface';

export class RoomService {
  logger = new Logger(RoomService.name);
  rooms: Map<string, Room> = new Map();

  constructor(private readonly workerService: WorkerService) {}

  async getOrCreateRoom(roomId: string): Promise<Room> {
    // Check if room already exists and if so return it
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId) as Room;
    }

    // create router
    const router = await this.workerService.createRouter();

    // create room
    const room: Room = {
      id: roomId,
      router,
      peers: new Map(),
    };

    // add room to map
    this.rooms.set(roomId, room);
    this.logger.log(`Created new room with id ${roomId}`);

    return room;
  }

  getRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId) as Room;
    } else {
      this.logger.warn(`Room with id ${roomId} not found`);
      throw new Error(`Room with id ${roomId} not found`);
    }
  }
}
