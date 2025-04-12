import requests
import json

def test_slack():
    webhook_url = 'https://hooks.slack.com/services/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'
    message = "Test message from test script"
    
    print(f"Using webhook URL: {webhook_url}")
    
    payload = json.dumps({"text": message})
    print(f"Sending payload: {payload}")
    
    response = requests.post(
        webhook_url,
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Response status code: {response.status_code}")
    print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_slack() 