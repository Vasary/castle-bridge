import { Unit, Team } from '../../../domain/entities/unit';
import { ServerUnitDto } from '../dto/server-contracts';

export const toDomainUnit = (server: ServerUnitDto, team: Team): Unit =>
  new Unit(server.id, server.title, server.avatar, team, server.health, server.power);

