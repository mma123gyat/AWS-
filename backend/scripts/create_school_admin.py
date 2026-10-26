"""One-time, AWS-operator-only bootstrap for a NEW school administrator email.
Default: read-only preview. Add --create to provision and send an invitation.
Never run against an existing teacher/student account; no promotion is performed.
"""
import argparse
import re
import uuid
from datetime import UTC, datetime
import boto3
from botocore.exceptions import ClientError


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--email', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--create', action='store_true')
    args = parser.parse_args()
    email, name = args.email.strip().lower(), args.name.strip()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email) or len(email) > 254 or not name or len(name) > 100:
        raise SystemExit('Email or name is invalid.')
    session = boto3.Session(profile_name='school', region_name='ap-northeast-1')
    if session.client('sts').get_caller_identity()['Account'] != '836533914233':
        raise SystemExit('Wrong AWS account. Nothing changed.')
    outputs = session.client('cloudformation').describe_stacks(StackName='StudyPlatformAuthStack')['Stacks'][0]['Outputs']
    pool = next(o['OutputValue'] for o in outputs if o['OutputKey'] == 'UserPoolId')
    client = session.client('cognito-idp')
    try:
        client.admin_get_user(UserPoolId=pool, Username=email)
    except ClientError as exc:
        if exc.response['Error']['Code'] != 'UserNotFoundException':
            raise
    else:
        raise SystemExit('This email already exists. Existing accounts are never promoted or modified.')
    print(f'NEW school-wide administrator: {name} <{email}>')
    if not args.create:
        print('PREVIEW ONLY. Add --create to create this administrator and send a temporary-password email.')
        return
    user_id = str(uuid.uuid4())
    client.admin_create_user(UserPoolId=pool, Username=email, MessageAction='SUPPRESS', UserAttributes=[
        {'Name': 'email', 'Value': email}, {'Name': 'email_verified', 'Value': 'true'},
        {'Name': 'name', 'Value': name}, {'Name': 'custom:invitation_id', 'Value': user_id}])
    user = client.admin_get_user(UserPoolId=pool, Username=email)
    sub = next(a['Value'] for a in user['UserAttributes'] if a['Name'] == 'sub')
    client.admin_add_user_to_group(UserPoolId=pool, Username=email, GroupName='ADMIN')
    now = datetime.now(UTC).isoformat()
    session.resource('dynamodb').Table('Users').put_item(Item={
        'user_id': user_id, 'cognito_sub': sub, 'email': email, 'name': name, 'role': 'ADMIN',
        'created_at': now, 'updated_at': now}, ConditionExpression='attribute_not_exists(user_id)')
    client.admin_create_user(UserPoolId=pool, Username=email, MessageAction='RESEND', DesiredDeliveryMediums=['EMAIL'])
    print('Administrator created. Check your email, sign in, and set your own password. No passwords are printed.')


if __name__ == '__main__':
    main()
