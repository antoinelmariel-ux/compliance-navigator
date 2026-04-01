#!/usr/bin/env node

/**
 * Progressive Microsoft Graph permission probe.
 *
 * Usage:
 *   GRAPH_ACCESS_TOKEN=<token> GRAPH_SITE_ID=<site-id> node scripts/graph-permission-probe.js
 *
 * Optional env vars:
 *   GRAPH_DRIVE_ID=<drive-id>
 *   GRAPH_PROBE_RECIPIENT=<email>   (required with --allow-send-mail)
 *
 * Flags:
 *   --continue-on-error   Continue all tests instead of stopping at first failure.
 *   --allow-send-mail     Executes a real /me/sendMail call (opt-in).
 */

const args = new Set(process.argv.slice(2));
const shouldContinueOnError = args.has('--continue-on-error');
const allowSendMail = args.has('--allow-send-mail');

const accessToken = process.env.GRAPH_ACCESS_TOKEN;
const siteId = process.env.GRAPH_SITE_ID;
const driveId = process.env.GRAPH_DRIVE_ID;
const probeRecipient = process.env.GRAPH_PROBE_RECIPIENT;

if (!accessToken) {
  console.error('❌ Missing GRAPH_ACCESS_TOKEN environment variable.');
  process.exit(1);
}

if (allowSendMail && !probeRecipient) {
  console.error('❌ --allow-send-mail requires GRAPH_PROBE_RECIPIENT.');
  process.exit(1);
}

