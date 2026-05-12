import * as migration_20260511_043957_init_schema from './20260511_043957_init_schema';
import * as migration_20260512_042047 from './20260512_042047';

export const migrations = [
  {
    up: migration_20260511_043957_init_schema.up,
    down: migration_20260511_043957_init_schema.down,
    name: '20260511_043957_init_schema',
  },
  {
    up: migration_20260512_042047.up,
    down: migration_20260512_042047.down,
    name: '20260512_042047'
  },
];
