/* eslint-disable @typescript-eslint/camelcase */
import * as path from 'path';

import archiver from 'archiver';
import * as fs from 'fs-extra';
import packlist from 'npm-packlist';
import sanitize from 'sanitize-filename';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { IPackageJson } from 'package-json-type';

const { GITHUB_WORKSPACE } = process.env;
const fileName = core.getInput('file-name', { required: false });
const subDir = core.getInput('source-dir', { required: false });
const sourceDir = path.resolve(GITHUB_WORKSPACE, subDir);

async function getPackageInfo(packageFile: string): Promise<IPackageJson> {
  return fs
    .readFile(packageFile, 'utf-8')
    .then(content => JSON.parse(content))
    .catch(error => {
      console.error(`Failed to read ${packageFile}`);
      return Promise.reject(error);
    });
}

const getSha = (): string => {
  const pullRequest = github.context.payload.pull_request;

  if (!pullRequest) {
    return github.context.sha;
  }

  return pullRequest.head.sha;
};

async function getZipFileName(): Promise<string> {
  const packageFile: string = path.join(sourceDir, 'package.json');
  let packageInfo;
  try {
    packageInfo = await getPackageInfo(packageFile);
  } catch (err) {
    core.setFailed(err.message ? err.message : 'Error reading package.json.');
  }
  const packageName = sanitize(packageInfo.name);
  const sha = getSha();
  return fileName.replace('PACKAGE_NAME', packageName).replace('SHA', sha);
}

async function zipFiles(filesToZip: Array<string>, zipFileName: string): Promise<void> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(zipFileName);

  return new Promise((resolve, reject) => {
    archive.on('error', function(err) {
      reject(err);
    });

    archive.pipe(stream);

    filesToZip.forEach(file => {
      const filePath = path.join(sourceDir, file);
      core.info(`Added ${filePath} as ${file} to the archive.`);
      archive.append(fs.createReadStream(filePath), { name: file }).on('error', err => reject(err));
    });

    stream.on('close', () => {
      const totalBytes = archive.pointer();
      const totalMB = totalBytes * 0.000001;
      core.info(`${totalMB}MB total.`);
      resolve();
    });
    stream.on('end', () => {
      resolve();
    });
    archive.finalize();
  });
}

async function run(): Promise<void> {
  const filesToZip = await packlist({ path: sourceDir });
  const zipFileName = await getZipFileName();
  try {
    await zipFiles(filesToZip, zipFileName);
  } catch (err) {
    core.setFailed(err.message ? err.message : `Error creating the .zip file ${zipFileName}.`);
  }
  core.info(`Successfully created the .zip file ${zipFileName}.`);
  core.setOutput('zip-path', zipFileName);
  core.setOutput('zip-path-full', path.resolve(sourceDir, zipFileName));
  process.exit(0);
}

run();
