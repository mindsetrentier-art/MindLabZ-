import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, cp, rm, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  getSkillsInventory,
  getSkillDetailFromDisk,
  loadAgentSkillContext,
  readRegistryFile,
  resolveConfinedSkillPath,
  selectRelevantSkillsFromRegistry,
  setSkillEnabledState,
} from '../server/skillsEngine';

const ROOT_DIR = process.cwd();

test('Registry integrity: all 20 Master Skills exist in index.json, on disk, and preserve originals', async () => {
  const inventory = await getSkillsInventory(ROOT_DIR);

  assert.equal(inventory.totalCount, 20, 'Expected all 20 skills in skills/index.json');
  assert.equal(inventory.verifiedOnDiskCount, 20, 'Expected all 20 SKILL.md files on disk');
  assert.equal(inventory.originalsPreservedCount, 20, 'Expected all 20 original attachments preserved');
  assert.equal(inventory.categories.length, 5, 'Expected 5 categories');

  const categoryCounts = new Map<string, number>();
  for (const skill of inventory.skills) {
    categoryCounts.set(skill.category, (categoryCounts.get(skill.category) || 0) + 1);
    assert.ok(skill.disk.fileExists, `Missing SKILL.md for ${skill.id}`);
    assert.ok(skill.disk.originalPreserved, `Original attachment missing for ${skill.id}`);
    assert.equal(skill.disk.frontmatterName, skill.name);

    // Verify exact byte-for-byte preservation against original attachment
    const activeBytes = await readFile(path.resolve(ROOT_DIR, skill.path), 'utf8');
    const originalBytes = await readFile(path.resolve(ROOT_DIR, skill.originalAttachmentPath), 'utf8');
    assert.equal(activeBytes, originalBytes, `Active copy differs from preserved original for ${skill.id}`);
  }

  assert.equal(categoryCounts.get('product'), 1);
  assert.equal(categoryCounts.get('design'), 3);
  assert.equal(categoryCounts.get('development'), 5);
  assert.equal(categoryCounts.get('ai_media'), 4);
  assert.equal(categoryCounts.get('quality_delivery'), 7);
});

test('Task-based selector chooses only relevant skills (not all 20) and loads 0 for unrelated queries', async () => {
  const registry = await readRegistryFile(ROOT_DIR);

  const securityQa = selectRelevantSkillsFromRegistry(
    registry,
    "Auditer la sécurité d'une route API Express contre le path traversal et écrire des tests Playwright",
    { maxSkills: 3 }
  );
  const selectedIds = securityQa.selected.map((s) => s.skill.id);
  assert.ok(selectedIds.length >= 2 && selectedIds.length <= 3);
  assert.ok(selectedIds.includes('08-security-audit'), `Expected 08-security-audit, got ${selectedIds.join(',')}`);
  assert.ok(selectedIds.includes('10-qa-testing'), `Expected 10-qa-testing, got ${selectedIds.join(',')}`);

  const audioMatch = selectRelevantSkillsFromRegistry(
    registry,
    'Synchroniser la voix TTS mot à mot avec les timestamps et export SRT',
    { maxSkills: 2 }
  );
  assert.equal(audioMatch.selected[0]?.skill.id, '13-audio-music-intelligence');

  const offTopic = await loadAgentSkillContext(ROOT_DIR, 'Quelle est la météo à Lyon aujourd’hui ?');
  assert.equal(offTopic.loadedSkills.length, 0);
  assert.equal(offTopic.hasVerifiedLoadedContext, false);
  assert.equal(offTopic.agentSystemPromptBlock, '');
});

