from fastapi import Request
import logging

# Add this to main.py to see what the backend is receiving

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path == "/token":
        print("=" * 50)
        print("LOGIN REQUEST RECEIVED")
        print(f"Method: {request.method}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Content-Type: {request.headers.get('content-type')}")
        
        # Read body
        body = await request.body()
        print(f"Body (raw): {body}")
        print(f"Body (decoded): {body.decode('utf-8')}")
        print("=" * 50)
        
        # Important: recreate the request with the body
        from starlette.requests import Request as StarletteRequest
        
        async def receive():
            return {"type": "http.request", "body": body}
        
        request = StarletteRequest(request.scope, receive)
    
    response = await call_next(request)
    return response
