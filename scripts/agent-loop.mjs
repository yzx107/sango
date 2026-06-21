#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldPull = args.has('--pull');
const asJson = args.has('--json');
const agentTaskLabel = 'agent-task';

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.quiet ? 'pipe' : ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function parseLoopState(markdown) {
  const state = {};
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^-\s+([a-zA-Z_]+):\s*(.+)$/);
    if (match) state[match[1]] = match[2].trim();
  }
  return state;
}

function latestAgentStatus(markdown) {
  const headings = [...markdown.matchAll(/^## (Agent (?:Update|Handoff).*)$/gm)];
  if (headings.length === 0) return 'No agent update found.';
  const last = headings[headings.length - 1];
  const start = last.index ?? 0;
  const next = markdown.indexOf('\n## ', start + 1);
  return markdown.slice(start, next === -1 ? undefined : next).trim();
}

function nextAction(state) {
  const current = state.current_owner ?? 'Unknown owner';
  switch (state.state) {
    case 'needs_art':
      return `${current}: revise generated assets/UI, update manifest and agent-status, then set loop-state to needs_dev.`;
    case 'needs_dev':
      return `${current}: integrate/fix locally, run validation, update status, then push and set loop-state to needs_review.`;
    case 'needs_review':
      return `${current}: review GitHub diff, CI, PROJECT_BRIEF boundaries, and art direction; set done, needs_art, or needs_dev.`;
    case 'blocked':
      return 'User decision needed before agents continue.';
    case 'done':
      return 'No active work. Create or update a GitHub agent-task issue for the next loop.';
    case 'in_progress':
      return `${current}: continue the current scoped task and keep file locks respected.`;
    default:
      return `${current}: inspect .ai-bridge/current-plan.md for the next scoped action.`;
  }
}

function getRepo() {
  const repo = run('gh', ['repo', 'view', '--json', 'nameWithOwner'], { quiet: true });
  try {
    return repo.ok ? { ok: true, nameWithOwner: JSON.parse(repo.stdout).nameWithOwner } : { ok: false, error: repo.stderr || 'gh repo view failed' };
  } catch {
    return { ok: false, error: 'Unable to parse gh repo view output' };
  }
}

function getLatestRun(repo) {
  if (!repo.ok) return null;
  const latest = run('gh', ['run', 'list', '--repo', repo.nameWithOwner, '--limit', '1', '--json', 'databaseId,status,conclusion,workflowName,headSha,url'], {
    quiet: true,
  });
  if (!latest.ok) return null;
  try {
    return JSON.parse(latest.stdout)[0] ?? null;
  } catch {
    return null;
  }
}

function ensureAgentTaskLabel(repo) {
  if (!repo.ok) return { status: 'unavailable', error: repo.error };
  const list = run('gh', ['label', 'list', '--repo', repo.nameWithOwner, '--search', agentTaskLabel, '--json', 'name'], { quiet: true });
  if (!list.ok) return { status: 'error', error: list.stderr || 'Unable to list GitHub labels' };
  let labels = [];
  try {
    labels = list.stdout ? JSON.parse(list.stdout) : [];
  } catch {
    return { status: 'error', error: 'Unable to parse GitHub labels' };
  }
  if (labels.some((label) => label.name === agentTaskLabel)) return { status: 'exists', name: agentTaskLabel };
  const created = run('gh', ['label', 'create', agentTaskLabel, '--repo', repo.nameWithOwner, '--description', 'Sango agent task queue item', '--color', '5319e7'], {
    quiet: true,
  });
  if (!created.ok) return { status: 'error', error: created.stderr || `Unable to create ${agentTaskLabel} label` };
  return { status: 'created', name: agentTaskLabel };
}

function getOpenAgentTasks(repo, labelStatus) {
  if (!repo.ok) return { tasks: [], error: repo.error };
  if (!['exists', 'created'].includes(labelStatus.status)) return { tasks: [], error: labelStatus.error || `${agentTaskLabel} label is unavailable` };
  const issues = run('gh', ['issue', 'list', '--repo', repo.nameWithOwner, '--label', agentTaskLabel, '--state', 'open', '--limit', '5', '--json', 'number,title,url'], {
    quiet: true,
  });
  if (!issues.ok) return { tasks: [], error: issues.stderr || `Unable to list issues labeled ${agentTaskLabel}` };
  try {
    return { tasks: JSON.parse(issues.stdout), error: '' };
  } catch {
    return { tasks: [], error: 'Unable to parse issue list output' };
  }
}

const protocolFiles = [
  'PROJECT_BRIEF.md',
  'AGENTS.md',
  '.ai-bridge/current-plan.md',
  '.ai-bridge/loop-state.md',
  '.ai-bridge/file-locks.md',
  '.ai-bridge/agent-status.md',
];

const missing = protocolFiles.filter((file) => !existsSync(path.join(root, file)));
const branch = run('git', ['branch', '--show-current'], { quiet: true }).stdout || 'unknown';
const remote = run('git', ['remote', 'get-url', 'origin'], { quiet: true }).stdout || 'no-origin';
const beforeHead = run('git', ['rev-parse', '--short', 'HEAD'], { quiet: true }).stdout || 'unknown';
const statusBefore = run('git', ['status', '--porcelain'], { quiet: true }).stdout;
const fetchResult = remote === 'no-origin' ? { ok: false, stderr: 'no origin remote' } : run('git', ['fetch', '--quiet', 'origin'], { quiet: true });

let pullResult = null;
if (shouldPull) {
  if (statusBefore) pullResult = { ok: false, stderr: 'working tree has local changes; refusing to pull' };
  else pullResult = run('git', ['pull', '--ff-only'], { quiet: true });
}

const afterHead = run('git', ['rev-parse', '--short', 'HEAD'], { quiet: true }).stdout || beforeHead;
const upstream = run('git', ['rev-parse', '--short', `origin/${branch}`], { quiet: true }).stdout || '';
const statusAfter = run('git', ['status', '--short'], { quiet: true }).stdout;
const loopState = parseLoopState(read('.ai-bridge/loop-state.md'));
const repo = getRepo();
const latestRun = getLatestRun(repo);
const labelStatus = ensureAgentTaskLabel(repo);
const openTasksResult = getOpenAgentTasks(repo, labelStatus);
const report = {
  branch,
  remote,
  head: afterHead,
  upstream,
  fetched: fetchResult.ok,
  pulled: pullResult ? pullResult.ok : false,
  pullMessage: pullResult?.stderr || pullResult?.stdout || '',
  dirty: Boolean(statusAfter),
  localChanges: statusAfter ? statusAfter.split(/\r?\n/) : [],
  missingProtocolFiles: missing,
  loopState,
  nextAction: nextAction(loopState),
  agentTaskLabel: labelStatus,
  latestRun,
  openAgentTasks: openTasksResult.tasks,
  openAgentTasksError: openTasksResult.error,
  latestAgentStatus: latestAgentStatus(read('.ai-bridge/agent-status.md')),
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Sango Agent Loop');
  console.log('================');
  console.log(`branch: ${report.branch}`);
  console.log(`remote: ${report.remote}`);
  console.log(`head: ${report.head}${report.upstream ? ` (origin/${branch}: ${report.upstream})` : ''}`);
  console.log(`fetch: ${report.fetched ? 'ok' : fetchResult.stderr || 'skipped'}`);
  if (pullResult) console.log(`pull: ${pullResult.ok ? 'ok' : pullResult.stderr || pullResult.stdout}`);
  console.log(`working tree: ${report.dirty ? 'dirty' : 'clean'}`);
  if (report.localChanges.length > 0) {
    console.log('local changes:');
    for (const change of report.localChanges) console.log(`  ${change}`);
  }
  if (missing.length > 0) {
    console.log('missing protocol files:');
    for (const file of missing) console.log(`  ${file}`);
  }
  console.log('');
  console.log(`state: ${report.loopState.state ?? 'unknown'}`);
  console.log(`current_owner: ${report.loopState.current_owner ?? 'unknown'}`);
  console.log(`next_owner: ${report.loopState.next_owner ?? 'unknown'}`);
  console.log(`next_action: ${report.nextAction}`);
  if (latestRun) {
    console.log('');
    console.log(`latest_ci: ${latestRun.workflowName} ${latestRun.status}/${latestRun.conclusion || 'pending'} ${latestRun.url}`);
  }
  console.log(`agent_task_label: ${report.agentTaskLabel.status}${report.agentTaskLabel.error ? ` (${report.agentTaskLabel.error})` : ''}`);
  if (report.openAgentTasksError) console.log(`agent_task_error: ${report.openAgentTasksError}`);
  if (report.openAgentTasks.length > 0) {
    console.log('');
    console.log('open agent tasks:');
    for (const issue of report.openAgentTasks) console.log(`  #${issue.number} ${issue.title} ${issue.url}`);
  }
  console.log('');
  console.log(report.latestAgentStatus);
}

const githubTaskError = !['exists', 'created'].includes(report.agentTaskLabel.status) || Boolean(report.openAgentTasksError);
if (missing.length > 0 || (process.env.CI && githubTaskError)) process.exit(1);
