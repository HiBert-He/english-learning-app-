const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const commitSha = process.env.GITHUB_SHA;
const alias = process.env.VERCEL_ALIAS;

async function findReadyDeployment() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&target=production&limit=10&teamId=${teamId}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Vercel API error (${res.status}): ${JSON.stringify(data)}`);
    }
    console.log(
      `[attempt ${attempt + 1}] deployments for commit:`,
      data.deployments?.map((d) => `${d.meta?.githubCommitSha?.slice(0, 7)}:${d.readyState}`).join(', ')
    );
    const match = data.deployments?.find(
      (d) => d.meta?.githubCommitSha === commitSha && d.readyState === 'READY'
    );
    if (match) return match;
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error(`No READY deployment found for commit ${commitSha} after 5 minutes`);
}

const deployment = await findReadyDeployment();
console.log(`Found deployment ${deployment.url} for commit ${commitSha}`);

const aliasRes = await fetch(
  `https://api.vercel.com/v2/deployments/${deployment.uid}/aliases?teamId=${teamId}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alias }),
  }
);

const aliasData = await aliasRes.json();
if (!aliasRes.ok) {
  throw new Error(`Failed to set alias: ${JSON.stringify(aliasData)}`);
}
console.log(`Aliased ${alias} -> ${deployment.url}`);
