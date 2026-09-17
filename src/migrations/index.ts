import * as migration_20260917_052312_baseline from './20260917_052312_baseline';

export const migrations = [
  {
    up: migration_20260917_052312_baseline.up,
    down: migration_20260917_052312_baseline.down,
    name: '20260917_052312_baseline'
  },
];
