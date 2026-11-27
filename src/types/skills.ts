export type SkillCategoryId =
  | 'product'
  | 'design'
  | 'development'
  | 'ai_media'
  | 'quality_delivery';

export interface SkillCategoryMeta {
  id: SkillCategoryId;
  label: string;
  labelEn: string;
  description: string;
  order: number;
}

export interface SkillRegistryEntry {
  id: string;
  order: number;
  name: string;
  description: string;
  category: SkillCategoryId;
  categoryLabel: string;
  path: string;
  originalAttachmentPath: string;
  enabled: boolean;
  priority: number;
  keywords: string[];
}

export interface SkillsRegistryFile {
  version: string;
  packName: string;
  goldenRule: string;
  updatedAt: string;
  categories: SkillCategoryMeta[];
  skills: SkillRegistryEntry[];
}

export interface SkillDiskVerification {
  fileExists: boolean;
  originalPreserved: boolean;
  bytes: number;
  lineCount: number;
  sha256Prefix: string | null;
  frontmatterName: string | null;
  frontmatterDescription: string | null;
}

export interface SkillWithStatus extends SkillRegistryEntry {
  disk: SkillDiskVerification;
}

export interface SkillsInventoryResponse {
  version: string;
  packName: string;
  goldenRule: string;
  updatedAt: string;
  totalCount: number;
  enabledCount: number;
  verifiedOnDiskCount: number;
  originalsPreservedCount: number;
  categories: SkillCategoryMeta[];
  skills: SkillWithStatus[];
}

export interface SkillDetailResponse {
  skill: SkillWithStatus;
  loadedFromDisk: boolean;
  rawMarkdown: string;
  instructions: string;
  frontmatter: {
    name: string;
    description: string;
  };
}

export interface SkillMatchCandidate {
  skill: SkillRegistryEntry;
  score: number;
  matchedKeywords: string[];
  matchedDescriptionTokens: string[];
  matchedReason: string;
}

export interface ExcludedDisabledSkill {
  id: string;
  name: string;
  categoryLabel: string;
  potentialScore: number;
  matchedKeywords: string[];
  reason: string;
}

export interface LoadedSkillInstruction {
  id: string;
  order: number;
  name: string;
  description: string;
  category: SkillCategoryId;
  categoryLabel: string;
  path: string;
  score: number;
  matchedReason: string;
  matchedKeywords: string[];
  status: 'loaded' | 'missing_file' | 'invalid_path';
  loadedFromDisk: boolean;
  bytesLoaded: number;
  lineCount: number;
  sha256Prefix: string | null;
  rawMarkdown: string;
  instructions: string;
  loadedAt: string;
}

export interface AgentWorkingContextResult {
  task: string;
  maxSkills: number;
  evaluatedSkillsCount: number;
  enabledSkillsCount: number;
  /** Strictly true ONLY if at least 1 skill matched AND every active skill file was genuinely read from disk */
  hasVerifiedLoadedContext: boolean;
  /** Explicit factual status message (never simulates activation if nothing loaded) */
  honestyNotice: string;
  loadedSkills: LoadedSkillInstruction[];
  failedLoads: Array<{
    id: string;
    name: string;
    path: string;
    status: 'missing_file' | 'invalid_path';
    error: string;
  }>;
  excludedDisabledSkills: ExcludedDisabledSkill[];
  /** Real formatted system context built exclusively from genuinely loaded SKILL.md files */
  agentSystemPromptBlock: string;
  totalLoadedBytes: number;
}
