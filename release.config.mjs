/**
 * Tags-only release: git tag `vX.Y.Z` + GitHub Release with notes. The plugins
 * array is explicit so @semantic-release/npm (publish) and
 * @semantic-release/git (commit-back) stay out.
 */
const preset = 'conventionalcommits';

/**
 * No messages: without this it comments and labels every PR/issue in the
 * release and opens an issue when a release fails.
 */
const github = [
  '@semantic-release/github',
  { successCommentCondition: false, failCommentCondition: false },
];

export default {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      { preset, releaseRules: [{ type: 'revert', release: 'patch' }] },
    ],
    ['@semantic-release/release-notes-generator', { preset }],
    github,
  ],
};
