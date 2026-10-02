import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  usersTable: dynamodb.Table;
  schoolClassesTable: dynamodb.Table;
  subjectsTable: dynamodb.Table;
  curriculumsTable: dynamodb.Table;
  studentProgressesTable: dynamodb.Table;
  dailyConditionsTable: dynamodb.Table;
  studyPlansTable: dynamodb.Table;
  studyTasksTable: dynamodb.Table;
  studyRecordsTable: dynamodb.Table;
}

const BACKEND_ASSET_PATH = path.join(__dirname, '../../backend');
const BACKEND_ASSET_EXCLUDES = [
  '.venv',
  'tests',
  '.pytest_cache',
  '**/__pycache__',
  '**/*.pyc',
  '.env',
  '.env.example',
  'requirements-dev.txt',
  'pyproject.toml',
];

// All handler code only depends on boto3, which the Lambda Python runtime
// already provides — so a plain asset copy is enough, no Docker bundling.
const BACKEND_CODE = lambda.Code.fromAsset(BACKEND_ASSET_PATH, { exclude: BACKEND_ASSET_EXCLUDES });

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const commonEnv = {
      USERS_TABLE_NAME: props.usersTable.tableName,
      SCHOOL_CLASSES_TABLE_NAME: props.schoolClassesTable.tableName,
      SUBJECTS_TABLE_NAME: props.subjectsTable.tableName,
      CURRICULUMS_TABLE_NAME: props.curriculumsTable.tableName,
      STUDENT_PROGRESSES_TABLE_NAME: props.studentProgressesTable.tableName,
      DAILY_CONDITIONS_TABLE_NAME: props.dailyConditionsTable.tableName,
      STUDY_PLANS_TABLE_NAME: props.studyPlansTable.tableName,
      STUDY_TASKS_TABLE_NAME: props.studyTasksTable.tableName,
      STUDY_RECORDS_TABLE_NAME: props.studyRecordsTable.tableName,
      BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? 'global.anthropic.claude-sonnet-5',
    };

    // Every handler resolves the caller via Users table, so grant read to all.
    const createFunction = (constructId: string, handlerPath: string): lambda.Function => {
      const fn = new lambda.Function(this, constructId, {
        functionName: `StudyPlatform-${constructId}`,
        runtime: lambda.Runtime.PYTHON_3_13,
        handler: handlerPath,
        code: BACKEND_CODE,
        environment: commonEnv,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      });
      props.usersTable.grantReadData(fn);
      return fn;
    };

    this.api = new apigateway.RestApi(this, 'StudyPlatformApi', {
      restApiName: 'StudyPlatformApi',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: { stageName: 'dev' },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const authorizedMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // /teacher
    const teacher = this.api.root.addResource('teacher');

    // /teacher/classes/{classId}/progress
    const classes = teacher.addResource('classes');
    const classItem = classes.addResource('{classId}');
    const classProgress = classItem.addResource('progress');

    const putClassProgressFn = createFunction(
      'PutClassProgressFn',
      'src.handlers.teacher.put_class_progress.handler',
    );
    props.curriculumsTable.grantReadWriteData(putClassProgressFn);
    classProgress.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(putClassProgressFn),
      authorizedMethodOptions,
    );

    const getClassProgressFn = createFunction(
      'GetClassProgressFn',
      'src.handlers.teacher.get_class_progress.handler',
    );
    props.curriculumsTable.grantReadData(getClassProgressFn);
    classProgress.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getClassProgressFn),
      authorizedMethodOptions,
    );

    // /teacher/students, /teacher/students/{studentId}
    const students = teacher.addResource('students');

    const getStudentsFn = createFunction('GetStudentsFn', 'src.handlers.teacher.get_students.handler');
    props.studyPlansTable.grantReadData(getStudentsFn);
    props.studyRecordsTable.grantReadData(getStudentsFn);
    students.addMethod('GET', new apigateway.LambdaIntegration(getStudentsFn), authorizedMethodOptions);

    const studentItem = students.addResource('{studentId}');

    const getStudentDetailFn = createFunction(
      'GetStudentDetailFn',
      'src.handlers.teacher.get_student_detail.handler',
    );
    props.studentProgressesTable.grantReadData(getStudentDetailFn);
    props.studyPlansTable.grantReadData(getStudentDetailFn);
    props.studyTasksTable.grantReadData(getStudentDetailFn);
    props.studyRecordsTable.grantReadData(getStudentDetailFn);
    studentItem.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getStudentDetailFn),
      authorizedMethodOptions,
    );

    const studentProgress = studentItem.addResource('progress');

    const putStudentProgressFn = createFunction(
      'PutStudentProgressFn',
      'src.handlers.teacher.put_student_progress.handler',
    );
    props.studentProgressesTable.grantReadWriteData(putStudentProgressFn);
    studentProgress.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(putStudentProgressFn),
      authorizedMethodOptions,
    );

    const getStudentProgressFn = createFunction(
      'GetStudentProgressFn',
      'src.handlers.teacher.get_student_progress.handler',
    );
    props.studentProgressesTable.grantReadData(getStudentProgressFn);
    studentProgress.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getStudentProgressFn),
      authorizedMethodOptions,
    );

    // /students/me/...
    const studentsMe = this.api.root.addResource('students').addResource('me');

    const getDashboardFn = createFunction('GetDashboardFn', 'src.handlers.students.get_dashboard.handler');
    props.studentProgressesTable.grantReadData(getDashboardFn);
    props.curriculumsTable.grantReadData(getDashboardFn);
    props.dailyConditionsTable.grantReadData(getDashboardFn);
    props.studyPlansTable.grantReadData(getDashboardFn);
    props.studyTasksTable.grantReadData(getDashboardFn);
    studentsMe
      .addResource('dashboard')
      .addMethod('GET', new apigateway.LambdaIntegration(getDashboardFn), authorizedMethodOptions);

    const postConditionFn = createFunction('PostConditionFn', 'src.handlers.students.post_condition.handler');
    props.dailyConditionsTable.grantReadWriteData(postConditionFn);
    studentsMe
      .addResource('condition')
      .addMethod('POST', new apigateway.LambdaIntegration(postConditionFn), authorizedMethodOptions);

    const studyPlanResource = studentsMe.addResource('study-plan');

    const postStudyPlanFn = createFunction('PostStudyPlanFn', 'src.handlers.students.post_study_plan.handler');
    props.dailyConditionsTable.grantReadData(postStudyPlanFn);
    props.studentProgressesTable.grantReadData(postStudyPlanFn);
    props.curriculumsTable.grantReadData(postStudyPlanFn);
    props.schoolClassesTable.grantReadData(postStudyPlanFn);
    props.subjectsTable.grantReadData(postStudyPlanFn);
    props.studyPlansTable.grantReadWriteData(postStudyPlanFn);
    props.studyTasksTable.grantReadWriteData(postStudyPlanFn);
    // Inference-profile models (e.g. global.anthropic.*) route across regions,
    // so the invoking role needs InvokeModel on the underlying foundation
    // models too, not just the profile ARN — a wildcard is the pragmatic MVP
    // scope here; narrow to specific model ARNs before production.
    postStudyPlanFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'],
      }),
    );
    studyPlanResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(postStudyPlanFn),
      authorizedMethodOptions,
    );

    const getStudyPlanTodayFn = createFunction(
      'GetStudyPlanTodayFn',
      'src.handlers.students.get_study_plan_today.handler',
    );
    props.dailyConditionsTable.grantReadData(getStudyPlanTodayFn);
    props.studyPlansTable.grantReadData(getStudyPlanTodayFn);
    props.studyTasksTable.grantReadData(getStudyPlanTodayFn);
    studyPlanResource
      .addResource('today')
      .addMethod('GET', new apigateway.LambdaIntegration(getStudyPlanTodayFn), authorizedMethodOptions);

    const getStudyRecordsFn = createFunction(
      'GetStudyRecordsFn',
      'src.handlers.students.get_study_records.handler',
    );
    props.studyRecordsTable.grantReadData(getStudyRecordsFn);
    studentsMe
      .addResource('study-records')
      .addMethod('GET', new apigateway.LambdaIntegration(getStudyRecordsFn), authorizedMethodOptions);

    // /study-tasks/{taskId}/complete
    const completeTaskFn = createFunction('CompleteTaskFn', 'src.handlers.students.complete_task.handler');
    props.studyTasksTable.grantReadWriteData(completeTaskFn);
    this.api.root
      .addResource('study-tasks')
      .addResource('{taskId}')
      .addResource('complete')
      .addMethod('POST', new apigateway.LambdaIntegration(completeTaskFn), authorizedMethodOptions);

    // /study-records
    const postStudyRecordFn = createFunction('PostStudyRecordFn', 'src.handlers.students.post_study_record.handler');
    props.studyTasksTable.grantReadData(postStudyRecordFn);
    props.studyRecordsTable.grantReadWriteData(postStudyRecordFn);
    this.api.root
      .addResource('study-records')
      .addMethod('POST', new apigateway.LambdaIntegration(postStudyRecordFn), authorizedMethodOptions);

    new cdk.CfnOutput(this, 'ApiUrl', { value: this.api.url });
  }
}
