import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';

let authTemplate: Template;

function apiTemplate(): Template {
  const app = new cdk.App();
  const data = new DataStack(app, 'TestData');
  const auth = new AuthStack(app, 'TestAuth');
  const api = new ApiStack(app, 'TestApi', {
    userPool: auth.userPool,
    usersTable: data.usersTable,
    classAuditTable: data.classAuditTable,
    invitationsTable: data.invitationsTable,
    schoolClassesTable: data.schoolClassesTable,
    subjectsTable: data.subjectsTable,
    curriculumsTable: data.curriculumsTable,
    studentProgressesTable: data.studentProgressesTable,
    dailyConditionsTable: data.dailyConditionsTable,
    studyPlansTable: data.studyPlansTable,
    studyTasksTable: data.studyTasksTable,
    studyRecordsTable: data.studyRecordsTable,
    messagesTable: data.messagesTable,
  });
  authTemplate = Template.fromStack(auth);
  return Template.fromStack(api);
}

let template: Template;
beforeAll(() => { template = apiTemplate(); });

test('gateway errors have CORS and JSON envelopes without overriding HTTP status codes', () => {
  template.resourceCountIs('AWS::ApiGateway::GatewayResponse', 2);
  for (const type of ['DEFAULT_4XX', 'DEFAULT_5XX']) {
    template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
      ResponseType: type,
      StatusCode: Match.absent(),
      ResponseParameters: {
        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,POST,PUT,OPTIONS'",
      },
    });
  }
  for (const response of Object.values(template.findResources('AWS::ApiGateway::GatewayResponse'))) {
    const body = JSON.parse(response.Properties.ResponseTemplates['application/json']);
    expect(body.success).toBe(false);
    expect(typeof body.error.code).toBe('string');
    expect(typeof body.error.message).toBe('string');
  }
});

test('every application method still requires Cognito authorization', () => {
  const methods = Object.values(template.findResources('AWS::ApiGateway::Method'));
  const authenticated = methods.filter(method => method.Properties.HttpMethod !== 'OPTIONS');
  expect(authenticated.length).toBeGreaterThan(0);
  for (const method of authenticated) {
    expect(method.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
    expect(method.Properties.AuthorizerId).toBeDefined();
  }
});


test('only the invitation sender can administer users in the configured pool', () => {
  const functions = template.findResources('AWS::Lambda::Function');
  const sender = Object.entries(functions).find(([, item]) => item.Properties.Handler === 'src.handlers.teacher.post_invitation.handler');
  expect(sender).toBeDefined();
  expect(sender![1].Properties.Environment.Variables.COGNITO_USER_POOL_ID).toBeDefined();
  const policies = template.findResources('AWS::IAM::Policy');
  const statements = Object.values(policies).flatMap(item => item.Properties.PolicyDocument.Statement);
  const administrative = statements.filter(item => JSON.stringify(item.Action).includes('cognito-idp:Admin'));
  expect(administrative).toHaveLength(1);
  expect(administrative[0].Action).toEqual(expect.arrayContaining(['cognito-idp:AdminGetUser', 'cognito-idp:AdminCreateUser', 'cognito-idp:AdminAddUserToGroup']));
  expect(administrative[0].Resource).not.toEqual('*');
  expect(administrative[0].Action).not.toContain('cognito-idp:AdminSetUserPassword');
});


test('email-only registration stays enabled with an immutable invitation marker', () => {
  authTemplate.hasResourceProperties('AWS::Cognito::UserPool', {
    UsernameAttributes: ['email'],
    AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
    Schema: Match.arrayWith([{ Name: 'invitation_id', AttributeDataType: 'String', Mutable: false }]),
  });
});

test('administrator handlers have no Cognito administration and cannot delete users or audit records', () => {
  authTemplate.hasResourceProperties('AWS::Cognito::UserPoolGroup', { GroupName: 'ADMIN' });
  const functions = Object.entries(template.findResources('AWS::Lambda::Function')).filter(([id]) => id.includes('Admin'));
  expect(functions).toHaveLength(4);
  const policies = Object.entries(template.findResources('AWS::IAM::Policy')).filter(([id]) => id.includes('Admin'));
  for (const [, policy] of policies) {
    const actions = policy.Properties.PolicyDocument.Statement.flatMap((s: {Action: string | string[]}) => typeof s.Action === 'string' ? [s.Action] : s.Action);
    expect(actions.some((a: string) => a.startsWith('cognito-idp:'))).toBe(false);
    expect(actions).not.toContain('dynamodb:DeleteItem');
    expect(actions).not.toContain('dynamodb:BatchWriteItem');
  }
});
