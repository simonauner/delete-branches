#!/usr/bin/env node
'use strict'

const { checkbox } = require('@inquirer/prompts')
const git = require('simple-git')()

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

function remove(branches) {
  if (!branches || !branches.length) {
    return console.log('[delete-branches] No branches deleted')
  }

  branches.forEach(removeBranch)
}

function removeBranch(branch) {
  git.branch(['-D', branch])
  console.log(`[delete-branches] ${branch} deleted`)
}

git
  .branchLocal()
  .then(validate)
  .then(parse)
  .then(format)
  .then(ask)
  .then(remove)
  .catch(console.log)
