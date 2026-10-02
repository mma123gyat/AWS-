import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * Cognito User Pool. Role authorization is driven by Cognito Groups
 * (STUDENT / TEACHER), surfaced to API Gateway/Lambda via the
 * `cognito:groups` claim in the verified JWT — no custom attribute needed.
 *
 * MVP has no self-signup UI: accounts are created by an admin via the seed
 * script (scripts/seed_users.py), matching the plan's decision to defer
 * self-registration to a later phase.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'StudyPlatformUserPool',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('WebClient', {
      authFlows: {
        userSrp: true,
        adminUserPassword: true,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(7),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'STUDENT',
    });

    new cognito.CfnUserPoolGroup(this, 'TeacherGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'TEACHER',
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}
