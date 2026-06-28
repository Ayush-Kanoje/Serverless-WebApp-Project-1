import json
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("serverless-webapp")

def lambda_handler(event, context):

    response = table.update_item(
        Key={
            "id": "view-count"
        },
        UpdateExpression="ADD #c :inc",
        ExpressionAttributeNames={
            "#c": "count"
        },
        ExpressionAttributeValues={
            ":inc": 1
        },
        ReturnValues="UPDATED_NEW"
    )

    count = int(response["Attributes"]["count"])

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "count": count
        })
    }