from .wallets import wallets_bp
from .money import money_bp
from .auth import auth_bp
from .views import views_bp

def register_routes(app):
    app.register_blueprint(wallets_bp)
    app.register_blueprint(money_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(views_bp)
