from flask import Blueprint, render_template, redirect
from flask_login import current_user

views_bp = Blueprint("views", __name__)

@views_bp.route("/")
def index():
    if current_user.is_authenticated:
        return render_template(
            "index.html",
            user=current_user,
            is_authenticated=True
        )
    return redirect("/google_login")

@views_bp.route("/privacy")
def privacy():
    return render_template("privacy.html")

@views_bp.route("/terms")
def terms():
    return render_template("terms.html")
