#!/usr/bin/env node

/**
 * cryptofc - Truffle Test Generator
 */

const fs = require('fs')

const getConstructor = (contract) => {
  for (let i = 0; i < contract.abi.length; i++) {
    if (contract.abi[i].type == 'constructor') {
      return contract.abi[i]
    }
  }
}

const genConstructorParams = (constructor) => {
  let lines = []
  if (constructor != undefined) {
    for (let i = 0; i < constructor.inputs.length; i++) {
      lines.push(constructor.inputs[i].name)
    }
  }
  return lines
}

const genConstructorLine = (constructor) => {
  let line = ''
  if (constructor != undefined) {
    for (let i = 0; i < constructor.inputs.length; i++) {
      line += constructor.inputs[i].name + ', '
    }
  }
  line += '{ from: maintainer }'
  return `${line};`
}

const genTestContent = (contract, constructorParams, constructorLine) => {
  let testContent = `
/**
 * This file was created by truffle-test-generator.
 * For every test, a new contract will be created in the
 * top beforeEach block. This line uses the arguments for
 * your contract's constructor with the same variable names.
 * Each public, non-constant (view) method has a describe
 * block generated for it.
 */
const ${contract.contractName} = artifacts.require('${contract.contractName}')

contract('${contract.contractName}', (accounts) => {
  const maintainer = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const stranger = accounts[3];

  let ${contract.contractName.toLowerCase()}`;

  if (constructorParams.length > 0) {
    testContent += `

  // Be sure to update these constructor values`
    for (let i = 0; i < constructorParams.length; i++) {
      testContent += `
  let ${constructorParams[i]} = 0;`
    }
  }

  testContent += `

  beforeEach(async () => {
    ${contract.contractName.toLowerCase()} = await ${contract.contractName}.new(${constructorLine});
  });
`

  for (let i = 0; i < contract.abi.length; i++) {
    if (contract.abi[i].type == 'function') {
      testContent += `
  describe('${contract.abi[i].name}', () => {

  });
`
    }
  }

  testContent +=
`});
`
  return testContent
}

const cwd = process.cwd()
const packageJsonFile = JSON.parse(fs.readFileSync(cwd + '/package.json', 'utf8'))
const { truffleTestGenerator } = packageJsonFile
const configContractsPath = (truffleTestGenerator && truffleTestGenerator.contractsPath) || "build/contracts"
const configTestsPath = (truffleTestGenerator && truffleTestGenerator.testsPath) || "test"
const jsonFilePath = cwd + `/${configContractsPath}/${process.argv[2]}.json`

let testFilePath = cwd + `/${configTestsPath}/${process.argv[2]}_test.js`
let contractFile

try {
  contractFile = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))
} catch (err) {
  console.error('Please provide a contract name and be in the top-level directory of your Truffle project\n', err)
  return err
}

const constructor = getConstructor(contractFile)
const constructorParams = genConstructorParams(constructor)
const constructorLine = genConstructorLine(constructor)
const testContent = genTestContent(contractFile, constructorParams, constructorLine)

if (fs.existsSync(testFilePath)) {
  testFilePath = testFilePath.replace('.js', '-new.js')
}

fs.writeFile(testFilePath, testContent, (error) => {
  if (error) return console.error(error)
})

console.log('Wrote to:', testFilePath)