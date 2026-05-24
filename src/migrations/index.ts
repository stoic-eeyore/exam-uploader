import * as migration_20260511_043957_init_schema from './20260511_043957_init_schema';
import * as migration_20260512_042047 from './20260512_042047';
import * as migration_20260518_070809 from './20260518_070809';
import * as migration_20260518_121159 from './20260518_121159';
import * as migration_20260524_202020 from './20260524_202020';

export const migrations = [
  {
    up: migration_20260511_043957_init_schema.up,
    down: migration_20260511_043957_init_schema.down,
    name: '20260511_043957_init_schema',
  },
  {
    up: migration_20260512_042047.up,
    down: migration_20260512_042047.down,
    name: '20260512_042047',
  },
  {
    up: migration_20260518_070809.up,
    down: migration_20260518_070809.down,
    name: '20260518_070809',
  },
  {
    up: migration_20260518_121159.up,
    down: migration_20260518_121159.down,
    name: '20260518_121159',
  },
  {
    up: migration_20260524_202020.up,
    down: migration_20260524_202020.down,
    name: '20260524_202020'
  },
];
