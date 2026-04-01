const { formatGraphQLErrors, formatUserErrors, isTransientStatus } = require("./errors");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAdminClient({ shopDomain, accessToken, apiVersion, dryRun }) {
  const endpoint = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;

  async function graphql(query, variables = {}, options = {}) {
    const { label = "GraphQL request", retries = 2 } = options;

    if (dryRun && options.dryRunResult) {
      console.log(`[dry-run] ${label}`);
      return options.dryRunResult;
    }

    let attempt = 0;
    while (attempt <= retries) {
      attempt += 1;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken
          },
          body: JSON.stringify({ query, variables })
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          if (isTransientStatus(response.status) && attempt <= retries) {
            await delay(attempt * 500);
            continue;
          }

          const details = payload ? JSON.stringify(payload, null, 2) : "No response body";
          throw new Error(`${label} failed with HTTP ${response.status}\n${details}`);
        }

        if (payload && payload.errors && payload.errors.length > 0) {
          throw new Error(`${label} returned GraphQL errors:\n${formatGraphQLErrors(payload.errors)}`);
        }

        return payload ? payload.data : null;
      } catch (error) {
        if (attempt <= retries) {
          await delay(attempt * 500);
          continue;
        }
        throw error;
      }
    }

    return null;
  }

  function assertUserErrors(userErrors, label) {
    if (userErrors && userErrors.length > 0) {
      throw new Error(`${label} returned userErrors:\n${formatUserErrors(userErrors)}`);
    }
  }

  return {
    endpoint,
    shopDomain,
    apiVersion,
    dryRun,
    graphql,
    assertUserErrors
  };
}

module.exports = {
  createAdminClient
};
