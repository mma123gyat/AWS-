import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';

function apiTemplate(): Template {
  const app = new cdk.App();
  const data = new DataStack(app, 'TestData');
  const auth = new AuthStack(app, 'TestAuth');
  const api = new ApiStack(app, 'TestApi', {
    userPool: auth.userPool,
    usersTable: data.usersTable,
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
