<div align="center">
  <img src="docs/appIcon.svg" width="100px" alt="GitHub Readme Stats Logo" />
  <h1>GitHub Readme Stats</h1>
  <p>Dynamically generate GitHub stats for your READMEs.</p>
<a href="https://github-readme-stats.zcy.dev/api?username=anuraghazra"><img src="https://github-readme-stats.zcy.dev/api?username=anuraghazra"></a>
</div>

This is a [Cloudflare Workers](https://workers.cloudflare.com/) deployment of [GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended), the [actively maintained successor](docs/fork.md) to [github-readme-stats](https://github.com/anuraghazra/github-readme-stats). Card rendering comes from upstream's `@stats-organization/github-readme-stats-core` package, so output matches the upstream instance; this repository adds the Workers runtime.

## Table of Contents

- [Quick Start](#quick-start)
- [Migration](#migration)
- [Card Types](#card-types)
- [Advanced Customization](#advanced-customization)
- [Run It Yourself](#run-it-yourself)
- [Acknowledgements](#acknowledgements)

## Quick Start

- Copy and paste this into your markdown:
  ```markdown
  [![GitHub stats](https://github-readme-stats.zcy.dev/api?username=anuraghazra)](https://github.com/harryzcy/github-readme-stats)
  ```
- Change the `?username=` value to your GitHub username.
- Done!

## Migration

To migrate from [github-readme-stats](https://github.com/anuraghazra/github-readme-stats), change the domain from `github-readme-stats.vercel.app` to `github-readme-stats.zcy.dev`:

```diff
- https://github-readme-stats.vercel.app/api?username=octocat&theme=radical
+ https://github-readme-stats.zcy.dev/api?username=octocat&theme=radical
```

Parameters are compatible with upstream. See [Compatibility Notes](docs/fork.md#compatibility-notes).

## Card Types

- Show your GitHub statistics:

  ![GitHub stats](https://github-readme-stats.zcy.dev/api?username=anuraghazra)

- ...your top languages...:

  ![Top Langs](https://github-readme-stats.zcy.dev/api/top-langs?username=anuraghazra&langs_count=4)

- ...and development time:

  [![WakaTime stats](https://github-readme-stats.zcy.dev/api/wakatime?username=alan&langs_count=6)](https://wakatime.com/@alan)

- Pin more than 6 repos in your GitHub profile:

  [![Readme Card](https://github-readme-stats.zcy.dev/api/pin?username=anuraghazra&repo=github-readme-stats)](https://github.com/anuraghazra/github-readme-stats)

- Pin Gists in your GitHub profile:

  [![Gist Card](https://github-readme-stats.zcy.dev/api/gist?id=bbfce31e0217a3689c8d961a356cb10d)](https://gist.github.com/Yizack/bbfce31e0217a3689c8d961a356cb10d)

- Customize all the cards:

  [![GitHub stats](https://github-readme-stats.zcy.dev/api?username=anuraghazra&show_icons=true&theme=calm&rank_icon=github&include_all_commits=true&custom_title=Anurag's+Stats&disable_animations=true&number_format=long&show=prs_merged_percentage,prs_reviewed)](https://github-readme-stats.zcy.dev/api?username=anuraghazra&show_icons=true&theme=calm&rank_icon=github&include_all_commits=true&custom_title=Anurag's+Stats&disable_animations=true&number_format=long&show=prs_merged_percentage,prs_reviewed)

## Advanced Customization

See the [advanced documentation](docs/advanced_documentation.md) for the full parameter reference. Its examples use the upstream instance's domain; substitute `github-readme-stats.zcy.dev` to run them here.

To build a card visually, the [GitHub-Stats-Extended Wizard](https://github-stats-extended.vercel.app/frontend) generates markdown you can point at either instance.

## Run It Yourself

This instance runs on Cloudflare Workers:

```bash
npm install
npx wrangler deploy
```

`PAT_1`…`PAT_n` GitHub tokens are read from the Worker's environment; see [`wrangler.toml`](wrangler.toml) for the other variables.

For upstream's own deployment options — the [GitHub Actions workflow](https://github.com/stats-organization/github-readme-stats-action) or self-hosting on Vercel — see [Run It Yourself](docs/deploy.md).

## Acknowledgements

This project is a fork of [github-stats-extended](https://github.com/stats-organization/github-stats-extended), which is itself based on [github-readme-stats](https://github.com/anuraghazra/github-readme-stats). Its frontend is based on [GitHub Trends](https://github.com/avgupta456/github-trends). Big thanks to [@anuraghazra](https://github.com/anuraghazra), [@martin-mfg](https://github.com/martin-mfg), [@avgupta456](https://github.com/avgupta456), [@rickstaa](https://github.com/rickstaa), [@qwerty541](https://github.com/qwerty541) and everyone else who worked on these projects! ❤️
