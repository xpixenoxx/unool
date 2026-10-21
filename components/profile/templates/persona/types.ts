import type {
  TemplateFeatures,
  TemplateMeta,
  TemplateProps,
  PublicProfile,
  ProfileLink,
  ProfileProof,
  ProfileProject,
} from '../types';

export type { TemplateFeatures, TemplateMeta, TemplateProps, PublicProfile, ProfileLink, ProfileProof, ProfileProject };

export interface ProfileProofPoint {
  id?: string;
  label: string;
  value: number | string;
  suffix?: string;
  icon?: string;
  description?: string;
}
