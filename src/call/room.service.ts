import { WorkerService } from './worker.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RoomDto } from './dtos/room.dto';

@Injectable()
export class RoomService {
  logger = new Logger(RoomService.name);
  rooms: Map<string, RoomDto> = new Map();

  constructor(@Inject() private readonly workerService: WorkerService) {}

  async getOrCreateRoom(roomId: string): Promise<RoomDto> {
    // Check if room already exists and if so return it
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId) as RoomDto;
    }

    // create router
    const router = await this.workerService.createRouter();

    // create room
    const room: RoomDto = {
      id: roomId,
      router,
      peers: new Map(),
    };

    // add room to map
    this.rooms.set(roomId, room);
    this.logger.log(`Created new room with id ${roomId}`);

    return room;
  }

  getRoom(roomId: string): RoomDto {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId) as RoomDto;
    } else {
      this.logger.warn(`Room with id ${roomId} not found`);
      throw new Error(`Room with id ${roomId} not found`);
    }
  }
}
