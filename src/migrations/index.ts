import * as migration_20260917_052312_baseline from './20260917_052312_baseline';
import * as migration_20260917_134059_add_cafes from './20260917_134059_add_cafes';
import * as migration_20260917_143546_add_cafe_menu from './20260917_143546_add_cafe_menu';

export const migrations = [
  {
    up: migration_20260917_052312_baseline.up,
    down: migration_20260917_052312_baseline.down,
    name: '20260917_052312_baseline',
  },
  {
    up: migration_20260917_134059_add_cafes.up,
    down: migration_20260917_134059_add_cafes.down,
    name: '20260917_134059_add_cafes',
  },
  {
    up: migration_20260917_143546_add_cafe_menu.up,
    down: migration_20260917_143546_add_cafe_menu.down,
    name: '20260917_143546_add_cafe_menu'
  },
];
