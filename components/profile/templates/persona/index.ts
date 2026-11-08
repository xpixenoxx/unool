// Persona-driven template exports
// Each template is a self-contained component with its own styling and animations

import { LoverTemplate } from './lover';
import { LoneTemplate } from './lone';
import { EnergyTemplate } from './energy';
import { RebellionTemplate } from './rebellion';
import { VisionTemplate } from './vision';
import { HumanTemplate } from './human';
import { MachineTemplate } from './the-machine';
import { ClubTemplate } from './the-club';
import { StudioTemplate } from './the-studio';
import { BuilderTemplate } from './the-builder';
import { VisionaryTemplate } from './the-visionary';
import { HustlerTemplate } from './the-hustler';
import { StackTemplate } from './the-stack';
import { BookshelfTemplate } from './the-bookshelf';
import { CubeTemplate } from './the-cube';
import { MonolithTemplate } from './the-monolith';
import { AestheteTemplate } from './the-aesthete';
import { CreatorTemplate } from './the-creator';
import { VoiceTemplate } from './the-voice';
import { MetroTemplate } from './the-metro';
import { NorenTemplate } from './the-noren';
import { DesktopTemplate } from './the-desktop';
import { CalendarTemplate } from './the-calendar';

export {
  LoverTemplate,
  LoneTemplate,
  EnergyTemplate,
  RebellionTemplate,
  VisionTemplate,
  HumanTemplate,
  MachineTemplate,
  ClubTemplate,
  StudioTemplate,
  BuilderTemplate,
  VisionaryTemplate,
  HustlerTemplate,
  StackTemplate,
  BookshelfTemplate,
  CubeTemplate,
  MonolithTemplate,
  AestheteTemplate,
  CreatorTemplate,
  VoiceTemplate,
  MetroTemplate,
  NorenTemplate,
  DesktopTemplate,
  CalendarTemplate,
};

// Template mapping for dynamic loading
export const TEMPLATE_COMPONENTS = {
  lover: LoverTemplate,
  lone: LoneTemplate,
  energy: EnergyTemplate,
  rebellion: RebellionTemplate,
  vision: VisionTemplate,
  human: HumanTemplate,
  'the-machine': MachineTemplate,
  'the-club': ClubTemplate,
  'the-studio': StudioTemplate,
  'the-builder': BuilderTemplate,
  'the-visionary': VisionaryTemplate,
  'the-hustler': HustlerTemplate,
  'the-stack': StackTemplate,
  'the-bookshelf': BookshelfTemplate,
  'the-cube': CubeTemplate,
  'the-monolith': MonolithTemplate,
  'the-aesthete': AestheteTemplate,
  'the-creator': CreatorTemplate,
  'the-voice': VoiceTemplate,
  'the-metro': MetroTemplate,
  'the-noren': NorenTemplate,
  'the-desktop': DesktopTemplate,
  'the-calendar': CalendarTemplate,
} as const;

export type TemplateKey = keyof typeof TEMPLATE_COMPONENTS;