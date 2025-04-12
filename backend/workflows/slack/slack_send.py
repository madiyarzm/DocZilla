import requests
import sys
import getopt

#send slack messages

def send_slack_message(message):
    payload = '{"text":"%s"}' % message
    response = requests.post('https://hooks.slack.com/services/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',
                             data = payload)
    
    print(response.text)
    

def main(argv):
    message = " "
    
    try: opts, args = getopt.getopt(argv, "hm:" , ["message="])
    
    except getopt.GetoptError:
        print("slack_send.py -m <message>")
        sys.exit(2)
    
    if len(opts) == 0:
        message = "Oops.. seems like something wrong"
    
    for opt, arg in opts:
        if opt == "-h":
            print("slack_send.py -m <message>")
            sys.exit()
        elif opt in ("-m", "--message"):
            message = arg
    
    send_slack_message(message)

if __name__ == "__main__":
    main(sys.argv[1:])
