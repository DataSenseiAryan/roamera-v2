# GitHub Actions CI (template)

The workflow file lives here because some GitHub OAuth tokens (including default `gh` login) refuse to push into `.github/workflows/` without the **`workflow`** scope.

**Enable CI on GitHub:**

1. `mkdir -p .github/workflows`
2. `cp docs/github-actions/ci.yml.template .github/workflows/ci.yml`
3. Commit and push — if push fails with a workflow permission error, run `gh auth refresh -h github.com -s workflow` and authenticate again, **or** use a Personal Access Token with the `workflow` checkbox enabled.
