import { getToken } from './auth.js';

const GQL_URL = 'https://zone01normandie.org/api/graphql-engine/v1/graphql';

export async function query(gql, variables = {}) {
  const token = getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query: gql, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

/* ── Queries ─────────────────────────────────────────────────── */

export const Q_USER = `
  {
    user {
      id
      login
      attrs
      createdAt
    }
  }
`;

export const Q_XP_TRANSACTIONS = `
  {
    transaction(
      where: { type: { _eq: "xp" } }
      order_by: { createdAt: asc }
    ) {
      id
      amount
      createdAt
      path
      object {
        name
        type
      }
    }
  }
`;

export const Q_XP_BY_PROJECT = `
  {
    transaction(
      where: { type: { _eq: "xp" } }
      order_by: { amount: desc }
      limit: 15
    ) {
      amount
      object {
        name
      }
    }
  }
`;

export const Q_AUDIT_RATIO = `
  {
    user {
      totalUp
      totalDown
      auditRatio
    }
  }
`;

export const Q_RESULTS = `
  {
    result(
      where: { path: { _nlike: "%piscine%" } }
      order_by: { createdAt: desc }
    ) {
      id
      grade
      createdAt
      object {
        name
        type
      }
    }
  }
`;

export const Q_SKILLS = `
  {
    transaction(
      where: { type: { _like: "skill_%" } }
      order_by: { amount: desc }
    ) {
      type
      amount
    }
  }
`;
