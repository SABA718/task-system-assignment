import os
import redis
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
redis_host = os.environ.get('REDIS_HOST', 'localhost')
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')

r = redis.Redis(host=redis_host, port=6379, db=0)
client = MongoClient(mongo_uri)
db = client.taskdb
tasks_collection = db.tasks
def process_task(input_text, operation):
    if operation == 'uppercase':
        return input_text.upper()
    elif operation == 'lowercase':
        return input_text.lower()
    elif operation == 'reverse':
        return input_text[::-1]
    elif operation == 'wordcount':
        return str(len(input_text.split()))
    else:
        raise ValueError(f"Unknown operation: {operation}")
print("Worker started. Listening for tasks...")
while True:
    try:
        result = r.brpop('tasks_queue', timeout=30)
        if result is None:
            continue
        _, message = result
        task_data = json.loads(message)
        task_id = task_data['id']
        input_text = task_data['input']
        operation = task_data['operation']
        print(f"Processing Task: {task_id}")
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {
                '$set': {'status': 'running'},
                '$push': {'logs': 'Worker picked up task'}
            }
        )
        output = process_task(input_text, operation)
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {
                '$set': {
                    'status': 'success',
                    'result': output
                },
                '$push': {
                    'logs': 'Task processed successfully'
                }
            }
        )
        print(f"Task {task_id} completed successfully")
    except Exception as e:
        print("Worker Error:", str(e))
        try:
            if 'task_id' in locals():
                tasks_collection.update_one(
                    {'_id': ObjectId(task_id)},
                    {
                        '$set': {'status': 'failed'},
                        '$push': {
                            'logs': f'Error: {str(e)}'
                        }
                    }
                )
        except Exception:
            pass