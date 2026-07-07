"""
Serverless Visitor Counter - Lambda Handler
--------------------------------------------
Triggered by API Gateway (HTTP API) at GET /visitor
Atomically increments a counter item in DynamoDB and returns the new count.

Table schema:
    id (String, partition key)  -> fixed value "visitor_count"
    count (Number)              -> running total
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ.get("TABLE_NAME", "VisitorCounterTable")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
COUNTER_ID = "visitor_count"

table = dynamodb.Table(TABLE_NAME)


def _response(status_code, body_dict):
    """Builds an API Gateway HTTP API proxy response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        },
        "body": json.dumps(body_dict),
    }


def lambda_handler(event, context):
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    # HTTP APIs auto-handle CORS preflight if configured, but this is a safe fallback.
    if http_method == "OPTIONS":
        return _response(200, {"message": "ok"})

    try:
        result = table.update_item(
            Key={"id": COUNTER_ID},
            UpdateExpression="SET #c = if_not_exists(#c, :start) + :incr",
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={":start": 0, ":incr": 1},
            ReturnValues="UPDATED_NEW",
        )
        new_count = int(result["Attributes"]["count"])
        return _response(200, {"count": new_count})

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return _response(500, {"error": "Could not update visitor count"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return _response(500, {"error": "Internal server error"})
