import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type {
  AgentWorkingContextResult,
  ExcludedDisabledSkill,
  LoadedSkillInstruction,
  SkillDetailResponse,
  SkillDiskVerification,
  SkillMatchCandidate,
  SkillRegistryEntry,
  SkillsInventoryResponse,
  SkillsRegistryFile,
  SkillWithStatus,
} from '../src/types/skills';

const VALID_SKILL_ID_RE = /^[a-z0-9-]+$/i;

export function normalizeTextForMatching(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function tokenizeTask(input: string): string[] {
  const normalized = normalizeTextForMatching(input);
  // Capture latin/alphanumeric tokens as well as CJK characters/words
  const matches = normalized.match(/[a-z0-9+#._/-]{2,}|[\u4e00-\u9fff]{1,}/g) || [];
  return Array.from(new Set(matches));
}

/**
 * Confinement helper: resolves a relative path inside `<rootDir>/skills` and blocks path traversal.
 */
export function resolveConfinedSkillPath(rootDir: string, relativePath: string): string | null {
  if (!relativePath || typeof relativePath !== 'string') return null;
  if (path.isAbsolute(relativePath)) return null;

  const skillsBaseDir = path.resolve(rootDir, 'skills');
  const resolved = path.resolve(rootDir, relativePath);

  if (resolved !== skillsBaseDir && !resolved.startsWith(skillsBaseDir + path.sep)) {
    return null;
  }
  return resolved;
}

/**
 * Confinement helper for preserved originals in `<rootDir>/public/assets/aistudio`.
 */
export function resolveConfinedOriginalAttachmentPath(rootDir: string, relativePath: string): string | null {
  if (!relativePath || typeof relativePath !== 'string') return null;
  if (path.isAbsolute(relativePath)) return null;

  const originalsDir = path.resolve(rootDir, 'public', 'assets', 'aistudio');
  const resolved = path.resolve(rootDir, relativePath);

  if (resolved !== originalsDir && !resolved.startsWith(originalsDir + path.sep)) {
    return null;
  }
  return resolved;
}

export function parseSkillMarkdown(rawMarkdown: string): {
  name: string;
  description: string;
  instructions: string;
} {
  const text = String(rawMarkdown || '');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return {
      name: '',
      description: '',
      instructions: text.trim(),
    };
  }

  const frontmatterBlock = fmMatch[1];
  const body = (fmMatch[2] || '').trim();

  let name = '';
  let description = '';
  for (const line of frontmatterBlock.split(/\r?\n/)) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    const descMatch = line.match(/^description:\s*(.+)$/);
    if (descMatch) {
      description = descMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  return { name, description, instructions: body };
}

export async function readRegistryFile(rootDir: string): Promise<SkillsRegistryFile> {
  const indexPath = path.resolve(rootDir, 'skills', 'index.json');
  const raw = await readFile(indexPath, 'utf8');
  const parsed = JSON.parse(raw) as SkillsRegistryFile;

  if (!parsed || !Array.isArray(parsed.skills) || !Array.isArray(parsed.categories)) {
    throw new Error('Invalid skills/index.json format');
  }
  return parsed;
}

export async function verifySkillOnDisk(
  rootDir: string,
  entry: SkillRegistryEntry
): Promise<SkillDiskVerification> {
  const confinedSkillPath = resolveConfinedSkillPath(rootDir, entry.path);
  const confinedOriginalPath = resolveConfinedOriginalAttachmentPath(rootDir, entry.originalAttachmentPath);
  const originalPreserved = Boolean(confinedOriginalPath && existsSync(confinedOriginalPath));

  if (!confinedSkillPath || !existsSync(confinedSkillPath)) {
    return {
      fileExists: false,
      originalPreserved,
      bytes: 0,
      lineCount: 0,
      sha256Prefix: null,
      frontmatterName: null,
      frontmatterDescription: null,
    };
  }

  try {
    const fileStats = await stat(confinedSkillPath);
    if (!fileStats.isFile()) {
      return {
        fileExists: false,
        originalPreserved,
        bytes: 0,
        lineCount: 0,
        sha256Prefix: null,
        frontmatterName: null,
        frontmatterDescription: null,
      };
    }

    const content = await readFile(confinedSkillPath, 'utf8');
    const parsed = parseSkillMarkdown(content);
    const sha256Prefix = createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 12);

    return {
      fileExists: content.trim().length > 0,
      originalPreserved,
      bytes: Buffer.byteLength(content, 'utf8'),
      lineCount: content.split(/\r?\n/).length,
      sha256Prefix,
      frontmatterName: parsed.name || null,
      frontmatterDescription: parsed.description || null,
    };
  } catch {
    return {
      fileExists: false,
      originalPreserved,
      bytes: 0,
      lineCount: 0,
      sha256Prefix: null,
      frontmatterName: null,
      frontmatterDescription: null,
    };
  }
}

export async function getSkillsInventory(rootDir: string): Promise<SkillsInventoryResponse> {
  const registry = await readRegistryFile(rootDir);
  const skillsWithStatus: SkillWithStatus[] = await Promise.all(
    registry.skills.map(async (entry) => {
      const disk = await verifySkillOnDisk(rootDir, entry);
      return { ...entry, disk };
    })
  );

  return {
    version: registry.version,
    packName: registry.packName,
    goldenRule: registry.goldenRule,
    updatedAt: registry.updatedAt,
    totalCount: skillsWithStatus.length,
    enabledCount: skillsWithStatus.filter((s) => s.enabled).length,
    verifiedOnDiskCount: skillsWithStatus.filter((s) => s.disk.fileExists).length,
    originalsPreservedCount: skillsWithStatus.filter((s) => s.disk.originalPreserved).length,
    categories: [...registry.categories].sort((a, b) => a.order - b.order),
    skills: skillsWithStatus.sort((a, b) => a.order - b.order),
  };
}

export async function getSkillDetailFromDisk(
  rootDir: string,
  skillId: string
): Promise<SkillDetailResponse> {
  if (!VALID_SKILL_ID_RE.test(skillId)) {
    throw new Error('Invalid skill identifier');
  }

  const registry = await readRegistryFile(rootDir);
  const entry = registry.skills.find((s) => s.id === skillId || s.name === skillId);
  if (!entry) {
    throw new Error(`Unknown skill: ${skillId}`);
  }

  const disk = await verifySkillOnDisk(rootDir, entry);
  const confinedPath = resolveConfinedSkillPath(rootDir, entry.path);

  if (!confinedPath || !disk.fileExists) {
    return {
      skill: { ...entry, disk },
      loadedFromDisk: false,
      rawMarkdown: '',
      instructions: '',
      frontmatter: {
        name: entry.name,
        description: entry.description,
      },
    };
  }

  const rawMarkdown = await readFile(confinedPath, 'utf8');
  const parsed = parseSkillMarkdown(rawMarkdown);

  return {
    skill: { ...entry, disk },
    loadedFromDisk: true,
    rawMarkdown,
    instructions: parsed.instructions,
    frontmatter: {
      name: parsed.name || entry.name,
      description: parsed.description || entry.description,
    },
  };
}

export async function setSkillEnabledState(
  rootDir: string,
  skillId: string,
  enabled: boolean
): Promise<SkillsInventoryResponse> {
  if (!VALID_SKILL_ID_RE.test(skillId)) {
    throw new Error('Invalid skill identifier');
  }
  if (typeof enabled !== 'boolean') {
    throw new Error('enabled must be a strict boolean');
  }

  const registry = await readRegistryFile(rootDir);
  const targetIndex = registry.skills.findIndex((s) => s.id === skillId || s.name === skillId);
  if (targetIndex === -1) {
    throw new Error(`Unknown skill: ${skillId}`);
  }

  registry.skills[targetIndex] = {
    ...registry.skills[targetIndex],
    enabled,
  };
  registry.updatedAt = new Date().toISOString();

  const indexPath = path.resolve(rootDir, 'skills', 'index.json');
  await writeFile(indexPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  return getSkillsInventory(rootDir);
}

function scoreSkillAgainstTask(
  skill: SkillRegistryEntry,
  normalizedTask: string,
  taskTokens: string[]
): SkillMatchCandidate | null {
  if (!normalizedTask) return null;

  let score = 0;
  const matchedKeywords: string[] = [];
  const matchedDescriptionTokens: string[] = [];

  const normalizedName = normalizeTextForMatching(skill.name);
  const normalizedId = normalizeTextForMatching(skill.id);

  // 1. Direct skill name or ID mention
  if (normalizedTask.includes(normalizedName) || normalizedTask.includes(normalizedId)) {
    score += 18;
    matchedKeywords.push(skill.name);
  } else {
    const nameParts = normalizedName.split('-').filter((p) => p.length >= 3);
    for (const part of nameParts) {
      if (taskTokens.includes(part)) {
        score += 5;
        matchedKeywords.push(part);
      }
    }
  }

  // 2. Curated multilingual keyword matching
  for (const kw of skill.keywords) {
    const normKw = normalizeTextForMatching(kw);
    if (!normKw) continue;

    if (normKw.includes(' ')) {
      if (normalizedTask.includes(normKw)) {
        score += 8;
        matchedKeywords.push(kw);
      }
    } else if (normKw.length <= 2) {
      // Short critical tokens (ui, ux, ia, ai, qa, ci, cd): require exact token boundary
      if (taskTokens.includes(normKw)) {
        score += 6;
        matchedKeywords.push(kw);
      }
    } else {
      // Exact token or clean prefix/substring match inside tokens
      const tokenHit = taskTokens.some(
        (t) => t === normKw || (t.length >= 4 && normKw.length >= 4 && (t.includes(normKw) || normKw.includes(t)))
      );
      if (tokenHit) {
        score += 5.5;
        matchedKeywords.push(kw);
      }
    }
  }

  // 3. Description overlap (minor tie-breaker; prevents false positives on stop words)
  const stopWords = new Set([
    'avec', 'pour', 'dans', 'une', 'des', 'les', 'sur', 'par', 'plus', 'leur', 'leurs',
    'sans', 'et', 'ou', 'de', 'du', 'la', 'le', 'en', 'un', 'est', 'sont', 'qui',
    'the', 'and', 'for', 'with', 'from', 'that', 'this',
  ]);
  const descTokens = tokenizeTask(skill.description).filter((t) => t.length >= 4 && !stopWords.has(t));
  for (const dt of descTokens) {
    if (taskTokens.some((t) => t === dt || (t.length >= 5 && (t.startsWith(dt.slice(0, 5)) || dt.startsWith(t.slice(0, 5)))))) {
      score += 2;
      matchedDescriptionTokens.push(dt);
    }
  }

  const uniqueKeywords = Array.from(new Set(matchedKeywords));
  const uniqueDescTokens = Array.from(new Set(matchedDescriptionTokens));

  // Require a meaningful match threshold so unrelated queries load 0 skills instead of random noise
  if (score < 4.5) {
    return null;
  }

  // Subtle tie-break boost from skill priority (0.01 * priority)
  const finalScore = Number((score + skill.priority * 0.05).toFixed(2));

  const reasons: string[] = [];
  if (uniqueKeywords.length > 0) {
    reasons.push(`Mots-clés : ${uniqueKeywords.slice(0, 4).join(', ')}`);
  }
  if (uniqueDescTokens.length > 0) {
    reasons.push(`Usage : ${uniqueDescTokens.slice(0, 3).join(', ')}`);
  }

  return {
    skill,
    score: finalScore,
    matchedKeywords: uniqueKeywords,
    matchedDescriptionTokens: uniqueDescTokens,
    matchedReason: reasons.join(' · ') || 'Pertinence sémantique sur la tâche',
  };
}

export function selectRelevantSkillsFromRegistry(
  registry: SkillsRegistryFile,
  task: string,
  options?: { maxSkills?: number }
): {
  selected: SkillMatchCandidate[];
  excludedDisabled: ExcludedDisabledSkill[];
} {
  const maxSkills = Math.min(Math.max(Number(options?.maxSkills) || 3, 1), 5);
  const normalizedTask = normalizeTextForMatching(task);
  const taskTokens = tokenizeTask(task);

  const candidates: SkillMatchCandidate[] = [];
  const excludedDisabled: ExcludedDisabledSkill[] = [];

  for (const skill of registry.skills) {
    const match = scoreSkillAgainstTask(skill, normalizedTask, taskTokens);
    if (!match) continue;

    if (!skill.enabled) {
      excludedDisabled.push({
        id: skill.id,
        name: skill.name,
        categoryLabel: skill.categoryLabel,
        potentialScore: match.score,
        matchedKeywords: match.matchedKeywords,
        reason: 'Compétence pertinente pour la tâche mais désactivée dans skills/index.json — instructions non chargées.',
      });
    } else {
      candidates.push(match);
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.skill.order - b.skill.order);
  excludedDisabled.sort((a, b) => b.potentialScore - a.potentialScore);

  return {
    selected: candidates.slice(0, maxSkills),
    excludedDisabled,
  };
}

/**
 * Selects relevant ENABLED skills for a task and GENUINELY loads their SKILL.md files from disk.
 * Never simulates activation: if no skill matches, or a skill is disabled, or a file is missing,
 * it explicitly reports the real loading status without injecting fake instructions.
 */
export async function loadAgentSkillContext(
  rootDir: string,
  task: string,
  options?: { maxSkills?: number; explicitSkillIds?: string[] }
): Promise<AgentWorkingContextResult> {
  const maxSkills = Math.min(Math.max(Number(options?.maxSkills) || 3, 1), 5);
  const registry = await readRegistryFile(rootDir);
  const enabledSkillsCount = registry.skills.filter((s) => s.enabled).length;

  let candidates: SkillMatchCandidate[] = [];
  let excludedDisabledSkills: ExcludedDisabledSkill[] = [];

  if (Array.isArray(options?.explicitSkillIds) && options.explicitSkillIds.length > 0) {
    const requestedSet = new Set(options.explicitSkillIds.slice(0, maxSkills));
    for (const skill of registry.skills) {
      if (!requestedSet.has(skill.id) && !requestedSet.has(skill.name)) continue;
      if (!skill.enabled) {
        excludedDisabledSkills.push({
          id: skill.id,
          name: skill.name,
          categoryLabel: skill.categoryLabel,
          potentialScore: 100,
          matchedKeywords: [skill.name],
          reason: 'Compétence demandée explicitement mais désactivée dans skills/index.json — chargement refusé.',
        });
      } else {
        candidates.push({
          skill,
          score: 100,
          matchedKeywords: [skill.name],
          matchedDescriptionTokens: [],
          matchedReason: 'Sélection manuelle explicite (compétence activée)',
        });
      }
    }
  } else {
    const selection = selectRelevantSkillsFromRegistry(registry, task, { maxSkills });
    candidates = selection.selected;
    excludedDisabledSkills = selection.excludedDisabled;
  }

  const loadedSkills: LoadedSkillInstruction[] = [];
  const failedLoads: AgentWorkingContextResult['failedLoads'] = [];

  for (const candidate of candidates) {
    const { skill, score, matchedReason, matchedKeywords } = candidate;
    const confinedPath = resolveConfinedSkillPath(rootDir, skill.path);

    if (!confinedPath) {
      failedLoads.push({
        id: skill.id,
        name: skill.name,
        path: skill.path,
        status: 'invalid_path',
        error: 'Chemin de compétence hors du répertoire skills/ bloqué par confinement.',
      });
      continue;
    }

    if (!existsSync(confinedPath)) {
      failedLoads.push({
        id: skill.id,
        name: skill.name,
        path: skill.path,
        status: 'missing_file',
        error: `Fichier ${skill.path} introuvable sur le disque.`,
      });
      continue;
    }

    try {
      const rawMarkdown = await readFile(confinedPath, 'utf8');
      if (!rawMarkdown.trim()) {
        failedLoads.push({
          id: skill.id,
          name: skill.name,
          path: skill.path,
          status: 'missing_file',
          error: `Fichier ${skill.path} vide sur le disque.`,
        });
        continue;
      }

      const parsed = parseSkillMarkdown(rawMarkdown);
      const sha256Prefix = createHash('sha256').update(rawMarkdown, 'utf8').digest('hex').slice(0, 12);

      loadedSkills.push({
        id: skill.id,
        order: skill.order,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        categoryLabel: skill.categoryLabel,
        path: skill.path,
        score,
        matchedReason,
        matchedKeywords,
        status: 'loaded',
        loadedFromDisk: true,
        bytesLoaded: Buffer.byteLength(rawMarkdown, 'utf8'),
        lineCount: rawMarkdown.split(/\r?\n/).length,
        sha256Prefix,
        rawMarkdown,
        instructions: parsed.instructions,
        loadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      failedLoads.push({
        id: skill.id,
        name: skill.name,
        path: skill.path,
        status: 'missing_file',
        error: String(err?.message || err),
      });
    }
  }

  const totalLoadedBytes = loadedSkills.reduce((acc, s) => acc + s.bytesLoaded, 0);
  const hasVerifiedLoadedContext = loadedSkills.length > 0 && loadedSkills.every((s) => s.loadedFromDisk);

  const agentSystemPromptBlock = hasVerifiedLoadedContext
    ? [
        '### AI STUDIO MASTER SKILLS CHARGÉES DEPUIS LE DISQUE ###',
        `Tâche analysée : ${task}`,
        `Compétences réellement injectées (${loadedSkills.length}) : ${loadedSkills.map((s) => s.id).join(', ')}`,
        '',
        ...loadedSkills.map(
          (s) =>
            `--- [SKILL: ${s.name} | Source: ${s.path} | SHA256: ${s.sha256Prefix} | ${s.bytesLoaded} octets] ---\n${s.instructions}`
        ),
        '### FIN DES INSTRUCTIONS SKILLS ###',
      ].join('\n\n')
    : '';

  let honestyNotice = '';
  if (loadedSkills.length === 0 && excludedDisabledSkills.length > 0) {
    honestyNotice = `Aucune instruction injectée : ${excludedDisabledSkills.length} compétence(s) pertinente(s) détectée(s) mais actuellement désactivée(s).`;
  } else if (loadedSkills.length === 0 && failedLoads.length > 0) {
    honestyNotice = `Échec de lecture disque : aucun fichier SKILL.md valide n'a pu être chargé (aucune activation simulée).`;
  } else if (loadedSkills.length === 0) {
    honestyNotice = `Aucune compétence spécialisée déclenchée pour cette requête ; l'agent fonctionne avec ses instructions système de base uniquement.`;
  } else {
    honestyNotice = `${loadedSkills.length} fichier(s) SKILL.md réellement lu(s) depuis le disque (${totalLoadedBytes} octets) et prêt(s) pour le contexte de travail de l'agent.`;
  }

  return {
    task,
    maxSkills,
    evaluatedSkillsCount: registry.skills.length,
    enabledSkillsCount,
    hasVerifiedLoadedContext,
    honestyNotice,
    loadedSkills,
    failedLoads,
    excludedDisabledSkills,
    agentSystemPromptBlock,
    totalLoadedBytes,
  };
}
