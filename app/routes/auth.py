from flask import Blueprint, redirect, url_for
from flask_login import login_user, logout_user, login_required
from flask_dance.contrib.google import google
from ..models import User, Wallet
from ..extensions import db

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))

    resp = google.get("https://www.googleapis.com/oauth2/v1/userinfo")
    user_info = resp.json()

    user = User.query.filter_by(email=user_info["email"]).first()

    if not user:
        user = User(
            username=user_info["name"],
            email=user_info["email"],
            picture=user_info["picture"]
        )
        wallets = Wallet.query.all()
        if wallets:
            user.wallets.extend(wallets)
            user.last_visited_wallet_id = wallets[0].id
        db.session.add(user)

    db.session.commit()
    login_user(user)
    return redirect(url_for("views.index"))

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("views.index"))
