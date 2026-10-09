import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * DynamoDB tables. One table per entity (no single-table design) for readability.
 * RemovalPolicy.DESTROY is intentional for this dev-stage project so `cdk destroy`
 * leaves no orphaned billable resources; revisit before a real production launch.
 */
export class DataStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly schoolClassesTable: dynamodb.Table;
  public readonly subjectsTable: dynamodb.Table;
  public readonly curriculumsTable: dynamodb.Table;
  public readonly studentProgressesTable: dynamodb.Table;
  public readonly dailyConditionsTable: dynamodb.Table;
  public readonly studyPlansTable: dynamodb.Table;
  public readonly studyTasksTable: dynamodb.Table;
  public readonly studyRecordsTable: dynamodb.Table;
  public readonly messagesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const removalPolicy = cdk.RemovalPolicy.DESTROY;
    const billingMode = dynamodb.BillingMode.PAY_PER_REQUEST;

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'cognito_sub-index',
      partitionKey: { name: 'cognito_sub', type: dynamodb.AttributeType.STRING },
    });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'class_id-index',
      partitionKey: { name: 'class_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'role', type: dynamodb.AttributeType.STRING },
    });

    this.schoolClassesTable = new dynamodb.Table(this, 'SchoolClassesTable', {
      tableName: 'SchoolClasses',
      partitionKey: { name: 'class_id', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.subjectsTable = new dynamodb.Table(this, 'SubjectsTable', {
      tableName: 'Subjects',
      partitionKey: { name: 'subject_id', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.curriculumsTable = new dynamodb.Table(this, 'CurriculumsTable', {
      tableName: 'Curriculums',
      partitionKey: { name: 'class_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'subject_id', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.studentProgressesTable = new dynamodb.Table(this, 'StudentProgressesTable', {
      tableName: 'StudentProgresses',
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'subject_id', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.dailyConditionsTable = new dynamodb.Table(this, 'DailyConditionsTable', {
      tableName: 'DailyConditions',
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.studyPlansTable = new dynamodb.Table(this, 'StudyPlansTable', {
      tableName: 'StudyPlans',
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'plan_date', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.studyTasksTable = new dynamodb.Table(this, 'StudyTasksTable', {
      tableName: 'StudyTasks',
      partitionKey: { name: 'plan_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'task_order', type: dynamodb.AttributeType.NUMBER },
      billingMode,
      removalPolicy,
    });

    this.studyRecordsTable = new dynamodb.Table(this, 'StudyRecordsTable', {
      tableName: 'StudyRecords',
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sort_key', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });

    this.messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'Messages',
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sort_key', type: dynamodb.AttributeType.STRING },
      billingMode,
      removalPolicy,
    });
  }
}
