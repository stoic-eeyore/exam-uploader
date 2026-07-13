import * as migration_20260511_043957_init_schema from './20260511_043957_init_schema';
import * as migration_20260512_042047 from './20260512_042047';
import * as migration_20260518_070809 from './20260518_070809';
import * as migration_20260518_121159 from './20260518_121159';
import * as migration_20260524_202020 from './20260524_202020';
import * as migration_20260601_101629 from './20260601_101629';
import * as migration_20260601_192853 from './20260601_192853';
import * as migration_20260711_164418 from './20260711_164418';
import * as migration_20260711_175431 from './20260711_175431';
import * as migration_20260713_032450 from './20260713_032450';

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
    name: '20260524_202020',
  },
  {
    up: migration_20260601_101629.up,
    down: migration_20260601_101629.down,
    name: '20260601_101629',
  },
  {
    up: migration_20260601_192853.up,
    down: migration_20260601_192853.down,
    name: '20260601_192853',
  },
  {
    up: migration_20260711_164418.up,
    down: migration_20260711_164418.down,
    name: '20260711_164418',
  },
  {
    up: migration_20260711_175431.up,
    down: migration_20260711_175431.down,
    name: '20260711_175431',
  },
  {
    up: migration_20260713_032450.up,
    down: migration_20260713_032450.down,
    name: '20260713_032450'
  },
];
