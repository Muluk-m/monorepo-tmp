# monorepo template

> 该项目是 Monorepo 的模板库, 用于 monorepo 工程参考

---

## Introduction

项目使用 pnpm workspaces + changeset 管理, 使用 pnpm 进行依赖管理，[changeset](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) 来管理版本

## Install

```bash
npm i -g pnpm@6
pnpm install
```

## Build

全量构建

```bash
pnpm build
```

指定目录（独立构建）

```bash
pnpm build <package-dirname, ...>
```

## Version Management Workflow

```bash
# 1. Adding changesets
pnpm changeset

# 2. Versioning and publishing
pnpm changeset version
```
