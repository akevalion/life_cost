from flask import Blueprint, jsonify, request
from flask_login import login_required
from ..models import Wallet, User
from ..extensions import db

wallets_bp = Blueprint("wallets", __name__)

@wallets_bp.route("/wallet/<int:id>", methods=["GET"])
@login_required
def get_wallet(id):
    wallet = Wallet.query.get_or_404(id)
    return jsonify({
        "id": wallet.id,
        "name": wallet.name,
        "description": wallet.description
    })

@wallets_bp.route("/add_wallet", methods=["POST"])
@login_required
def add_wallet():
    data = request.get_json()
    wallet = Wallet(
        name=data["name"],
        description=data.get("description")
    )
    db.session.add(wallet)
    db.session.commit()

    users = User.query.all()
    for user in users:
        user.wallets.append(wallet)

    db.session.commit()
    return jsonify({"message": "Wallet added"}), 200
