import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * Cognito User Pool. Role authorization is driven by Cognito Groups
 * (STUDENT / TEACHER), surfaced to API Gateway/Lambda via the
 * `cognito:groups` claim in the verified JWT. The immutable invitation_id
 * attribute identifies accounts provisioned by our invitation flow.
 *
 * Self-registration remains disabled. The first teacher is seeded by an
 * administrator; authenticated teachers provision other roles through the
 * invitation API.
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
      customAttributes: {
        invitation_id: new cognito.StringAttribute({ mutable: false }),
      },
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

    new cognito.CfnUserPoolGroup(this, 'ParentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'PARENT',
    });

    new cognito.CfnUserPoolGroup(this, 'SupportGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'SUPPORT',
    });

    new cognito.CfnUserPoolGroup(this, 'AdminGroup', { userPoolId: this.userPool.userPoolId, groupName: 'ADMIN' });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}
