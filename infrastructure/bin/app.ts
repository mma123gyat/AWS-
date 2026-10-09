#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const dataStack = new DataStack(app, 'StudyPlatformDataStack', { env });
const authStack = new AuthStack(app, 'StudyPlatformAuthStack', { env });

new ApiStack(app, 'StudyPlatformApiStack', {
  env,
  userPool: authStack.userPool,
  usersTable: dataStack.usersTable,
  schoolClassesTable: dataStack.schoolClassesTable,
  subjectsTable: dataStack.subjectsTable,
  curriculumsTable: dataStack.curriculumsTable,
  studentProgressesTable: dataStack.studentProgressesTable,
  dailyConditionsTable: dataStack.dailyConditionsTable,
  studyPlansTable: dataStack.studyPlansTable,
  studyTasksTable: dataStack.studyTasksTable,
  studyRecordsTable: dataStack.studyRecordsTable,
  messagesTable: dataStack.messagesTable,
});

new FrontendStack(app, 'StudyPlatformFrontendStack', { env });
