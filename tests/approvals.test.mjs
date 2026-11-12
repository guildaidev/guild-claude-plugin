import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const pluginRoot = fileURLToPath(new URL('../', import.meta.url));
const { hooks } = JSON.parse(readFileSync(join(pluginRoot, 'hooks/hooks.json'), 'utf8'));

function decide(tool, root = pluginRoot) {
  const decisions = [];
  for (const group of hooks.PreToolUse) {
    if (!new RegExp(group.matcher).test(tool)) continue;
    for (const hook of group.hooks) {
      const result = spawnSync('sh', ['-c', hook.command], {
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
        input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: {} }),
        encoding: 'utf8',
        timeout: 5000,
      });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
      decisions.push(JSON.parse(result.stdout).hookSpecificOutput);
    }
  }
  return decisions;
}

for (const tool of [
  'guild_whoami', 'guild_get_integration_tool', 'guild_list_credentials',
  'guild_get_gateway_profile', 'guild_wait_for_job', 'guild_wait_for_session',
  'guild_create_agent', 'guild_create_workspace', 'guild_create_gateway_profile',
  'guild_start_profile_agent_test_session',
]) {
  test(`preapproves ${tool}`, () => {
    assert.deepEqual(decide(`mcp__plugin_guild_guild__${tool}`), [{
      hookEventName: 'PreToolUse', permissionDecision: 'allow',
    }]);
  });
}

for (const tool of [
  'guild_create_agent_version', 'guild_configure_llm_agent',
  'guild_publish_agent_version', 'guild_unpublish_agent_version',
  'guild_install_agent', 'guild_update_installed_agent', 'guild_uninstall_agent',
  'guild_schedule_agent', 'guild_create_webhook_trigger', 'guild_update_schedule',
  'guild_pause_trigger', 'guild_resume_trigger', 'guild_archive_agent',
  'guild_add_profile_integration', 'guild_update_profile_integration',
  'guild_remove_profile_integration', 'guild_set_workspace_variable',
  'guild_start_agent_test_session', 'guild_send_session_message', 'guild_future_tool',
]) {
  test(`leaves ${tool} to normal permission checks`, () => {
    assert.deepEqual(decide(`mcp__plugin_guild_guild__${tool}`), []);
  });
}

for (const tool of [
  'Bash', 'AskUserQuestion', 'mcp__guild__guild_whoami',
  'mcp__plugin_other_guild__guild_whoami',
  'prefix_mcp__plugin_guild_guild__guild_whoami',
  'mcp__plugin_guild_guild__guild_whoami_extra',
]) {
  test(`does not approve unrelated tool ${tool}`, () => {
    assert.deepEqual(decide(tool), []);
  });
}

test('loads the handler from an installation path containing spaces', () => {
  const directory = mkdtempSync(join(tmpdir(), 'guild approvals '));
  const root = join(directory, 'plugin checkout');
  try {
    symlinkSync(pluginRoot, root, 'dir');
    assert.equal(decide('mcp__plugin_guild_guild__guild_whoami', root)[0].permissionDecision, 'allow');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
