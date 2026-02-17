from app import create_app
#https://console.cloud.google.com/apis/credentials?project=life-436717
app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