const decodeJwtPayload = (token) => {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = Buffer.from(normalized, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

const graphRequest = async ({ method = 'GET', path, body }) => {
  let response;
  try {
    response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    return {
      ok: false,
      status: -1,
      data: {
        error: {
          code: error?.cause?.code || error?.code || 'NETWORK_ERROR',
          message: error?.message || 'Network request failed'
        }
      }
    };
  }

  const text = await response.text();
  let parsed;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (error) {
    parsed = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed
  };
};

const tests = [
  {
    id: 'user-profile',
    label: 'Read current user profile (/me)',
    expectedPermission: 'User.Read',
    run: () => graphRequest({ path: '/me?$select=id,displayName,userPrincipalName' })
  },
  {
    id: 'sites-root',
    label: 'List followed sites (/me/followedSites)',
    expectedPermission: 'Sites.Read.All or equivalent delegated access',
    run: () => graphRequest({ path: '/me/followedSites?$top=1' })
  },
  {
    id: 'site-read',
    label: 'Read configured SharePoint site metadata',
    expectedPermission: 'Sites.Read.All / Sites.ReadWrite.All',
    run: () => {
      if (!siteId) {
        return Promise.resolve({
          ok: false,
          status: 0,
          data: { error: { message: 'GRAPH_SITE_ID missing (test skipped).' } }
        });
      }
      return graphRequest({ path: `/sites/${encodeURIComponent(siteId)}?$select=id,displayName,webUrl` });
    }
  },
  {
    id: 'site-lists',
    label: 'List SharePoint lists on configured site',
    expectedPermission: 'Sites.Read.All / Sites.ReadWrite.All',
    run: () => {
      if (!siteId) {
        return Promise.resolve({
          ok: false,
          status: 0,
          data: { error: { message: 'GRAPH_SITE_ID missing (test skipped).' } }
        });
      }
      return graphRequest({ path: `/sites/${encodeURIComponent(siteId)}/lists?$top=1` });
    }
  },
  {
    id: 'drive-read',
    label: 'Read one drive item from configured drive',
    expectedPermission: 'Files.Read.All / Files.ReadWrite.All (or site-scoped equivalent)',
    run: () => {
      if (!siteId || !driveId) {
        return Promise.resolve({
          ok: false,
          status: 0,
          data: { error: { message: 'GRAPH_SITE_ID or GRAPH_DRIVE_ID missing (test skipped).' } }
        });
      }
      return graphRequest({
        path: `/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}/root/children?$top=1`
      });
    }
  },
  {
    id: 'mail-send',
    label: 'Send a probe email from current user (/me/sendMail)',
    expectedPermission: 'Mail.Send',
    run: () => {
      if (!allowSendMail) {
        return Promise.resolve({
          ok: false,
          status: 0,
          data: { error: { message: 'Test disabled. Re-run with --allow-send-mail.' } }
        });
      }

      return graphRequest({
        method: 'POST',
        path: '/me/sendMail',
        body: {
          message: {
            subject: '[Graph Probe] Mail.Send validation',
            body: {
              contentType: 'Text',
              content: 'This message was sent by scripts/graph-permission-probe.js'
            },
            toRecipients: [
              {
                emailAddress: {
                  address: probeRecipient
                }
              }
            ]
          },
          saveToSentItems: false
        }
      });
    }
  }
];

const formatError = (data) => {
  const code = data?.error?.code;
  const message = data?.error?.message;
  if (code || message) {
    return `${code || 'Error'}: ${message || 'Unknown error'}`;
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};

const run = async () => {
  console.log('🔎 Starting Graph permission probe...');
  console.log(`ℹ️ Continue on error: ${shouldContinueOnError ? 'yes' : 'no (stop at first failure)'}`);
  console.log(`ℹ️ Mail send test: ${allowSendMail ? 'enabled' : 'disabled'}`);

  const tokenPayload = decodeJwtPayload(accessToken);
  if (tokenPayload) {
    const scopes = typeof tokenPayload.scp === 'string' ? tokenPayload.scp : '(none)';
    const roles = Array.isArray(tokenPayload.roles) ? tokenPayload.roles.join(', ') : '(none)';
    console.log(`ℹ️ Token scopes (scp): ${scopes}`);
    console.log(`ℹ️ Token app roles: ${roles}`);
  } else {
    console.log('⚠️ Unable to decode token payload (scp/roles not displayed).');
  }

  const results = [];
  const total = tests.length;

  for (const [index, test] of tests.entries()) {
    const stepNumber = index + 1;
    const startedAt = Date.now();
    console.log(`\n[${stepNumber}/${total}] ${test.label}`);
    console.log(`   Expected permission: ${test.expectedPermission}`);

    const result = await test.run();
    const durationMs = Date.now() - startedAt;

    if (result.ok) {
      console.log(`   ✅ PASS (${result.status}) in ${durationMs}ms`);
      results.push({
        step: stepNumber,
        id: test.id,
        status: 'PASS',
        httpStatus: result.status,
        durationMs
      });
      continue;
    }

    const errorText = formatError(result.data);
    const statusLabel = result.status === 0 ? 'SKIPPED' : `FAIL (${result.status})`;
    console.log(`   ❌ ${statusLabel} in ${durationMs}ms`);
    console.log(`   ↳ ${errorText}`);
    results.push({
      step: stepNumber,
      id: test.id,
      status: result.status === 0 ? 'SKIPPED' : 'FAIL',
      httpStatus: result.status,
      durationMs,
      error: errorText
    });

    const isBlockingError =
      result.status === 401 || result.status === 403 || result.status === 0 || result.status === -1;
    if (isBlockingError && !shouldContinueOnError) {
      console.log('\n🛑 Probe stopped at first blocking permission/error.');
      console.log('\n📋 Summary');
      results.forEach((entry) => {
        console.log(
          `   - [${entry.step}/${total}] ${entry.id}: ${entry.status} (status=${entry.httpStatus}, ${entry.durationMs}ms)`
        );
      });
      process.exit(2);
    }
  }

  console.log('\n📋 Summary');
  results.forEach((entry) => {
    console.log(
      `   - [${entry.step}/${total}] ${entry.id}: ${entry.status} (status=${entry.httpStatus}, ${entry.durationMs}ms)`
    );
  });
  console.log('\n✅ Probe finished.');
};

run().catch((error) => {
  console.error('❌ Unexpected error while running probe:', error);
  process.exit(1);
});
