import requests
import sys
import getopt
import json
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

#send slack messages

def send_slack_message(message):
    try:
        # Получаем URL вебхука из переменных окружения или используем дефолтный
        webhook_url = os.getenv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/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')
        
        print(f"Using webhook URL: {webhook_url}")
        print(f"Message length: {len(message)}")
        print(f"Message preview: {message[:200]}...")  # Показываем первые 200 символов
        
        # Очищаем сообщение от специальных символов
        message = message.replace('\n', ' ').replace('\r', ' ').strip()
        
        payload = json.dumps({"text": message})
        print(f"Sending payload: {payload}")
        
        response = requests.post(
            webhook_url,
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status code: {response.status_code}")
        print(f"Response text: {response.text}")
        
        response.raise_for_status()
        
        result = {
            "status": "success",
            "message": "Message sent successfully",
            "slack_response": response.text
        }
        print(json.dumps(result))
        return result
        
    except requests.exceptions.RequestException as e:
        error_result = {
            "status": "error",
            "message": f"Failed to send message to Slack: {str(e)}",
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

def main(argv):
    message = " "
    
    try:
        opts, args = getopt.getopt(argv, "hm:", ["message="])
    except getopt.GetoptError:
        print(json.dumps({
            "status": "error",
            "message": "Invalid arguments",
            "usage": "slack_send.py -m <message>"
        }))
        sys.exit(2)
    
    if len(opts) == 0:
        message = "Oops.. seems like something wrong"
    
    for opt, arg in opts:
        if opt == "-h":
            print(json.dumps({
                "status": "info",
                "message": "Usage information",
                "usage": "slack_send.py -m <message>"
            }))
            sys.exit()
        elif opt in ("-m", "--message"):
            message = arg
    
    send_slack_message(message)

if __name__ == "__main__":
    main(sys.argv[1:])
