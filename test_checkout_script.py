import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Intercept network requests
        page.on("response", lambda response: asyncio.create_task(handle_response(response)))
        
        async def handle_response(response):
            if "payments/create/ajax" in response.url:
                try:
                    body = await response.text()
                    print(f"URL: {response.url}")
                    print(f"Status: {response.status}")
                    print(f"Body: {body}")
                except Exception as e:
                    print(f"Failed to read response body: {e}")

        await page.goto("file:///Users/parthrajsinh/Developer/parikshai/test_checkout.html")
        await page.click("#rzp-button1")
        # Wait for the iframe to load and do something? Actually we need to interact with the Razorpay iframe.
        await asyncio.sleep(5)
        
        await browser.close()

asyncio.run(main())
