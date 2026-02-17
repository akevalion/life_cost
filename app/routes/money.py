from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from ..models import MoneyTransfer
from ..extensions import db

money_bp = Blueprint("money", __name__)

@money_bp.route("/money/<int:id>", methods=["GET"])
@login_required
def get_money(id):
    money = MoneyTransfer.query.get_or_404(id)
    return jsonify({
        "id": money.id,
        "amount": money.amount,
        "description": money.description,
        "created_at": money.created_at.isoformat()
    })

@money_bp.route("/add_money", methods=["POST"])
@login_required
def add_money():
    data = request.get_json()

    money = MoneyTransfer(
        amount=data["amount"],
        description=data["description"],
        created_at=datetime.utcnow(),
        user_id=current_user.id,
        wallet_id=current_user.last_visited_wallet_id
    )

    db.session.add(money)
    db.session.commit()

    return jsonify({"message": "Money added"}), 200
