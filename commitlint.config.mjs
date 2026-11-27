/** Conventional commits, the input semantic-release reads to pick the bump. */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    // Subjects here often start with a product name ("Vercel OIDC role ...").
    'subject-case': [0],
  },
};