test('Context loader genuinely reads SKILL.md instructions from disk without simulating missing files', async () => {
  const ctx = await loadAgentSkillContext(
    ROOT_DIR,
    'Concevoir une animation fluide accessible i18n en français et chinois',
    { maxSkills: 3 }
  );

  assert.equal(ctx.hasVerifiedLoadedContext, true);
  assert.ok(ctx.loadedSkills.length >= 2 && ctx.loadedSkills.length <= 3);
  const loadedIds = ctx.loadedSkills.map((s) => s.id);
  assert.ok(loadedIds.includes('07-animation-motion'));
  assert.ok(loadedIds.includes('17-accessibility-i18n'));

  for (const loaded of ctx.loadedSkills) {
    assert.equal(loaded.loadedFromDisk, true);
    assert.equal(loaded.status, 'loaded');
    assert.ok(loaded.bytesLoaded > 200);
    assert.ok(ctx.agentSystemPromptBlock.includes(loaded.instructions));
  }

  // Test honest fail-closed behavior if a SKILL.md file is missing on disk
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'skills-missing-test-'));
  try {
    await cp(path.join(ROOT_DIR, 'skills'), path.join(tempRoot, 'skills'), { recursive: true });
    await cp(path.join(ROOT_DIR, 'public'), path.join(tempRoot, 'public'), { recursive: true });
    await unlink(path.join(tempRoot, 'skills', '08-security-audit', 'SKILL.md'));

    const brokenCtx = await loadAgentSkillContext(tempRoot, 'security-audit', {
      explicitSkillIds: ['08-security-audit'],
    });
    assert.equal(brokenCtx.loadedSkills.length, 0);
    assert.equal(brokenCtx.hasVerifiedLoadedContext, false);
    assert.equal(brokenCtx.failedLoads.length, 1);
    assert.equal(brokenCtx.failedLoads[0].status, 'missing_file');
    assert.equal(brokenCtx.agentSystemPromptBlock, '');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('Toggling a skill disabled excludes it from selection and genuine context loading until re-enabled', async () => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'skills-toggle-test-'));
  try {
    await cp(path.join(ROOT_DIR, 'skills'), path.join(tempRoot, 'skills'), { recursive: true });
    await cp(path.join(ROOT_DIR, 'public'), path.join(tempRoot, 'public'), { recursive: true });

    // Disable 08-security-audit
    const afterDisable = await setSkillEnabledState(tempRoot, '08-security-audit', false);
    assert.equal(afterDisable.enabledCount, 19);
    const disabledEntry = afterDisable.skills.find((s) => s.id === '08-security-audit');
    assert.equal(disabledEntry?.enabled, false);

    // Attempt to select/load for security audit task
    const ctxWhileDisabled = await loadAgentSkillContext(
      tempRoot,
      'Auditer la sécurité OWASP XSS et CSRF',
      { maxSkills: 2 }
    );
    assert.ok(
      !ctxWhileDisabled.loadedSkills.some((s) => s.id === '08-security-audit'),
      'Disabled skill must NOT be loaded into context'
    );
    assert.ok(
      ctxWhileDisabled.excludedDisabledSkills.some((s) => s.id === '08-security-audit'),
      'Disabled skill should be reported honestly in excludedDisabledSkills'
    );

    // Re-enable 08-security-audit
    const afterReenable = await setSkillEnabledState(tempRoot, '08-security-audit', true);
    assert.equal(afterReenable.enabledCount, 20);

    const ctxAfterReenable = await loadAgentSkillContext(
      tempRoot,
      'Auditer la sécurité OWASP XSS et CSRF',
      { maxSkills: 2 }
    );
    assert.ok(ctxAfterReenable.loadedSkills.some((s) => s.id === '08-security-audit'));
    assert.equal(ctxAfterReenable.hasVerifiedLoadedContext, true);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('Security confinement blocks path traversal and invalid skill identifiers', async () => {
  assert.equal(resolveConfinedSkillPath(ROOT_DIR, '../../etc/passwd'), null);
  assert.equal(resolveConfinedSkillPath(ROOT_DIR, '/etc/passwd'), null);
  assert.equal(resolveConfinedSkillPath(ROOT_DIR, 'skills/../package.json'), null);
  assert.ok(
    resolveConfinedSkillPath(ROOT_DIR, 'skills/01-ui-ux-premium/SKILL.md')?.endsWith(
      path.join('skills', '01-ui-ux-premium', 'SKILL.md')
    )
  );

  await assert.rejects(
    () => getSkillDetailFromDisk(ROOT_DIR, '../package.json'),
    /Invalid skill identifier/
  );
});
