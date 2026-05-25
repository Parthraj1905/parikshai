import subprocess
import sys

def install_and_test():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "razorpay"])
    import razorpay
    client = razorpay.Client(auth=("rzp_test_1", "secret"))
    # Let's check what the verify_subscription_payment_signature does
    import inspect
    print(inspect.getsource(client.utility.verify_subscription_payment_signature))

install_and_test()
