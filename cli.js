#!/usr/bin/env node
'use strict'

const { checkbox } = require('@inquirer/prompts')
const git = require('simple-git')()

// if arg --v or --version is passed, print the version
if (process.argv.includes("--v") || process.argv.includes("--version")) {
  const { version } = require("./package.json");
  console.log(version);
  process.exit(0);
}

function validate(summary) {
  const { all, current } = summary

  return !all || all === 0
    ? Promise.reject('[delete-branches] No branches found')
    : { branches: all, current }
}

function parse(summary) {
  const { branches, current } = summary
  const protectedBranches = ['master', 'main', current]

  const filteredBranches = branches.filter(
    (branch) => !protectedBranches.includes(branch)
  )

  return filteredBranches.length < 1
    ? Promise.reject(
        '[delete-branches] You have no branches to delete except main/master and current branch'
      )
    : filteredBranches
}

function format(branches) {
  return branches.reduce((list, name) => [...list, { value: name }], [])
}

function ask(choices) {
  return checkbox({
    message: '[delete-branches] Select the branches you want to delete:',
    choices,
  })
}

async function remove(branches) {
  if (!branches || !branches.length) {
    return console.log('[delete-branches] No branches deleted')
  }

  const failedBranches = []
  for (const branch of branches) {
    try {
      await removeBranch(branch)
    } catch (err) {
      failedBranches.push(branch)
    }
  }

  if (!failedBranches.length) {
    return console.log('[delete-branches] All branches deleted')
  }

  console.log('[delete-branches] Some branches could not be deleted')

  askForForceDelete(failedBranches).then(forceDeleteBranches)
}

function removeBranch(branch) {
  return git.deleteLocalBranch(branch).then(() => {
    console.log(`[delete-branches] ${branch} deleted`)
  })
}

function askForForceDelete(failedBranches) {
  return checkbox({
    message: '[delete-branches] Select the branches you want to force-delete:',
    choices: failedBranches.map((branch) => ({ value: branch })),
  })
}

function forceDeleteBranches(branches) {
  if (!branches || !branches.length) {
    return console.log('[delete-branches] No branches force-deleted')
  }
  branches.forEach(forceDeleteBranch)
}

function forceDeleteBranch(branch) {
  git
    .deleteLocalBranch(branch, true)
    .then(() => {
      console.log(`[delete-branches] ${branch} force-deleted`)
    })
    .catch((err) => {
      console.error(
        `[delete-branches] ${branch} could not be force-deleted: ${err}`
      )
    })
}

git
  .branchLocal()
  .then(validate)
  .then(parse)
  .then(format)
  .then(ask)
  .then(remove)
  .catch(console.log)
