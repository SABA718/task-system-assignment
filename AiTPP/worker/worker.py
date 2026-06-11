import os
import json
import time
import redis
from pymongo import MongoClient
from bson.objectid import ObjectId

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/taskdb')
client = MongoClient(MONGO_URI)
db = client.get_database() # This will now connect correctly to 'taskdb'
tasks_collection = db['tasks']

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

# Nuke the queue to guarantee no ghost tasks
r.delete('tasks_queue') 
r.flushall() 
print("Worker started. Redis flushed. Listening for new tasks...")

# --- 3. Main Processing Loop ---
while True:
    try:
        task_data = r.brpop('tasks_queue', timeout=5) 
        if task_data:
            queue_name, payload_str = task_data
            payload = json.loads(payload_str)
            task_id = payload.get('id')
            input_text = payload.get('input', '')
            operation = payload.get('operation', '')

            print(f"\n--- NEW TASK RECEIVED: {task_id} ---")
            
            # DIAGNOSTIC CHECK: Does this task actually exist in MongoDB?
            doc = tasks_collection.find_one({'_id': ObjectId(task_id)})
            if not doc:
                print(f"❌ ERROR: Cannot find task {task_id} in MongoDB!")
                print("   Your Node app and Python worker are connected to different databases.")
                continue
            else:
                print(f"✅ SUCCESS: Found task {task_id} in DB. Current status: {doc.get('status')}")

            # Update to running
            tasks_collection.update_one(
                {'_id': ObjectId(task_id)},
                {'$set': {'status': 'running'}, '$push': {'logs': 'Worker picked up task'}}
            )

            result = ""
            try:
                if operation == 'uppercase':
                    result = input_text.upper()
                elif operation == 'lowercase':
                    result = input_text.lower()
                elif operation == 'reverse':
                    result = input_text[::-1]
                elif operation == 'wordcount':
                    result = str(len(input_text.split()))
                else:
                    raise ValueError("Unknown operation")

                # Update to success and capture the result
                update_res = tasks_collection.update_one(
                    {'_id': ObjectId(task_id)},
                    {
                        '$set': {'status': 'success', 'result': result},
                        '$push': {'logs': 'Task completed successfully'}
                    }
                )
                print(f"✅ Task {task_id} finished. Modified {update_res.modified_count} DB records.")

            except Exception as e:
                tasks_collection.update_one(
                    {'_id': ObjectId(task_id)},
                    {
                        '$set': {'status': 'failed', 'result': str(e)},
                        '$push': {'logs': f'Task failed: {str(e)}'}
                    }
                )
                print(f"❌ Task {task_id} failed: {e}")

    except redis.exceptions.TimeoutError:
        continue
    except redis.exceptions.ConnectionError:
        print("Worker Error: Redis connection lost. Retrying in 5 seconds...")
        time.sleep(5)
    except Exception as e:
        print(f"Unexpected Worker Error: {str(e)}")
        time.sleep(5)